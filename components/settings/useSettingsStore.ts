import React, { useEffect } from "react";
import { settingsStore } from "../../settings-store";

// ── Hook to subscribe to the settings store ────────────────────
export const useSettingsStore = () => {
  const [, setTick] = React.useState(0);
  useEffect(() => settingsStore.subscribe(() => setTick((n) => n + 1)), []);
  return settingsStore.get();
};
