/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

export default async () => {
  const tsconfigPath = fileURLToPath(new URL("./tsconfig.json", import.meta.url));
  const tsconfig = JSON.parse((await readFile(tsconfigPath)).toString("utf-8"));

  const alias = Object.fromEntries(
    Object.entries<[string, string[]]>(tsconfig.compilerOptions.paths).map(([_path, entries]) => {
      const isFile = entries[0].includes(".ts");
      const base = isFile ? _path : _path.replace("/*", "");

      return [base, fileURLToPath(new URL(`./${isFile ? entries[0] : base}`, import.meta.url))];
    }),
  );

  return defineConfig({
    resolve: {
      alias,
    },
    server: {
      open: true,
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
