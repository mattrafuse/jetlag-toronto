// ── Radar Exclusion Geometry ───────────────────────────────────
// Pure functions that compute exclusion polygons from radar answers.

import * as turf from "@turf/turf";
import { MILES_TO_KM } from "constants";
import { clipToGameBorder } from "../exclusion";
import { gameBorder } from "../game-border";

/**
 * Compute the exclusion polygon for a radar question.
 *
 * - "yes" (hider IS within range): Everything OUTSIDE the circle is excluded.
 *   Returns the game border with a circular hole.
 * - "no" (hider NOT within range): Everything INSIDE the circle is excluded.
 *   Returns the circle itself as the exclusion zone.
 *
 * Both results are clipped to the game border so they never extend beyond
 * the playable area.
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
    // Exclude the inside of the circle, clipped to the game border
    return clipToGameBorder(circle);
  }

  // "yes" — exclude everything OUTSIDE the circle.
  // Build the game border with the circle as a hole, so the excluded
  // region is the part of the game area outside the circle.
  const holeRing = circle.geometry.coordinates[0];
  const outerRing = gameBorder.geometry.coordinates[0];

  return clipToGameBorder(turf.polygon([outerRing, holeRing]));
};
