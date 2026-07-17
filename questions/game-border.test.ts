import { describe, expect, it } from "vitest";
import { gameBorder } from "./game-border";

// ── game-border ────────────────────────────────────────────────
describe("gameBorder", () => {
  it("is a GeoJSON polygon feature", () => {
    expect(gameBorder.type).toBe("Feature");
    expect(gameBorder.geometry.type).toBe("Polygon");
  });

  it("extracts the inner (hole) ring as the game area", () => {
    const rings = gameBorder.geometry.coordinates;
    expect(rings.length).toBeGreaterThan(0);
    // Each ring is a closed linear ring (first === last coordinate).
    for (const ring of rings) {
      const first = ring[0];
      const last = ring[ring.length - 1];
      expect(first).toEqual(last);
    }
  });
});
