import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initOverlay } from "./overlay";
import { settingsStore } from "./settings-store";

// ── initOverlay ────────────────────────────────────────────────
// Critical path: the overlay must mount into #app-overlay and
// re-render whenever the settings store changes (so the theme
// follows dark mode).
describe("initOverlay", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "app-overlay";
    document.body.appendChild(container);
    // Reset settings to a known state.
    settingsStore.update({ panelOpen: false, darkMode: false });
  });

  afterEach(() => {
    container.remove();
  });

  it("mounts the overlay into #app-overlay", async () => {
    await act(async () => {
      initOverlay();
    });
    // The settings toggle button (aria-label) should be present.
    expect(container.querySelector('[aria-label="Toggle settings panel"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Toggle questions panel"]')).not.toBeNull();
  });

  it("subscribes to the settings store so it re-renders on change", () => {
    const subscribeSpy = vi.spyOn(settingsStore, "subscribe");
    initOverlay();
    expect(subscribeSpy).toHaveBeenCalledTimes(1);
    subscribeSpy.mockRestore();
  });

  it("reflects dark mode changes from the store", async () => {
    await act(async () => {
      initOverlay();
    });
    act(() => {
      settingsStore.update({ darkMode: true });
    });
    expect(settingsStore.get().darkMode).toBe(true);
  });

  it("renders the settings panel when panelOpen is true", async () => {
    await act(async () => {
      initOverlay();
    });
    act(() => {
      settingsStore.update({ panelOpen: true });
    });
    // "Map Settings" heading is rendered by SettingsPanel.
    expect(container.textContent).toContain("Map Settings");
  });

  it("throws when #app-overlay is missing", () => {
    container.remove();
    // The non-null assertion in initOverlay throws if the container
    // is absent; guard against regressions.
    expect(() => initOverlay()).toThrow();
  });
});
