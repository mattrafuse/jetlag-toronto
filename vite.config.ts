/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

export default async () => {
  const tsconfigPath = fileURLToPath(new URL("./tsconfig.json", import.meta.url));
  const tsconfig = JSON.parse((await readFile(tsconfigPath)).toString("utf-8"));

  return defineConfig({
    resolve: {
      alias: Object.fromEntries(
        Object.keys(tsconfig.compilerOptions.paths).map((_path) => {
          const base = _path.replace("/*", "");

          return [base, fileURLToPath(new URL(`./${base}`, import.meta.url))];
        }),
      ),
    },
    server: {
      open: true,
      host: "0.0.0.0",
      allowedHosts: ["jetlag.rafuse.dev"],
      // Proxy API calls to the standalone express resolve server (pnpm server).
      proxy: {
        "/api": "http://localhost:3001",
        "/health": "http://localhost:3001",
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./test/setup.ts"],
      css: false,
    },
  });
};
