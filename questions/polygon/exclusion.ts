// ── Custom Polygon Exclusion Geometry ─────────────────────────
// Pure functions that compute exclusion polygons from player-drawn
// polygon questions.

import * as turf from "@turf/turf";
import { clipToGameBorder } from "../exclusion";
import { gameBorder } from "../game-border";
import type { AskedPolygonQuestion } from "./types";

/**
 * Compute the exclusion polygon for a custom polygon question.
 *
 * The player draws a polygon and answers whether the hider is inside it:
 * - "no" (hider is OUTSIDE the polygon): Exclude the polygon interior.
 *   Returns the drawn polygon, clipped to the game border.
 * - "yes" (hider IS inside the polygon): Exclude everything OUTSIDE it.
 *   Returns the game border with the drawn polygon as a hole.
 *
 * Both results are clipped to the game border so they never extend beyond
 * the playable area.
 */
export const computePolygonExclusion = (
  rings: AskedPolygonQuestion["rings"],
  answer: "yes" | "no",
): GeoJSON.Feature<GeoJSON.Polygon> => {
  // Convert [lat, lng] rings to [lng, lat] for turf.
  const ringsLngLat = rings.map((ring) => ring.map(([lat, lng]) => [lng, lat] as [number, number]));
  const polygon = turf.polygon(ringsLngLat as GeoJSON.Position[][]);

  if (answer === "no") {
    // Exclude the inside of the drawn polygon, clipped to the game border.
    return clipToGameBorder(polygon);
  }

  // "yes" — exclude everything OUTSIDE the polygon.
  // Build the game border with the drawn polygon as a hole, so the excluded
  // region is the part of the game area outside the drawn shape.
  const outerRing = gameBorder.geometry.coordinates[0] as GeoJSON.Position[];
  const holeRings = ringsLngLat.map((ring) => ring as GeoJSON.Position[]);
  const withHole = turf.polygon([outerRing, ...holeRings]);

  return clipToGameBorder(withHole);
};
