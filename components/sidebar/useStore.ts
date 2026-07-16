import React, { useEffect } from "react";
import { store } from "../../questions/store";

// ── Hook to subscribe to the store ─────────────────────────────
export const useStore = () => {
  const [, setTick] = React.useState(0);
  useEffect(() => store.subscribe(() => setTick((n) => n + 1)), []);
  return store.get();
};
