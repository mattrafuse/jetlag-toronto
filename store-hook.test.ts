import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createStoreHook } from "./store-hook";

// ── createStoreHook ────────────────────────────────────────────
describe("createStoreHook", () => {
  it("returns the current store snapshot and re-renders on change", () => {
    const store = {
      state: { count: 0 },
      get() {
        return this.state;
      },
      update(partial: Partial<{ count: number }>) {
        this.state = { ...this.state, ...partial };
        for (const fn of this.listeners) fn();
      },
      listeners: new Set<() => void>(),
      subscribe(fn: () => void) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
      },
    };

    const useStore = createStoreHook(store);
    const { result } = renderHook(() => useStore());

    expect(result.current.count).toBe(0);

    act(() => {
      store.update({ count: 5 });
    });

    expect(result.current.count).toBe(5);
  });

  it("unsubscribes on unmount", () => {
    const unsub = vi.fn();
    const store = {
      get: () => ({}),
      update: () => {},
      subscribe: () => unsub,
    };
    const useStore = createStoreHook(store);
    const { unmount } = renderHook(() => useStore());
    unmount();
    expect(unsub).toHaveBeenCalledTimes(1);
  });
});
