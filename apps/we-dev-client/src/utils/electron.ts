/**
 * 检查当前是否在 Electron 环境中运行
 * @returns {boolean} 如果在 Electron 环境中返回 true，否则返回 false
 */
export const getIsElectron = (): boolean => {
  // 检查 window.electron 对象是否存在
  if (window?.electron) {
    return true;
  }

  // 检查 process.versions.electron
  if (window?.process?.versions?.electron) {
    return true;
  }

  // 检查 navigator.userAgent
  if (navigator.userAgent.toLowerCase().indexOf(" electron/") > -1) {
    return true;
  }

  return false;
};
