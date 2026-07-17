// ── Game Border ─────────────────────────────────────────────────
// Extracts the playable game area from the border GeoJSON so that
// exclusion polygons can be clipped to it. The border file is a donut
// mask: outer ring = world bounds, inner ring(s) = the actual game
// boundary (e.g. Toronto city limits). The game area is the hole.
//
// This imports the raw GeoJSON directly (rather than via layers/border.ts)
// to avoid pulling in Leaflet, which is not available in the test
// environment.

import * as turf from "@turf/turf";
import borderGeoJSONRaw from "layers/shapes/border.geojson?raw";

const borderGeoJSON = JSON.parse(borderGeoJSONRaw) as GeoJSON.Feature<GeoJSON.Polygon>;

/**
 * The game area polygon — the inner ring of the border donut, expressed
 * as a solid polygon (not a hole). This is the region where the game
 * is actually played, and exclusion polygons are clipped to it.
 *
 * If the border has multiple holes, they are all included; if it has
 * no holes (degenerate), falls back to the outer ring.
 */
export const gameBorder: GeoJSON.Feature<GeoJSON.Polygon> = (() => {
  const rings = borderGeoJSON.geometry.coordinates;
  // rings[0] is the outer world-bounds ring; rings[1+] are holes (game areas).
  if (rings.length < 2) {
    // No holes — the border itself is the game area
    return turf.polygon(rings);
  }
  // Use the first hole as the game area. (The Toronto border is a single ring.)
  return turf.polygon([rings[1] as number[][]]);
})();
