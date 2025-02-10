import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron";
import path from "path";
import { viteCommonjs } from "@originjs/vite-plugin-commonjs";
// import { checkClassnameTranslate } from "./i18n"; // 导入你刚刚创建的插件

// 判断是否在 electron 环境中运行
const isElectron = process.env.npm_lifecycle_event?.startsWith("electron:");

console.log("isElectron", isElectron);

export default defineConfig(async ({ mode }) => {
  const glslPlugin = (await import("vite-plugin-glsl")).default;
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), "");

  // 将环境变量注入到 process.env
  process.env = { ...process.env, ...env };

  return {
    plugins: [
      // CommonJS 插件，确保先处理其他插件的代码
      viteCommonjs(),
      // checkClassnameTranslate(),
      // 处理动态 import 插件
      {
        name: "handle-dynamic-imports",
        transform(code, id) {
          if (id.includes("generateJSX.ts")) {
            return {
              code: code.replace(
                /import.*from ['"]\.\/images\/\${imageName}['"];?/g,
                "const image = await import(`./images/${imageName}`);"
              ),
              map: null,
            };
          }
        },
      },

      // GLSL 插件，用于处理 shader 文件
      glslPlugin({
        include: [
          "**/*.glsl",
          "**/*.wgsl",
          "**/*.vert",
          "**/*.frag",
          "**/*.vs",
          "**/*.fs",
        ],
        exclude: undefined,
        warnDuplicatedImports: true,
        defaultExtension: "glsl",
        compress: false,
        watch: true,
        root: "/",
      }),

      // React 插件
      react(),

      // Electron 插件配置
      electron([
        {
          // Main process entry file of the Electron App
          entry: "electron/main.ts",
        },
        {
          entry: "electron/preload.ts",
          onstart(options) {
            options.reload();
          },
        },
      ]),
    ],

    base: "./", // 添加 base 路径，适用于相对路径
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        external: ["@electron/remote", "electron"], // 外部依赖
        output: {
          manualChunks(id) {
            if (id.includes("workspace/")) {
              return null; // 不做拆分，放到一个 chunk 中
            }
          },
        },
      },
      copyPublicDir: true, // 复制 public 文件夹中的内容
      assetsDir: "assets", // 静态资源目录
    },

    server: {
      headers: isElectron
        ? {}
        : {
            "Cross-Origin-Embedder-Policy": "credentialless", // 安全头部设置
            "Cross-Origin-Opener-Policy": "same-origin",
          },
      watch: {
        ignored: ["**/workspace/**"], // 忽略某些文件夹
      },
    },

    css: {
      postcss: {
        plugins: [require("tailwindcss"), require("autoprefixer")], // 使用 Tailwind 和 Autoprefixer
      },
    },

    define: {
      "process.env": env,
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"), // 别名配置
        "@sketch-hq/sketch-file-format-ts": "@sketch-hq/sketch-file-format-ts",
        "ag-psd": "ag-psd",
        "@electron/remote": "@electron/remote/main",
      },
    },

    optimizeDeps: {
      include: [
        "uuid",
        "@sketch-hq/sketch-file-format-ts",
        "ag-psd",
        "@codemirror/state",
        "seedrandom"
      ],
      exclude: ["@electron/remote", "electron"],
      esbuildOptions: {
        target: "esnext", // 设置 esbuild 目标
      },
    },

    publicDir: path.resolve(__dirname, "workspace"), // 公共文件夹路径
  };
});
