import React, { useEffect } from "react";

// ── React binding for the reactive stores ─────────────────────
// Both the settings store and the questions store share the same
// minimal `{ get, update, subscribe }` shape. This factory produces
// a React hook that re-renders the calling component whenever the
// store emits a change, returning the current state snapshot.
//
// Usage:
//   export const useSettingsStore = createStoreHook(settingsStore);
//   const state = useSettingsStore();

export interface ReactiveStore<T> {
  get: () => T;
  update: (partial: Partial<T>) => void;
  subscribe: (fn: () => void) => () => void;
}

export const createStoreHook = <T>(store: ReactiveStore<T>): (() => T) => {
  return () => {
    const [, setTick] = React.useState(0);
    useEffect(() => store.subscribe(() => setTick((n) => n + 1)), []);
    return store.get();
  };
};
