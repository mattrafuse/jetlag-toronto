// ── Custom Polygon Question Types ──────────────────────────
// A player-drawn polygon. The exclusion zone is exactly the drawn polygon
// (clipped to the game border), so the hider is known to be OUTSIDE it.

/** A custom polygon question that has been drawn and committed. */
export interface AskedPolygonQuestion {
  id: string;
  type: "polygon";
  /** Human-readable label shown in the UI (e.g. "Custom Polygon"). */
  label: string;
  /** The drawn polygon, as [lat, lng] rings (outer ring first). */
  rings: [number, number][][];
  /** Whether the hider is inside (no) or outside (yes) the polygon. */
  answer: "yes" | "no";
  timestamp: number;
}
