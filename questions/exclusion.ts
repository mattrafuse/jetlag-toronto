import * as turf from "@turf/turf";

// ── Exclusion Zone Geometry ────────────────────────────────────
// Pure functions that compute exclusion polygons from question answers.

const MILES_TO_KM = 1.60934;

/** Large bounding box covering the entire region (reused from border.ts pattern). */
const OUTER_BOUNDS: [number, number][] = [
  [-90, -180],
  [90, -180],
  [90, 180],
  [-90, 180],
  [-90, -180],
];

/**
 * Compute the exclusion polygon for a radar question.
 *
 * - "yes" (hider IS within range): Everything OUTSIDE the circle is excluded.
 *   Returns a large bounding polygon with a circular hole.
 * - "no" (hider NOT within range): Everything INSIDE the circle is excluded.
 *   Returns the circle itself as the exclusion zone.
 */
export const computeRadarExclusion = (
  center: [number, number], // [lat, lng]
  distanceMiles: number,
  answer: "yes" | "no",
): GeoJSON.Feature<GeoJSON.Polygon> => {
  const centerPoint = turf.point([center[1], center[0]]); // [lng, lat]
  const radiusKm = distanceMiles * MILES_TO_KM;
  const circle = turf.circle(centerPoint, radiusKm, { units: "kilometers", steps: 64 });

  if (answer === "no") {
    // Exclude the inside of the circle
    return circle;
  }

  // "yes" — exclude everything OUTSIDE the circle
  // Create a large bounding polygon with the circle as a hole
  const outerRing: number[][] = OUTER_BOUNDS.map(([lat, lng]) => [lng, lat]);
  const holeRing = circle.geometry.coordinates[0];

  return turf.polygon([outerRing, holeRing]);
};

/**
 * Compute the exclusion polygon for a thermometer question.
 *
 * The perpendicular bisector of the segment from start to end divides the plane.
 * - "hotter" (end is closer to hider): Exclude the half-plane containing the START point.
 * - "colder" (end is farther from hider): Exclude the half-plane containing the END point.
 */
export const computeThermometerExclusion = (
  start: [number, number], // [lat, lng]
  end: [number, number], // [lat, lng]
  answer: "hotter" | "colder",
): GeoJSON.Feature<GeoJSON.Polygon> => {
  // Convert to [lng, lat] for turf
  const A: [number, number] = [start[1], start[0]];
  const B: [number, number] = [end[1], end[0]];

  // Midpoint of AB
  const midLng = (A[0] + B[0]) / 2;
  const midLat = (A[1] + B[1]) / 2;

  // Direction vector of AB
  const dx = B[0] - A[0];
  const dy = B[1] - A[1];

  // Perpendicular direction (rotate 90° CCW)
  const perpDx = -dy;
  const perpDy = dx;

  // Normalize the perpendicular
  const len = Math.sqrt(perpDx * perpDx + perpDy * perpDy);
  if (len === 0) {
    // Start and end are the same — return empty polygon
    return turf.polygon([
      [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
    ]);
  }
  const nx = perpDx / len;
  const ny = perpDy / len;

  // Extend the bisector line far enough to cover the entire map
  const EXTENT = 500; // degrees — more than enough to cover any game area
  const p1: [number, number] = [midLng + nx * EXTENT, midLat + ny * EXTENT];
  const p2: [number, number] = [midLng - nx * EXTENT, midLat - ny * EXTENT];

  // Determine which side to exclude
  // The side containing point P is determined by the sign of the cross product
  // (B - A) × (P - A). Positive means P is on the "left" side of AB.
  const cross = (px: number, py: number): number => {
    return dx * (py - A[1]) - dy * (px - A[0]);
  };

  // For "hotter": exclude the side containing START (A)
  // For "colder": exclude the side containing END (B)
  const pointToExclude = answer === "hotter" ? A : B;
  const excludeSide = cross(pointToExclude[0], pointToExclude[1]) > 0 ? "left" : "right";

  // Build the half-plane polygon
  // We need a large polygon that covers the side we want to exclude.
  // The bisector line splits the plane; we take the half on the exclude side.
  // We construct a large triangle/quad that covers that half.

  // Extend perpendicular to the bisector in the direction of the excluded side
  const sign = excludeSide === "left" ? 1 : -1;
  // The direction toward the excluded side is perpendicular to the bisector
  const sideDx = -ny * sign;
  const sideDy = nx * sign;

  // Build a large polygon covering the excluded half-plane
  const far1: [number, number] = [p1[0] + sideDx * EXTENT, p1[1] + sideDy * EXTENT];
  const far2: [number, number] = [p2[0] + sideDx * EXTENT, p2[1] + sideDy * EXTENT];

  return turf.polygon([[p1, p2, far2, far1, p1]]);
};

/**
 * Union multiple exclusion polygons into a single cumulative polygon.
 * Returns null if the array is empty.
 */
export const unionExclusionZones = (
  zones: GeoJSON.Feature<GeoJSON.Polygon>[],
): GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null => {
  if (zones.length === 0) return null;

  let result: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null = null;

  for (const zone of zones) {
    if (result) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unioned = turf.union(result as any, zone as any);
        if (unioned) {
          result = unioned as unknown as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
        }
      } catch {
        // If union fails, skip this zone
      }
    } else {
      result = zone;
    }
  }

  return result;
};
