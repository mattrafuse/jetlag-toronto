import * as turf from "@turf/turf";
import { describe, expect, it } from "vitest";

// NOTE: No mock here — we use the real clipToGameBorder so we can detect
// whether clipping introduces perpendicularity / half-plane errors.
import { computeThermometerExclusion } from "./exclusion";

// Convert a [lat, lng] point to GeoJSON [lng, lat].
const toLngLat = (p: [number, number]): [number, number] => [p[1], p[0]];

// Angle (in degrees) between two 2D vectors. Perpendicular vectors yield 90°.
const angleBetweenDeg = (v1: [number, number], v2: [number, number]): number => {
  const dot = v1[0] * v2[0] + v1[1] * v2[1];
  const mag1 = Math.hypot(v1[0], v1[1]);
  const mag2 = Math.hypot(v2[0], v2[1]);
  const cos = dot / (mag1 * mag2);
  return Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI);
};

// Find the edge of `ring` whose direction is closest to perpendicular to `abDir`.
// Returns the angle between that edge and AB (ideally ~90°), or null if the
// ring has no usable edges.
const bestPerpendicularAngle = (ring: number[][], abDir: [number, number]): number | null => {
  let best: number | null = null;
  let bestDeviation = Infinity;
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i];
    const b = ring[i + 1];
    const edgeDir: [number, number] = [b[0] - a[0], b[1] - a[1]];
    if (Math.hypot(edgeDir[0], edgeDir[1]) === 0) continue;
    const angle = angleBetweenDeg(abDir, edgeDir);
    const deviation = Math.abs(angle - 90);
    if (deviation < bestDeviation) {
      bestDeviation = deviation;
      best = angle;
    }
  }
  return best;
};

describe("computeThermometerExclusion: 360° with real clipToGameBorder", () => {
  // Center point well inside the Toronto game area [lat, lng].
  const CENTER: [number, number] = [43.7, -79.4];
  // Segment length in degrees — small enough that both endpoints stay inside
  // the game border so the half-plane containment checks are meaningful.
  const d = 0.02;

  for (let theta = 0; theta < 360; theta++) {
    it(`clipped bisector is ~90° off AB and half-plane is correct at ${theta}°`, () => {
      const rad = (theta * Math.PI) / 180;
      const dirLng = Math.cos(rad);
      const dirLat = Math.sin(rad);
      const start: [number, number] = [CENTER[0], CENTER[1]];
      const end: [number, number] = [CENTER[0] + d * dirLat, CENTER[1] + d * dirLng];

      const A = toLngLat(start);
      const B = toLngLat(end);
      const abDir: [number, number] = [B[0] - A[0], B[1] - A[1]];

      for (const answer of ["hotter", "colder"] as const) {
        const result = computeThermometerExclusion(start, end, answer);

        // The clipped polygon may be a Polygon or MultiPolygon. Gather all
        // rings so we can search every edge for the bisector.
        const rings: number[][][] = [];
        if (result.geometry.type === "Polygon") {
          rings.push(...(result.geometry.coordinates as number[][][]));
        } else if (result.geometry.type === "MultiPolygon") {
          for (const poly of result.geometry.coordinates as number[][][][]) {
            rings.push(...poly);
          }
        }

        // Find the edge closest to perpendicular to AB across all rings.
        let bestAngle: number | null = null;
        let bestDeviation = Infinity;
        for (const ring of rings) {
          const angle = bestPerpendicularAngle(ring, abDir);
          if (angle === null) continue;
          const deviation = Math.abs(angle - 90);
          if (deviation < bestDeviation) {
            bestDeviation = deviation;
            bestAngle = angle;
          }
        }

        // The bisector edge should still be ~90° off AB after clipping.
        // Allow a small tolerance because clipping can introduce vertices,
        // but the bisector edge itself should remain perpendicular.
        expect(bestAngle).not.toBeNull();
        expect(bestAngle as number).toBeCloseTo(90, 1);

        // Half-plane containment must still hold after clipping (both points
        // are inside the game border, so clipping shouldn't flip sides).
        const excludedPoint = answer === "hotter" ? A : B;
        const keptPoint = answer === "hotter" ? B : A;
        const excludedIn = turf.booleanWithin(turf.point(excludedPoint), result);
        const keptIn = turf.booleanWithin(turf.point(keptPoint), result);
        expect(excludedIn).toBe(true);
        expect(keptIn).toBe(false);
      }
    });
  }
});
