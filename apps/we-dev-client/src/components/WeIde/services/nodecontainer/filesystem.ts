const ipcRenderer = (window as any)?.electron?.ipcRenderer;
import { useFileStore } from '../../stores/fileStore';
import { add, debounce } from 'lodash';

// 存储文件的 MD5 值
(window as any).fileHashMap = new Map<string, string>();

// 计算文件内容的 MD5
async function calculateMD5(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

let frist = true;
// 将递归函数移到外部
async function readDirRecursive(
  dirPath: string,
  filesObj: Record<string, string>,
  projectRoot: string
): Promise<{ path: string; content: string }[]> {
  const files: { path: string; content: string }[] = [];
  const entries = await ipcRenderer.invoke('node-container:readdir', dirPath);
  
  for (const entry of entries) {
    const fullPath = dirPath + (dirPath.endsWith('/') ? '' : '/') + entry;
    const isHiddenNodeModules = ['node_modules', 'dist', '.swc', '.next', 'package-lock.json', 'pnpm-lock.yaml']
    if (isHiddenNodeModules.includes(entry)) continue;
    
    try {
      const stats = await ipcRenderer.invoke('node-container:stat', fullPath);
      if (stats && stats.isDirectory) {
        const subFiles = await readDirRecursive(fullPath, filesObj, projectRoot);
        files.push(...subFiles);
      } else {
        const content = await ipcRenderer.invoke('node-container:readFile', fullPath, 'utf-8');
        // 计算新的 MD5 并比较
        const newHash = await calculateMD5(content || '&empty');
        const oldHash = (window as any).fileHashMap.get(fullPath);
        const fileHash = await calculateMD5(filesObj[fullPath.replace((projectRoot.startsWith('/') ? projectRoot.substring(1) : projectRoot)  + '/', '').substring(1)] || '&empty');

        if ((oldHash !== newHash && fileHash !== newHash)) {
          files.push({
            path: fullPath.startsWith('/') ? fullPath.slice(1) : fullPath,
            content
          });
          (window as any).fileHashMap.set(fullPath, newHash);
        }
      }
    } catch (error) {
      console.warn(`Failed to process ${fullPath}:`, error);
    }
  }
  return files;
}

// 创建防抖版本的 updateFileSystemNow
const debouncedUpdateFileSystem = debounce(async () => {
  const { updateContent, addFile, files: filesObj } = useFileStore.getState();

  try {
    const projectRoot = await ipcRenderer.invoke('node-container:get-project-root');
    const files = await readDirRecursive(projectRoot, filesObj, projectRoot);
    // console.log(projectRoot, 'projectRoot');

    // 更新文件存储
    if (files.length > 0) {
      for (const file of files) {
        if (frist) {
          addFile(file.path.replace((projectRoot.startsWith('/') ? projectRoot.substring(1) : projectRoot) + '/', ''), file.content, true);
        } else {
          updateContent(file.path.replace((projectRoot.startsWith('/') ? projectRoot.substring(1) : projectRoot) + '/', ''), file.content, true);
        }
      }
      frist = false;
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
  try {
    const { files } = useFileStore.getState();
    await ipcRenderer.invoke('node-container:sync-filesystem', files);
    if (!close && !(window as any).isLoading) {
      updateFileSystemNow();
    }
    return true;
  } catch (error) {
    console.error('Failed to sync file system:', error);
    return false;
  }
}, 500);

// 导出防抖版本
export const syncFileSystem = debouncedSyncFileSystem;
