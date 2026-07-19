// ── Thermometer Exclusion Geometry ──────────────────────────────
// Pure functions that compute exclusion polygons from thermometer answers.

import * as turf from "@turf/turf";
import { clipToGameBorder } from "../exclusion";
import { gameBorder } from "../game-border";

/**
 * Kilometres to extend the half-plane polygon beyond the
 * midpoint. The polygon is clipped to the game border afterwards, so this
 * just needs to be large enough that the half-plane fully covers the game
 * area on the excluded side.
 */
const EXTENT = 30;

/**
 * Compute the exclusion polygon for a thermometer question.
 *
 * The perpendicular bisector of the segment from start to end divides the plane.
 * - "hotter" (end is closer to hider): Exclude the half-plane containing the START point.
 * - "colder" (end is farther from hider): Exclude the half-plane containing the END point.
 *
 * The resulting polygon is clipped to the game border so it never extends
 * beyond the playable area.
 */
export const computeThermometerExclusion = (
  start: [number, number], // [lat, lng]
  end: [number, number], // [lat, lng]
  answer: "hotter" | "colder",
): GeoJSON.Feature<GeoJSON.Polygon> => {
  // Reuse the bisector geometry; its endpoints span the game region and form
  // the base edge of the half-plane quad we build below.
  const bisector = computeThermometerBisector(start, end, false);
  if (!bisector) {
    // Start and end are the same — return degenerate polygon
    return turf.polygon([
      [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
    ]);
  }

  const excludedPoint = answer === "hotter" ? start : end;
  const excludedLngLat: [number, number] = [excludedPoint[1], excludedPoint[0]];

  // Endpoints of the bisector segment that spans the game region.
  const bisectorCoords = bisector.geometry.coordinates;
  const lineCoords: [number, number][] =
    bisector.geometry.type === "LineString"
      ? (bisectorCoords as [number, number][])
      : (bisectorCoords as [number, number][][]).flat(1);
  if (lineCoords.length < 2) {
    return turf.polygon([
      [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
    ]);
  }
  const p1 = lineCoords[0];
  const p2 = lineCoords[lineCoords.length - 1];

  // Direction from the bisector toward the excluded half-plane. The bisector
  // is perpendicular to AB, so this direction is parallel to AB and points
  // from the midpoint toward the excluded point.
  const A: [number, number] = [start[1], start[0]];
  const B: [number, number] = [end[1], end[0]];
  const midpoint = turf.midpoint(turf.point(A), turf.point(B));
  const midCoord = midpoint.geometry.coordinates as [number, number];
  // Use rhumb bearing so the extension follows a straight line on the
  // Web Mercator map (matching how the bisector is now computed). Great-circle
  // bearings would bow the extension toward the poles and skew the quad.
  const bearing = turf.rhumbBearing(turf.point(midCoord), turf.point(excludedLngLat));

  // Extend both bisector endpoints into the excluded side to form the
  // half-plane quad [p1, p2, far2, far1, p1]. Rhumb destinations keep the
  // edges straight on a Mercator projection.
  const far1 = turf.rhumbDestination(turf.point(p1), EXTENT, bearing, {
    units: "kilometers",
  });
  const far2 = turf.rhumbDestination(turf.point(p2), EXTENT, bearing, {
    units: "kilometers",
  });
  const far1Coord = far1.geometry.coordinates as [number, number];
  const far2Coord = far2.geometry.coordinates as [number, number];

  const quad = turf.polygon([[p1, p2, far2Coord, far1Coord, p1]]);

  return clipToGameBorder(quad);
};

/**
 * Compute the perpendicular bisector line of the segment from start to end,
 * clipped to the game border so it spans the playable region. This is the
 * line along which the thermometer exclusion will land, useful for
 * visualizing where the hider must lie relative to the two points.
 *
 * Returns a LineString feature (in [lng, lat] GeoJSON order) of the bisector
 * segment(s) within the game area, or null if the bisector does not intersect
 * the game border.
 */
export const computeThermometerBisector = (
  start: [number, number], // [lat, lng]
  end: [number, number], // [lat, lng]
  clamp: boolean = true,
): GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString> | null => {
  // Convert to [lng, lat] for turf
  const A: [number, number] = [start[1], start[0]];
  const B: [number, number] = [end[1], end[0]];
  // Degenerate segment: no bisector exists. (rhumbBearing returns 0 for
  // identical points, which would produce a bogus east-west line through
  // the point instead of no line at all.)
  if (A[0] === B[0] && A[1] === B[1]) {
    return null;
  }

  // 1. Find the center point where the bisector starts
  const midpoint = turf.midpoint(turf.point(A), turf.point(B));

  // 2. Calculate the original bearing and add 90 degrees for the perpendicular angle.
  // Use rhumb bearing so the bisector is a straight line on a Web Mercator
  // map (which is what Leaflet renders). Great-circle bearings would bow the
  // two endpoints toward the poles, tilting the bisector and shifting it
  // off the true midpoint — most visibly for roughly east-west segments.
  const originalBearing = turf.rhumbBearing(turf.point(A), turf.point(B));
  const perpendicularBearing = (originalBearing + 90) % 360;

  // 3. Project two points far away in opposite directions.
  // Use a distance large enough to safely clear your maximum game board size (e.g., 1000 km)
  const p1 = turf.rhumbDestination(midpoint, EXTENT, perpendicularBearing, {
    units: "kilometers",
  });
  const p2 = turf.rhumbDestination(midpoint, EXTENT, (perpendicularBearing + 180) % 360, {
    units: "kilometers",
  });

  // This is your massive, extended bisector line
  const extendedBisector = turf.lineString([p1.geometry.coordinates, p2.geometry.coordinates]);

  if (!clamp) {
    return extendedBisector;
  }

  try {
    // 4. Clip it to the game boundary
    const crossings = turf.lineIntersect(extendedBisector, gameBorder);
    const coords = crossings.features.map((f) => f.geometry.coordinates);

    if (coords.length >= 2) {
      // Return the segment clamped precisely to the border boundaries
      return turf.lineString([coords[0], coords[coords.length - 1]]);
    }
  } catch {
    // Fall through to return the extended bisector if intersection fails
  }

  return extendedBisector;
};
