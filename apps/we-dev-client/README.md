# 超级大坑

当你满心欢喜使用了`pnpm i`安装好了依赖，一定报错，请按照如下方法修复

- electron 修复：https://github.com/pangxieju/electron-fix
- mac 配置修改：

```
"postinstall": "electron-rebuild -f -w node-pty --arch=arm64"
"mac": {
      "target": "dir",
      "arch": [
        "arm64"
      ]
    }
```

- windows:
