import express from "express";
import { resolveGoogleMapsUrl } from "./resolve.js";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  /**
   * Accepts a Google Maps short URL and returns the lat/lng it resolves to.
   *
   * Query params:
   *   url - the maps.app.goo.gl (or other Google Maps) URL to resolve
   */
  app.get("/api/resolve", async (req, res) => {
    const url = typeof req.query.url === "string" ? req.query.url : undefined;

    if (!url) {
      res.status(400).json({ error: "Missing required 'url' query parameter" });
      return;
    }

    try {
      const result = await resolveGoogleMapsUrl(url);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resolve URL";
      res.status(502).json({ error: message });
    }
  });

  return app;
}

// Only start listening when run directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 3001);
  const app = createApp();
  app.listen(port, () => {
    console.log(`jetlag-ui resolve server listening on http://localhost:${port}`);
  });
}
