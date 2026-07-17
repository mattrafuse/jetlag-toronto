import { settingsStore } from "../../settings/store";
import { createStoreHook } from "../../store-hook";

// ── React hook for the settings store ─────────────────────────
// Re-renders the calling component whenever the settings store
// emits a change, returning the current state snapshot.
export const useSettingsStore = createStoreHook(settingsStore);
