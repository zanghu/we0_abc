import { WebContainer } from '@webcontainer/api';
import type { NodeContainer } from './nodecontainer/types';
import * as webContainer from './webcontainer';
import * as nodeContainer from './nodecontainer';

const isElectron = !!window.electron;

export type Container = WebContainer | NodeContainer;

// 基础导出
export const {
  useTerminalState,
  syncFileSystem,
  updateFileSystemNow,
  startDevServer,
} = isElectron ? nodeContainer : webContainer;

// 容器实例导出
export const getContainerInstance = isElectron 
  ? nodeContainer.getNodeContainerInstance 
  : webContainer.getWebContainerInstance;

// 导出类型和常量
export type { CommandResult } from './webcontainer/types';
export type { NodeContainer } from './nodecontainer/types';
export { WebContainer } from '@webcontainer/api';
