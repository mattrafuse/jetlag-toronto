import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./index.js";
import { parseCoordinates, resolveGoogleMapsUrl } from "./resolve.js";

const GOOGLE_MAPS_PIN = "https://maps.app.goo.gl/Y15MTnA9SVza9PKC6";

describe("parseCoordinates", () => {
  it("extracts lat/lng from a resolved Google Maps search URL", () => {
    const url = "https://www.google.com/maps/search/43.661323,+-79.664893?entry=tts";
    expect(parseCoordinates(url)).toEqual({ lat: 43.661323, lng: -79.664893 });
  });

  it("extracts lat/lng from a /@ maps-view deep link", () => {
    const url = "https://www.google.com/maps/@43.6563644,-79.4494082,2050m/data=!3m1!1e3?entry=ttu";
    expect(parseCoordinates(url)).toEqual({ lat: 43.6563644, lng: -79.4494082 });
  });

  it("extracts lat/lng from a /search URL with extra query params", () => {
    const url =
      "https://www.google.com/maps/search/43.661323,+-79.664893?entry=tts&g_ep=EgoyMDI2&skid=3833a37a";
    expect(parseCoordinates(url)).toEqual({ lat: 43.661323, lng: -79.664893 });
  });

  it("returns null when no coordinates are present", () => {
    expect(parseCoordinates("https://www.google.com/maps")).toBeNull();
  });
});

describe("resolveGoogleMapsUrl (direct URLs, no redirect)", () => {
  it("resolves a /@ maps-view deep link without fetching", async () => {
    const url = "https://www.google.com/maps/@43.6563644,-79.4494082,2050m/data=!3m1!1e3?entry=ttu";
    const result = await resolveGoogleMapsUrl(url, () => {
      throw new Error("should not fetch for direct URLs");
    });
    expect(result).toEqual({ url, lat: 43.6563644, lng: -79.4494082 });
  });

  it("resolves a /search URL with extra params without fetching", async () => {
    const url =
      "https://www.google.com/maps/search/43.661323,+-79.664893?entry=tts&g_ep=EgoyMDI2&skid=3833a37a";
    const result = await resolveGoogleMapsUrl(url, () => {
      throw new Error("should not fetch for direct URLs");
    });
    expect(result).toEqual({ url, lat: 43.661323, lng: -79.664893 });
  });
});

describe("POST /api/resolve (integration)", () => {
  const app = createApp();

  it("resolves a real Google Maps short URL to lat/lng", async () => {
    const res = await request(app).post("/api/resolve").send({ url: GOOGLE_MAPS_PIN });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      lat: expect.closeTo(43.66, 1),
      lng: expect.closeTo(-79.66, 1),
    });
    expect(typeof res.body.url).toBe("string");
    expect(res.body.url).toContain("google.com/maps");
  }, 30000);

  it("returns 400 when the url is missing from the body", async () => {
    const res = await request(app).post("/api/resolve").send({});
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
