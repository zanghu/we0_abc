import { contextBridge, ipcRenderer } from "electron";
import { dialog } from "@electron/remote";

// 创建一个事件映射来跟踪监听器
const listeners = new Map<string, Function[]>();

contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => {
      return ipcRenderer.invoke(channel, ...args);
    },
    on: (channel: string, func: Function) => {
      // 保存监听器引用
      if (!listeners.has(channel)) {
        listeners.set(channel, []);
      }
      const wrappedFunc = (_: any, ...args: any[]) => func(...args);
      listeners.get(channel)?.push(wrappedFunc);
      ipcRenderer.on(channel, wrappedFunc);
    },
    removeListener: (channel: string, func: Function) => {
      const wrappedFuncs = listeners.get(channel) || [];
      const index = wrappedFuncs.indexOf(func as any);
      if (index > -1) {
        const wrappedFunc = wrappedFuncs[index];
        ipcRenderer.removeListener(channel, wrappedFunc as any);
        wrappedFuncs.splice(index, 1);
      }
    },
    send: (channel: string, ...args: any[]) => {
      ipcRenderer.send(channel, ...args);
    },
    "terminal:create": (options: any) =>
      ipcRenderer.invoke("terminal:create", options),
    "terminal:write": (processId: string, data: string) =>
      ipcRenderer.invoke("terminal:write", processId, data),
    "terminal:resize": (processId: string, cols: number, rows: number) =>
      ipcRenderer.invoke("terminal:resize", processId, cols, rows),
    "terminal:dispose": (processId: string) =>
      ipcRenderer.invoke("terminal:dispose", processId),
  },
});

// 清理函数
window.addEventListener("unload", () => {
  listeners.forEach((funcs, channel) => {
    funcs.forEach(func => {
      ipcRenderer.removeListener(channel, func as any);
    });
  });
  listeners.clear();
});

window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, process.versions[type] as string);
  }
});

// 安全地暴露 API 到渲染进程
contextBridge.exposeInMainWorld("myAPI", {
  dialog: {
    showOpenDialog: (options: any) => dialog.showOpenDialog(options),
  },
});
