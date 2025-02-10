import http from "http";
import path from "path";
import fs from "fs";
import { BrowserWindow } from "electron";

// React组件的HTML模板
const htmlTemplate = `
<!DOCTYPE html>
<html>
<head></head>
    <meta charset="UTF-8">
    <title>登录成功</title>
    <script src="https://unpkg.com/react@17/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/babel-standalone@6.26.0/babel.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: #000000;
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        }

        .success-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: linear-gradient(180deg, #000000 0%, #111111 100%);
            padding: 24px;
        }

        .success-icon-container {
            width: 48px;
            height: 48px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
            animation: fadeIn 0.6s ease-out, scaleIn 0.6s ease-out;
        }

        .success-icon {
            color: #10B981;
            font-size: 24px;
        }

        .success-message {
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 12px;
            opacity: 0;
            animation: fadeIn 0.6s ease-out 0.2s forwards;
        }

        .success-description {
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
            text-align: center;
            opacity: 0;
            animation: fadeIn 0.6s ease-out 0.4s forwards;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes scaleIn {
            from {
                transform: scale(0.8);
            }
            to {
                transform: scale(1);
            }
        }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        function LoginSuccess() {
            return (
                <div className="success-container">
                    <div className="success-icon-container">
                        <div className="success-icon">✓</div>
                    </div>
                    <h1 className="success-message">登录成功</h1>
                    <p className="success-description">请返回应用程序继续操作</p>
                </div>
            );
        }

        ReactDOM.render(<LoginSuccess />, document.getElementById('root'));
    </script>
</body>
</html>
`;

export function startLoginServer(mainWindow: BrowserWindow) {
  const server = http.createServer((req, res) => {
    if (req.url?.startsWith("/auth/callback")) {
      const url = new URL(req.url, `http://127.0.0.1:12900`);
      const token = url.searchParams.get("token");

      console.log("收到登录回调，token:", token);

      // 通过 IPC 发送 token 到渲染进程
      if (token && mainWindow) {
        console.log("准备发送 token 到渲染进程:", token);
        mainWindow.webContents.send("login:callback", token);
      }

      // 返回React页面
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(htmlTemplate);
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  server.listen(12900, () => {
    console.log("登录服务器启动在端口 12900");
  });

  return server;
}



