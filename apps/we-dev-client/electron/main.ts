import { app, BrowserWindow, ipcMain, Menu, nativeTheme } from "electron";
import path from "path";
import { spawn } from "child_process";
import { initialize, enable } from "@electron/remote/main";
import fs from "fs";
import { startLoginServer } from "./loginServer";

// 修改日志路径到 electron 目录

console.log({
  appPath: app.getAppPath(),
  exe: app.getPath("exe"),
  home: app.getPath("home"), // 用户主目录
  appData: app.getPath("appData"), // 应用数据目录
  userData: app.getPath("userData"), // 应用用户数据目录
  temp: app.getPath("temp"), // 临时文件目录
  downloads: app.getPath("downloads"), // 下载目录
  desktop: app.getPath("desktop"), // 桌面目录
  documents: app.getPath("documents"), // 文档目录
});

const logPath = path.join(app.getAppPath(), "../../logs");
const logFile = path.join(
  logPath,
  `app-${new Date().toISOString().split("T")[0]}.log`
);

// 确保日志目录存在
try {
  if (!fs.existsSync(logPath)) {
    fs.mkdirSync(logPath, { recursive: true });
  }
} catch (error) {
  console.error("Failed to create log directory:", error);
}

// 创建日志函数
function logToFile(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  try {
    fs.appendFileSync(logFile, logMessage);
    console.log(logMessage); // 同时输出到控制台
  } catch (error) {
    console.error("Failed to write log:", error);
  }
}

// 记录启动信息
logToFile("sadasd");
logToFile(JSON.stringify(process.env, null, 2));
logToFile("Application starting...");
logToFile(`Log file location: ${logFile}`);
logToFile(`Process arguments: ${process.argv.join(" ")}`);
logToFile(`Electron version: ${process.versions.electron}`);
logToFile(`Chrome version: ${process.versions.chrome}`);
logToFile(`Node version: ${process.versions.node}`);
logToFile(app.getAppPath());
logToFile(__dirname);
logToFile(app.getPath("exe"));

// 捕获未处理的异常
process.on("uncaughtException", (error) => {
  logToFile(`Uncaught Exception: ${error.stack || error.message}`);
});

process.on("unhandledRejection", (error) => {
  logToFile(`Unhandled Rejection: ${error}`);
});

// 在 app ready 之前添加日志
app.on("will-finish-launching", () => {
  logToFile("App will finish launching");
});

let pty: any;
try {
  const ptyNodePath = path.join(__dirname, "../../../node_modules/node-pty");
  pty = require(ptyNodePath);
  console.log(
    "Successfully loaded node-pty from:",
    path.join(__dirname, "../../../node_modules/node-pty")
  );
} catch (error) {
  try {
    const ptyNodePath = path.join(__dirname, "./node_modules/node-pty");
    pty = require(ptyNodePath);
    console.log(
      "Successfully loaded node-pty from:",
      path.join(__dirname, "./node_modules/node-pty")
    );
  } catch (secondError) {
    try {
      const ptyNodePath = path.join(
        app.getAppPath(),
        "../../app.asar.unpacked/node_modules/node-pty"
      );
      pty = require(ptyNodePath);
      console.log(
        "Successfully loaded node-pty from:",
        path.join(
          app.getAppPath(),
          "../../app.asar.unpacked/node_modules/node-pty"
        )
      );
    } catch (error) {
      try {
        pty = require("node-pty");
        console.log("Successfully loaded node-pty from:", "node-pty");
      } catch (secondError) {
        console.error("Failed to load node-pty directly:", secondError);
        pty = {
          spawn: () => {
            throw new Error("node-pty not available");
          },
        };
      }
    }
  }
}

let nowPath = "";
// 存储活跃的进程
const activeProcesses = new Map();

// 存储 pty 实例
const ptyProcesses = new Map<string, any>();

// 初始化 remote 模块
initialize();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  logToFile("Starting to create window");

  try {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: process.env.VITE_DEV_SERVER_URL
          ? path.join(__dirname, "preload.js") // 开发环境
          : path.join(app.getAppPath(), "dist-electron", "preload.js"), // 生产环境
      },
    });

    // 启动登录服务器并传入主窗口实例
    const loginServer = startLoginServer(mainWindow);

    // 添加处理外部URL打开的IPC监听器
    ipcMain.on("open:external:url", (_, url) => {
      const { shell } = require("electron");
      shell.openExternal(url);
    });

    // 当窗口关闭时清理资源
    mainWindow.on("closed", () => {
      mainWindow = null;
      if (loginServer) {
        loginServer.close();
      }
    });

    // 去掉菜单栏
    // Menu.setApplicationMenu(null);
    // 边框采用暗黑
    nativeTheme.themeSource = "dark";

    // 监听窗口加载错误
    mainWindow.webContents.on(
      "did-fail-load",
      (event, errorCode, errorDescription) => {
        logToFile(`Window failed to load: ${errorDescription} (${errorCode})`);
      }
    );

    // 添加窗口错误监听
    mainWindow.on("unresponsive", () => {
      logToFile("Window became unresponsive");
    });

    mainWindow.on("responsive", () => {
      logToFile("Window became responsive");
    });

    // 开发环境下加载本地服务器
    if (process.env.VITE_DEV_SERVER_URL) {
      logToFile(`Loading dev server URL: ${process.env.VITE_DEV_SERVER_URL}`);
      mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
      mainWindow.webContents.openDevTools();
    } else {
      const htmlPath = path.join(__dirname, "../dist/index.html");
      logToFile(`Loading production HTML file: ${htmlPath}`);
      mainWindow.loadFile(htmlPath);
    }

    // 为这个窗口启用 remote 模块
    enable(mainWindow.webContents);

    // 检查文件是否存在
    ipcMain.handle(
      "node-container:check-file-exists",
      async (_event, path: string) => {
        try {
          const fs = require("fs/promises");
          await fs.access(path);
          return true;
        } catch {
          throw new Error("文件不存在");
        }
      }
    );
    // 注册所需的 IPC 处理程序
    ipcMain.handle("node-container:init", async () => {
      // 初始化成功返回
      return true;
    });

    ipcMain.handle("node-container:mkdir", async (_, dirPath, options) => {
      // 处理 mkdir 请求
      const fs = require("fs/promises");
      await fs.mkdir(dirPath, options);
      return true;
    });

    ipcMain.handle(
      "node-container:writeFile",
      async (_, filePath, contents) => {
        // 处理 writeFile 请求
        const fs = require("fs/promises");
        await fs.writeFile(filePath, contents);
        return true;
      }
    );

    ipcMain.handle("node-container:readFile", async (_, filePath, encoding) => {
      // 处理 readFile 请求
      const fs = require("fs/promises");
      return await fs.readFile(filePath, { encoding });
    });

    ipcMain.handle("node-container:readdir", async (_, dirPath, options) => {
      // 处理 readdir 请求
      const fs = require("fs/promises");
      return await fs.readdir(dirPath, options);
    });

    ipcMain.handle("node-container:platform", async () => {
      const os = require("os");
      return os.platform();
    });
    ipcMain.handle("node-container:set-now-path", (_, path) => {
      nowPath = path;
    });

    // 添加获取项目根目录的处理程序
    ipcMain.handle("node-container:get-project-root", () => {
      // 在开发环境中
      if (nowPath) {
        return nowPath;
      }
      if (process.env.VITE_DEV_SERVER_URL) {
        return path.join(process.cwd(), "workspace");
      }
      // 在生产环境中
      return path.join(app.getAppPath(), "../../workspace");
    });

    // 修改 spawn 命令处理程序
    ipcMain.handle(
      "node-container:spawn",
      async (
        event,
        command: string,
        args: string[],
        options: { cwd?: string }
      ) => {
        try {
          console.log(
            "Main Process: Spawning command:",
            command,
            args,
            options
          );
          const proc = spawn(command, args, {
            cwd: process.env.VITE_DEV_SERVER_URL
              ? path.join(process.cwd(), "workspace")
              : path.join(app.getAppPath(), "../../workspace"),
            env: {
              ...process.env,
              PATH: `${process.env.PATH}${path.delimiter}${path.join(app.getAppPath(), "node_modules", ".bin")}`,
              NODE_PATH: path.join(app.getAppPath(), "node_modules"),
            },
            shell: true,
            stdio: ["pipe", "pipe", "pipe"],
          });

          const processId = Math.random().toString(36).substr(2, 9);
          console.log("Main Process: Process ID:", processId);
          activeProcesses.set(processId, proc);

          // 使用 webContents 而不是 event.sender
          const webContents = event.sender;

          proc.stdout.on("data", (data) => {
            const output = data.toString();
            console.log("Main Process: stdout:", output);
            webContents.send(`process-output-${processId}`, output);
          });

          proc.stderr.on("data", (data) => {
            const output = data.toString();
            console.error("Main Process: stderr:", output);
            webContents.send(`process-output-${processId}`, output);
          });

          proc.on("error", (error) => {
            console.error("Main Process: Process error:", error);
            webContents.send(
              `process-output-${processId}`,
              `Error: ${error.message}\n`
            );
          });

          proc.on("close", (code) => {
            console.log("Main Process: Process closed with code:", code);
            activeProcesses.delete(processId);
            webContents.send(`process-exit-${processId}`, code || 0);
          });

          return { processId };
        } catch (error) {
          console.error("Main Process: Spawn error:", error);
          throw error;
        }
      }
    );

    // 添加获取进程退出码的处理程序
    ipcMain.handle(
      "node-container:wait-exit",
      async (event, processId: string) => {
        const proc = activeProcesses.get(processId);
        if (!proc) {
          throw new Error("Process not found");
        }

        return new Promise((resolve) => {
          proc.on("close", (code: any) => {
            activeProcesses.delete(processId);
            resolve(code);
          });
        });
      }
    );

    // 添加终止进程的处理程序
    ipcMain.handle(
      "node-container:kill-process",
      async (event, processId: string) => {
        const proc = activeProcesses.get(processId);
        if (proc) {
          proc.kill();
          activeProcesses.delete(processId);
        }
      }
    );

    // 添加停止进程的处理程序
    ipcMain.handle("node-container:stop-server", async (_, port: number) => {
      if (process.platform === "win32") {
        spawn("taskkill", ["/F", "/PID", port.toString()]);
      } else {
        spawn("kill", ["-9", port.toString()]);
      }
    });

    ipcMain.handle("node-container:stat", async (_, filePath) => {
      const fs = require("fs/promises");
      const stats = await fs.stat(filePath);
      return {
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        size: stats.size,
        mtime: stats.mtime,
      };
    });

    ipcMain.handle("node-container:sync-filesystem", async (event, files) => {
      try {
        const projectRoot = nowPath
          ? nowPath
          : process.env.VITE_DEV_SERVER_URL
            ? path.join(process.cwd(), "workspace")
            : path.join(app.getAppPath(), "../../workspace");

        const fs = require("fs/promises");

        // 确保目录存在
        await fs.mkdir(projectRoot, { recursive: true });

        // 获取现有文件列表
        // @ts-ignore
        async function getAllFiles(dir: string): Promise<string[]> {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          // console.log('Reading directory:', dir, 'entries:', entries.map(e => e.name));
          const files = [];

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const isHiddenNodeModules = [
              "node_modules",
              "dist",
              ".swc",
              ".next",
              ".yaml",
            ];
            if (isHiddenNodeModules.includes(entry.name)) {
              // console.log('Skipping node_modules:', fullPath);
              continue;
            }

            if (entry.isDirectory()) {
              files.push(...(await getAllFiles(fullPath)));
            } else {
              files.push(fullPath);
            }
          }

          return files;
        }

        // 获取所有现有文件
        const existingFiles = await getAllFiles(projectRoot);
        // console.log('Existing files:', existingFiles);

        // 同步所有文件
        for (const [filePath, contents] of Object.entries(files)) {
          if (typeof contents !== "string") {
            console.log("Skipping non-string content:", filePath);
            continue;
          }
          if (filePath.startsWith("node_modules/")) {
            console.log("Skipping node_modules file:", filePath);
            continue;
          }

          const fullPath = path.join(projectRoot, filePath);
          const dirPath = path.dirname(fullPath);

          // console.log('Writing file:', fullPath);
          await fs.mkdir(dirPath, { recursive: true });
          await fs.writeFile(fullPath, contents, "utf-8");

          // 从现有文件列表中移除已处理的文件
          const index = existingFiles.indexOf(fullPath);
          if (index > -1) {
            existingFiles.splice(index, 1);
          }
        }

        // 删除不再需要的文件（排除 node_modules）
        for (const file of existingFiles) {
          const isHiddenNodeModules = [
            "node_modules",
            "dist",
            ".swc",
            ".next",
            "package-lock.json",
            "pnpm-lock.yaml",
          ];
          if (!isHiddenNodeModules.includes(file)) {
            console.log("Removing file:", file);
            await fs.unlink(file);
          }
        }

        // 列出最终的文件
        const finalFiles = await getAllFiles(projectRoot);
        // console.log('Final files after sync:', finalFiles);

        return true;
      } catch (error) {
        // console.error('Failed to sync filesystem:', error);
        throw error;
      }
    });

    // 修改 terminal:create 处理程序
    ipcMain.handle("terminal:create", (_, options) => {
      console.log("terminal:create", options);

      // 获取默认 shell
      let shell = process.platform === "win32" ? "powershell.exe" : "bash";

      // 在 macOS 上检查 zsh
      if (process.platform === "darwin") {
        try {
          const userShell = process.env.SHELL;
          if (userShell && userShell.includes("zsh")) {
            shell = "zsh";
          } else if (fs.existsSync("/bin/zsh")) {
            shell = "zsh";
          }
        } catch (error) {
          console.error("Error detecting shell:", error);
          // 如果检测失败，保持使用 bash 作为后备选项
        }
      }

      const processId = Math.random().toString(36).substr(2, 9);

      // 添加必要的环境变量
      const env = {
        ...process.env,
        PATH: process.env.PATH || "",
      };

      // 如果是 macOS，添加常用的 npm 路径
      if (process.platform === "darwin") {
        const additionalPaths = [
          "/usr/local/bin", // Homebrew 安装的包
          "/opt/homebrew/bin", // Apple Silicon 上的 Homebrew
          "/usr/bin", // 系统二进制文件
          "/bin", // 基本二进制文件
          "/usr/sbin", // 系统管理二进制文件
          "/sbin", // 基本系统管理二进制文件
          `${process.env.HOME}/.npm-global/bin`, // npm 全局安装路径
          `${process.env.HOME}/.nvm/versions/node/*/bin`, // nvm 安装的 node 路径
        ];

        env.PATH = `${additionalPaths.join(":")}:${env.PATH}`;
      }

      const ptyProcess = pty.spawn(shell, [], {
        name: "xterm-color",
        cols: options.cols || 80,
        rows: options.rows || 24,
        cwd: nowPath
          ? nowPath
          : process.env.VITE_DEV_SERVER_URL
            ? path.join(process.cwd(), "workspace")
            : path.join(app.getAppPath(), "../../workspace"),
        env: env, // 使用更新后的环境变量
      });

      ptyProcesses.set(processId, ptyProcess);

      // 转发 pty 输出到渲染进程
      ptyProcess.onData((data: any) => {
        mainWindow.webContents.send(`terminal-output-${processId}`, data);
      });

      return { processId };
    });

    // 处理终端输入
    ipcMain.handle("terminal:write", (_, processId, data) => {
      const ptyProcess = ptyProcesses.get(processId);
      if (ptyProcess) {
        ptyProcess.write(data);
      }
    });

    // 处理终端大小调整
    ipcMain.handle("terminal:resize", (_, processId, cols, rows) => {
      const ptyProcess = ptyProcesses.get(processId);
      if (ptyProcess) {
        ptyProcess.resize(cols, rows);
      }
    });
    // 获取当前目录的上级目录
    ipcMain.handle(
      "node-container:get-parent-paths",
      async (_event, currentPath) => {
        try {
          const parentPath = path.dirname(currentPath); // 上一级目录
          const grandParentPath = path.dirname(parentPath); // 上上级目录
          const lastGrandParentPath = path.dirname(grandParentPath); // 上上上级目录
          return {
            parentPath,
            grandParentPath,
            lastGrandParentPath,
          };
        } catch (error: any) {
          throw new Error(`获取上级目录失败: ${error.message}`);
        }
      }
    );

    // 执行命令行命令
    ipcMain.handle(
      "node-container:exec-command",
      async (_event, command: string) => {
        try {
          const { exec } = require("child_process");
          return new Promise((resolve, reject) => {
            exec(
              command,
              (error: Error | null, stdout: string, stderr: string) => {
                if (error) {
                  reject(error.message);
                  return;
                }
                if (stderr) {
                  reject(stderr);
                  return;
                }
                resolve(stdout);
              }
            );
          });
        } catch (error: any) {
          throw new Error(`命令执行失败: ${error.message}`);
        }
      }
    );
    // 处理终端销毁
    ipcMain.handle("terminal:dispose", (_, processId) => {
      const ptyProcess = ptyProcesses.get(processId);
      if (ptyProcess) {
        ptyProcess.kill();
        ptyProcesses.delete(processId);
      }
    });

    // 当窗口关闭时清理所有 pty 实例
    mainWindow.on("closed", () => {
      for (const ptyProcess of Array.from(ptyProcesses.values())) {
        ptyProcess.kill();
      }
      ptyProcesses.clear();
    });

    // 添加详细日志
    logToFile(`App path: ${app.getAppPath()}`);
    logToFile(`__dirname: ${__dirname}`);
    logToFile(
      `Preload path: ${
        process.env.VITE_DEV_SERVER_URL
          ? path.join(__dirname, "preload.js")
          : path.join(app.getAppPath(), "dist-electron", "preload.js")
      }`
    );
  } catch (error) {
    logToFile(`Error creating window: ${error}`);
    throw error;
  }
}

// 当 Electron 完成初始化时创建窗口
app
  .whenReady()
  .then(() => {
    logToFile("App is ready");
    try {
      createWindow();
    } catch (error) {
      logToFile(`Error in whenReady handler: ${error}`);
    }
  })
  .catch((error) => {
    logToFile(`Failed to initialize app: ${error}`);
  });

// 当所有窗口关闭时退出应用
app.on("window-all-closed", () => {
  logToFile("All windows closed");
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  logToFile("App activated");
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("quit", () => {
  logToFile("App is quitting");

});
