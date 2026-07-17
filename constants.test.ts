import { describe, expect, it } from "vitest";
import { EXCLUSION_RADIUS_FRACTION, MILES_TO_KM, OUTER_BOUNDS, QUARTER_MILE } from "./constants";

// ── constants ──────────────────────────────────────────────────
describe("constants", () => {
  it("defines a quarter mile in metres", () => {
    expect(QUARTER_MILE).toBeCloseTo(402.336, 3);
  });

  it("defines the exclusion radius fraction just under 1", () => {
    expect(EXCLUSION_RADIUS_FRACTION).toBeGreaterThan(0);
    expect(EXCLUSION_RADIUS_FRACTION).toBeLessThanOrEqual(1);
  });

  it("defines miles-to-km conversion", () => {
    expect(MILES_TO_KM).toBeCloseTo(1.60934, 4);
  });

  it("defines a world-bounding box as a closed ring", () => {
    expect(OUTER_BOUNDS[0]).toEqual(OUTER_BOUNDS[OUTER_BOUNDS.length - 1]);
    expect(OUTER_BOUNDS.length).toBeGreaterThanOrEqual(5);
  });
});
