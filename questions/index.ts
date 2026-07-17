// ── Public API for the questions module ──────────────────────────
// External modules import ONLY from here. The per-type subfolders
// (`radar/`, `thermometer/`) are implementation details and should
// not be imported directly from outside `questions/`.

// Orchestrator
export { initQuestions } from "./sidebar";

// Station registry (used by main.ts, settings.ts, layers/station.ts)
export { stationRegistry } from "./station-registry";
export type { RegisteredStation } from "./types";

// Shared store + callbacks (used by React components)
export { questionsCallbacks, questionsStore, roundCoord } from "./store";
export type { QuestionsCallbacks, QuestionsState } from "./store";

// Shared types (used by React components)
export type {
  AskedQuestion,
  AskedRadarQuestion,
  AskedThermometerQuestion,
  ExclusionZone,
  QuestionCategory,
} from "./types";

// Per-type question definitions (used by RadarForm / ThermometerForm)
export { radarQuestions } from "./radar/data";
export type { RadarQuestionDef } from "./radar/types";
export { thermometerQuestions } from "./thermometer/data";
export type { ThermometerQuestionDef } from "./thermometer/types";
