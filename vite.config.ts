import { rmSync } from "node:fs";
import path from "node:path";
import tanstackRouter from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron/simple";
import pkg from "./package.json" with { type: "json" };

import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => {
	rmSync("dist-electron", { recursive: true, force: true });

	const isServe = command === "serve";
	const isBuild = command === "build";
	const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

	return {
    base: "./",
		resolve: {
			alias: {
				"@": path.join(__dirname, "src"),
				"@resources": path.join(__dirname, "resources"),
			},
		},
		plugins: [
			tanstackRouter({ target: "react", autoCodeSplitting: true }),
			react({
				babel: {
					plugins: [["babel-plugin-react-compiler"]],
				},
			}),
			tailwindcss(),
			electron({
				main: {
					// Shortcut of `build.lib.entry`
					entry: "electron/main/index.ts",
					onstart(args) {
						if (process.env.VSCODE_DEBUG) {
							console.log(
								/* For `.vscode/.debug.script.mjs` */ "[startup] Electron App",
							);
						} else {
							args.startup();
						}
					},
					vite: {
						resolve: {
							alias: {
								"@/@types": path.resolve(__dirname, "./src/@types"),
								"@resources": path.resolve(__dirname, "./resources"),
								"@backend": path.resolve(__dirname, "./electron"),
							},
						},
						build: {
							sourcemap,
							minify: isBuild,
							outDir: "dist-electron/main",
							rollupOptions: {
								external: Object.keys(
									"dependencies" in pkg ? pkg.dependencies : {},
								),
							},
						},
					},
				},
				preload: {
					// Shortcut of `build.rollupOptions.input`.
					// Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
					input: "electron/preload/index.ts",
					vite: {
						build: {
							sourcemap: sourcemap ? "inline" : undefined, // #332
							minify: isBuild,
							outDir: "dist-electron/preload",
							rollupOptions: {
								external: Object.keys(
									"dependencies" in pkg ? pkg.dependencies : {},
								),
							},
						},
					},
				},
				renderer: {},
			}),
		],
		server: process.env.VSCODE_DEBUG
			? (() => {
					const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL);
					return {
						host: url.hostname,
						port: +url.port,
					};
				})()
			: undefined,
		clearScreen: false,
	};
});
