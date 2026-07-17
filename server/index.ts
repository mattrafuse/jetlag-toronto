import express from "express";
import { resolveGoogleMapsUrl } from "./resolve.ts";

export const createApp = () => {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  /**
   * Accepts a Google Maps short URL and returns the lat/lng it resolves to.
   *
   * JSON body:
   *   { "url": "https://maps.app.goo.gl/..." }
   */
  app.post("/api/resolve", async (req, res) => {
    const url = typeof req.body?.url === "string" ? req.body.url : undefined;

    if (!url) {
      res.status(400).json({ error: "Missing required 'url' in request body" });
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
};

// Only start listening when run directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 3001);
  const app = createApp();
  app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
  });
}
