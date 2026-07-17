import { questionsStore } from "questions";
import { createStoreHook } from "store-hook";

// ── React hook for the questions store ────────────────────────
// Re-renders the calling component whenever the questions store
// emits a change, returning the current state snapshot.
export const useQuestionsStore = createStoreHook(questionsStore);
