import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path, { resolve } from "node:path";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron/simple";
import pkg from "./package.json";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  // rmSync("dist-electron", { recursive: true, force: true });

  const isServe = command === "serve";
  const isBuild = command === "build";
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  return {
    build: {
      sourcemap: true,
      rollupOptions: {
        external: ["better-sqlite3"],
      },
    },
    publicDir: "public",
    plugins: [
      react(),
      TanStackRouterVite(),
      electron({
        main: {
          // Shortcut of `build.lib.entry`.
          entry: "backend/main.ts",
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              rollupOptions: {
                external: Object.keys(
                  "dependencies" in pkg ? pkg.dependencies : {}
                ),
              },
            },
          },
        },
        preload: {
          // Shortcut of `build.rollupOptions.input`.
          // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
          input: path.join(__dirname, "backend/preload.ts"),
        },
        // Ployfill the Electron and Node.js API for Renderer process.
        // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
        // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
        renderer:
          process.env.NODE_ENV === "test"
            ? // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
              undefined
            : {},
      }),
    ],
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
        "@resources": resolve(__dirname, "./resources"),
      },
    },
    server: {
      proxy: {
        "/api/torbox": {
          target: "https://api.torbox.app/v1/api",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/torbox/, ""),
          secure: true,
        },
      },
    },
  };
});
