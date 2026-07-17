import type { AskedQuestion, AskedRadarQuestion, AskedThermometerQuestion } from "questions";

// ── Helpers ────────────────────────────────────────────────────
// Distances already used in the question history, so they can be
// disabled in the dropdowns to prevent re-using a size.
export const usedRadarDistances = (history: AskedQuestion[]): Set<number> => {
  return new Set(
    history.filter((q): q is AskedRadarQuestion => q.type === "radar").map((q) => q.distance),
  );
};

export const usedThermometerDistances = (history: AskedQuestion[]): Set<number> => {
  return new Set(
    history
      .filter((q): q is AskedThermometerQuestion => q.type === "thermometer")
      .map((q) => q.distance),
  );
};
