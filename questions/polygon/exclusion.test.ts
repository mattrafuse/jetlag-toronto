import * as turf from "@turf/turf";
import { describe, expect, it } from "vitest";
import { computePolygonExclusion } from "./exclusion";

// A small triangle in the Toronto area, expressed as [lat, lng] rings.
// Note: the game border is the Toronto city limits, so these coordinates
// must fall inside it for the clipping to keep the shape intact.
const TRIANGLE: [number, number][][] = [
  [
    [43.65, -79.4],
    [43.7, -79.4],
    [43.675, -79.35],
    [43.65, -79.4],
  ],
];

describe("computePolygonExclusion", () => {
  it("returns a Polygon feature for 'no'", () => {
    const result = computePolygonExclusion(TRIANGLE, "no");
    expect(result.geometry.type).toBe("Polygon");
  });

  it("returns a Polygon feature for 'yes'", () => {
    const result = computePolygonExclusion(TRIANGLE, "yes");
    expect(result.geometry.type).toBe("Polygon");
  });

  it("for 'no': a point inside the drawn polygon is inside the exclusion zone", () => {
    const polygon = computePolygonExclusion(TRIANGLE, "no");
    const insidePoint = turf.point([-79.39, 43.67]); // centroid-ish
    expect(turf.booleanWithin(insidePoint, polygon)).toBe(true);
  });

  it("for 'no': a point outside the drawn polygon is NOT inside the exclusion zone", () => {
    const polygon = computePolygonExclusion(TRIANGLE, "no");
    const outsidePoint = turf.point([-79.5, 43.6]);
    expect(turf.booleanWithin(outsidePoint, polygon)).toBe(false);
  });

  it("for 'yes': a point inside the drawn polygon is NOT inside the exclusion zone (it's the hole)", () => {
    const polygon = computePolygonExclusion(TRIANGLE, "yes");
    const insidePoint = turf.point([-79.39, 43.67]);
    expect(turf.booleanWithin(insidePoint, polygon)).toBe(false);
  });

  it("for 'yes': a point outside the drawn polygon but inside the game border is excluded", () => {
    const polygon = computePolygonExclusion(TRIANGLE, "yes");
    // lng -79.45 is inside the Toronto border but west of the triangle (which
    // starts at lng -79.4), so it should be excluded.
    const outsidePoint = turf.point([-79.45, 43.66]);
    expect(turf.booleanWithin(outsidePoint, polygon)).toBe(true);
  });

  it("'no' polygon coordinates are within valid GeoJSON range", () => {
    const polygon = computePolygonExclusion(TRIANGLE, "no");
    for (const ring of polygon.geometry.coordinates) {
      for (const [lng, lat] of ring as number[][]) {
        expect(lng).toBeGreaterThanOrEqual(-180);
        expect(lng).toBeLessThanOrEqual(180);
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);
      }
    }
  });

  it("'yes' polygon coordinates are within valid GeoJSON range", () => {
    const polygon = computePolygonExclusion(TRIANGLE, "yes");
    for (const ring of polygon.geometry.coordinates) {
      for (const [lng, lat] of ring as number[][]) {
        expect(lng).toBeGreaterThanOrEqual(-180);
        expect(lng).toBeLessThanOrEqual(180);
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);
      }
    }
  });
});
