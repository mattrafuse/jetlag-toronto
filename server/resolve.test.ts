import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./index.js";
import { parseCoordinates, resolveGoogleMapsUrl } from "./resolve.js";

const GOOGLE_MAPS_PIN = "https://maps.app.goo.gl/Y15MTnA9SVza9PKC6";

describe("parseCoordinates", () => {
  it("extracts lat/lng from a resolved Google Maps search URL", () => {
    const url = "https://www.google.com/maps/search/43.661323,+-79.664893?entry=tts";
    expect(parseCoordinates(url)).toEqual({ lat: 43.661323, lng: -79.664893 });
  });

  it("returns null when no coordinates are present", () => {
    expect(parseCoordinates("https://www.google.com/maps")).toBeNull();
  });
});

describe("GET /api/resolve (integration)", () => {
  const app = createApp();

  it("resolves a real Google Maps short URL to lat/lng", async () => {
    const res = await request(app).get("/api/resolve").query({ url: GOOGLE_MAPS_PIN });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      lat: expect.closeTo(43.66, 1),
      lng: expect.closeTo(-79.66, 1),
    });
    expect(typeof res.body.url).toBe("string");
    expect(res.body.url).toContain("google.com/maps");
  }, 30000);

  it("returns 400 when the url parameter is missing", async () => {
    const res = await request(app).get("/api/resolve");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/url/i);
  });
});

describe("resolveGoogleMapsUrl (integration)", () => {
  it("follows the redirect and returns coordinates for a live URL", async () => {
    const result = await resolveGoogleMapsUrl(GOOGLE_MAPS_PIN);
    expect(result.lat).toBeCloseTo(43.66, 1);
    expect(result.lng).toBeCloseTo(-79.66, 1);
  }, 30000);
});
