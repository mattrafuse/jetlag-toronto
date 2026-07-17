/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import type { Plugin } from "vite";
import { createApp } from "./server/index.js";

/**
 * Mounts the express resolve server as middleware in the Vite dev (and preview)
 * server so the UI can call `/api/resolve` from the same origin with a single
 * `pnpm dev` command. Requests outside the API surface fall through to Vite.
 */
function jetlagApiServer(): Plugin {
  return {
    name: "jetlag-api-server",
    configureServer(server) {
      const app = createApp();
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        if (url.startsWith("/api") || url.startsWith("/health")) {
          app(req, res, next);
        } else {
          next();
        }
      });
    },
    configurePreviewServer(server) {
      const app = createApp();
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        if (url.startsWith("/api") || url.startsWith("/health")) {
          app(req, res, next);
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [jetlagApiServer()],
  server: {
    open: true,
    host: "0.0.0.0",
    allowedHosts: ["jetlag.rafuse.dev"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    css: false,
  },
});
