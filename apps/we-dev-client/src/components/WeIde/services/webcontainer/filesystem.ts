import { WebContainer } from '@webcontainer/api';
import { useFileStore } from '../../stores/fileStore';
import { getWebContainerInstance } from './instance';
import { debounce } from 'lodash';

import {isHiddenNodeModules} from "../../../../../config/electronOrSrcCommonConfig"

// 存储文件的 MD5 值
const fileHashMap = new Map<string, string>();

// 计算文件内容的 MD5
async function calculateMD5(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function mountFileSystem(instance: WebContainer, close: boolean = false): Promise<boolean> {
  try {
    const { files } = useFileStore.getState();

    if (!files) {
      console.error('Files object is undefined or null');
      return false;
    }


    // 准备文件系统结构
    const fileTree: Record<string, any> = {};

    for (const [path, contents] of Object.entries(files)) {
      if (typeof contents !== 'string') continue;

      // 计算新文件的 MD5
      const newHash = await calculateMD5(contents);
      const oldHash = fileHashMap.get(path);

      // 如果文件内容没有变化，跳过
      if (oldHash === newHash) {
        console.log(`File ${path} unchanged, skipping...`);
        continue;
      }

      // 更新 MD5 记录
      fileHashMap.set(path, newHash);

      const parts = path.split('/');
      let currentPath = '';
      let current = fileTree;

      // 处理每一层路径
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (i === parts.length - 1) {
          // 这是文件
          current[part] = {
            file: {
              contents: contents
            }
          };
        } else {
          // 这是目录
          if (!current[part]) {
            current[part] = {
              directory: {}
            };
          }
          current = current[part].directory;
        }
      }
    }

    if (Object.keys(fileTree).length > 0) {
      console.log('Mounting changed files:', fileTree);
      // 只挂载发生变化的文件
      await instance.mount(fileTree, {
        mountPoint: '/'
      });
    } else {
      // console.log('No files changed, skipping mount');
    }

    if (!close && !(window as any).isLoading) {
      updateFileSystemNow();
    }

    return true;
  } catch (error) {
    console.error('Failed to mount file system:', error);
    return false;
  }
}

// 将递归函数移到外部
const readDirRecursive = async (
  instance: WebContainer,
  dirPath: string,
  filesObj: Record<string, string>
): Promise<{ path: string; content: string }[]> => {
  const files: { path: string; content: string }[] = [];
  const entries = await instance?.fs.readdir(dirPath, { withFileTypes: true }) || [];

  for (const entry of entries) {
    const fullPath = `${dirPath}/${entry.name}`;

    if (isHiddenNodeModules.some(item => entry?.name?.indexOf(item) > -1)) continue;

    if (entry.isDirectory()) {
      const subFiles = await readDirRecursive(instance, fullPath, filesObj);
      files.push(...subFiles);
    } else {
      try {
        const content = await instance?.fs.readFile(fullPath, 'utf-8') || '';
        const newHash = await calculateMD5(content);
        const oldHash = fileHashMap.get(fullPath);
        const fileHash = await calculateMD5(filesObj[fullPath.substring(1)]);

        if (oldHash !== newHash && fileHash !== newHash) {
          files.push({
            path: fullPath.startsWith('/') ? fullPath.slice(1) : fullPath,
            content
          });
        }
        fileHashMap.set(fullPath, newHash);
      } catch (error) {
        console.warn(`Failed to read file ${fullPath}:`, error);
      }
    }
  }
  return files;
};

// 创建防抖版本的 updateFileSystemNow
const debouncedUpdateFileSystem = debounce(async () => {
  if((window as any).isLoading) {
    return
  }
  console.log('updateFileSystemNow555');
  const { updateContent, files: filesObj } = useFileStore.getState();
  const instance = await getWebContainerInstance();
  if (!instance) return;

  try {
    // 从根目录开始读取
    const files = await readDirRecursive(instance, '/', filesObj);
    console.log(files);

    // 更新文件存储
    if (files.length > 0) {
      // console.log('Updating files:', files.map(f => f.path));
      // 逐个更新文件
      for (const file of files) {
        updateContent(file.path.substring(1), file.content);
      }
    } else {
      // console.log('No files changed');
    }
  } catch (error) {
    console.error('Failed to update files:', error);
  }
}, 500);

// 导出防抖版本
export const updateFileSystemNow = debouncedUpdateFileSystem;

// 创建防抖版本的 syncFileSystem
const debouncedSyncFileSystem = debounce(async (close: boolean = false): Promise<boolean> => {
  console.log('syncFileSystem');
  const instance = await getWebContainerInstance();
  if (!instance) return false;

  const result = await mountFileSystem(instance, close);
  return result;

}, 500);

// 导出防抖版本
export const syncFileSystem = debouncedSyncFileSystem;
