import type { RadarQuestionDef, ThermometerQuestionDef } from "./types";

// ── Radar Questions ────────────────────────────────────────────
// Format: "Are you within ____ of me?" — Yes/No answer
// Cost: hider draws 2 cards, keeps 1
export const radarQuestions: RadarQuestionDef[] = [
  { type: "radar", distance: 0.25, label: "¼ Mile" },
  { type: "radar", distance: 0.5, label: "½ Mile" },
  { type: "radar", distance: 1, label: "1 Mile" },
  { type: "radar", distance: 3, label: "3 Miles" },
  { type: "radar", distance: 5, label: "5 Miles" },
  { type: "radar", distance: 10, label: "10 Miles" },
];

// ── Thermometer Questions ──────────────────────────────────────
// Format: "After traveling ____, am I hotter or colder?"
// Cost: hider draws 2 cards, keeps 1
export const thermometerQuestions: ThermometerQuestionDef[] = [
  { type: "thermometer", distance: 0.5, label: "½ Mile", gameSize: "small" },
  { type: "thermometer", distance: 3, label: "3 Miles", gameSize: "small" },
  { type: "thermometer", distance: 10, label: "10 Miles", gameSize: "medium" },
  { type: "thermometer", distance: 50, label: "50 Miles", gameSize: "large" },
];
