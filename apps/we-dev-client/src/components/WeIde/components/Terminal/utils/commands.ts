import { Terminal } from '@xterm/xterm';
import { updateFileSystemNow } from '../../../services';
import { getWebContainerInstance } from '../../../services/webcontainer';
import { IPty } from 'node-pty';
import { getNodeContainerInstance } from '../../../services/nodecontainer';

interface CommandResult {
  output: string[];
  exitCode: number;
}



let nowTerminal: Terminal | null = null;

let nowProcessId: string | null = null;


let initId = ''
let ptyProcess: IPty | null = null;

interface ElectronWindow {
  [key: string]: any;
  electron?: {
    ipcRenderer: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, callback: (data: any) => void) => void;
      removeListener: (channel: string, func: (...args: any[]) => void) => void;
      send: (channel: string, ...args: any[]) => void;
    };
  };
}

declare const window: ElectronWindow;

// 移除 ANSI 转义序列和时间戳的辅助函数
function stripAnsi(str: string): string {
  str = str.replace(/\u001b\[\d+m/g, '');
  // 检查是否以时间戳开头（HH:MM:SS 格式）
  if (/^\d{2}:\d{2}:\d{2}\s/.test(str)) {
    // 如果有时间戳，移除它
    str = str.replace(/^\d{2}:\d{2}:\d{2}\s+/, '');
  }
  // 移除 ANSI 转义序列
  return str;
}

export async function waitCommand(terminal: Terminal, addError?: (error: any) => void) {
  console.log('syncFileSystem', window.electron);
  if (window.electron) {
    return await nodeWaitCommand(terminal, addError);
  } else {
    return await webWaitCommand(terminal, addError);
  }
}

export async function webWaitCommand(terminal: Terminal, addError?: (error: any) => void) {
  nowTerminal = terminal;
  const instance = await getWebContainerInstance();
  const process = await instance?.spawn('/bin/jsh', [], {
    terminal: {
      cols: 80,
      rows: 15,
    },
  });
  const input = process?.input.getWriter();
  const output = process?.output;

  output?.pipeTo(
    new WritableStream({

      write(data) {
        if (data.includes('error') && addError) {
          addError({
            message: 'compile error',
            code: stripAnsi(data),
            severity: 'error',
          })
        }
        if (!initId) {
          initId = data?.split('/')[1].split('[39m')[0].trim()
        }
        updateFileSystemNow();
        terminal.write(data.replaceAll(initId, 'weDev'))
      },
    }),
  );

  terminal.onData((data) => {
    input?.write(data)
  });
}

export async function newTerminal() {
  // 退出当前终端
  const electron = window.electron as any;

  const instance = await getNodeContainerInstance();


  electron.ipcRenderer.invoke('terminal:write', nowProcessId, 'clear' + '\n');

  electron.ipcRenderer.invoke('terminal:write', nowProcessId, 'exit' + '\n');


  
  setTimeout(async () => {
    electron.ipcRenderer.invoke('terminal:dispose', nowProcessId);
    nowProcessId = null;
    const { invoke } = electron.ipcRenderer;

    const { processId } = await invoke('terminal:create', {
      cols: nowTerminal?.cols,
      rows: nowTerminal?.rows
    });

    const terminal = nowTerminal as Terminal;

    nowProcessId = processId;

    electron.ipcRenderer.on(`terminal-output-${processId}`, (data: string) => {
      updateFileSystemNow();
      terminal.write(data);
      if (data.includes('error') && AddErrorFunc) {

        AddErrorFunc({
          message: 'compile error',
          code: stripAnsi(data),
          severity: 'error',
        })
      }
      const cleanData = stripAnsi(data);
      const urlMatch = cleanData.match(
        /localhost:(\d+)|127\.0\.0\.1:(\d+)|0\.0\.0\.0:(\d+)/
      );

      if (urlMatch) {
        const port = urlMatch[1] || urlMatch[2] || urlMatch[3];
        const url = `http://localhost:${port}`;
        instance?.emit('server-ready', parseInt(port), url);
      }
    });


    electron.ipcRenderer.invoke('terminal:resize', processId, terminal.cols, terminal.rows);
    // 监听终端大小改变

  
  }, 300);

  // 监听终端输入

}

let AddErrorFunc: any;


export async function nodeWaitCommand(terminal: Terminal, addError?: (error: any) => void) {
  // const { files, addError } = useFileStore();
  nowTerminal = terminal;

  const instance = await getNodeContainerInstance();
  // const electron: any = window || {};
  const electron = window.electron as any;

  electron.ipcRenderer.invoke('terminal:write', nowProcessId, 'clear');

  electron.ipcRenderer.invoke('terminal:write', nowProcessId, 'exit');

  const { invoke } = electron.ipcRenderer;

  const { processId } = await invoke('terminal:create', {
    cols: nowTerminal?.cols,
    rows: nowTerminal?.rows
  });

  const cols = terminal.cols;
  const rows = terminal.rows;

  nowProcessId = processId;
  
  electron.ipcRenderer.on(`terminal-output-${nowProcessId}`, (data: string) => {

    updateFileSystemNow();
    terminal.write(data);
    if (data.includes('error') && addError) {

      addError({
        message: 'compile error',
        code: stripAnsi(data),
        severity: 'error',
      })
    }
    const cleanData = stripAnsi(data);
    const urlMatch = cleanData.match(
      /localhost:(\d+)|127\.0\.0\.1:(\d+)|0\.0\.0\.0:(\d+)/
    );

    if (urlMatch) {
      const port = urlMatch[1] || urlMatch[2] || urlMatch[3];
      const url = `http://localhost:${port}`;
      instance?.emit('server-ready', parseInt(port), url);
    }
  });

  // 监听终端输入
  terminal.onData((data) => {
    console.log('data', data);
    electron.ipcRenderer.invoke('terminal:write', nowProcessId, data);

  });

  electron.ipcRenderer.invoke('terminal:resize', processId, cols, rows);
  // 监听终端大小改变
  terminal.onResize(({ cols, rows }) => {
    electron.ipcRenderer.invoke('terminal:resize', nowProcessId, cols, rows);
  });

}



export async function executeCommand(command: string): Promise<CommandResult> {
  if ('electron' in window) {
    // 对于 Electron 环境
    const { invoke } = window.electron!.ipcRenderer;
    const output: string[] = [];

    // 写入命令到终端
    if (nowProcessId) {
      await invoke('terminal:write', nowProcessId, command + '\n');
    }

    // 监听命令输出
    window.electron!.ipcRenderer.on(`terminal-output-${nowProcessId}`, (data: string) => {
      output.push(data);
    });

    // 等待命令执行完成（这里可能需要根据实际情况调整）
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      output,
      exitCode: 0
    };
  } else {
    // 对于 WebContainer 环境
    const instance = await getWebContainerInstance();
    const { exit, output }: any = await instance?.spawn(command.split(' ')[0], command.split(' ').slice(1));

    const outputArray: string[] = [];
    for await (const chunk of output) {
      outputArray.push(chunk);
      if (nowTerminal) {
        nowTerminal.write(chunk);
      }
    }

    return {
      output: outputArray,
      exitCode: exit
    };
  }
}
