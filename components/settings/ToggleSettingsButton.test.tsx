import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { settingsStore } from "settings/store";
import { ToggleSettingsButton } from "./ToggleSettingsButton";

// ── ToggleSettingsButton ───────────────────────────────────────
// Critical path: clicking the button flips the settings panel open
// state in the shared settings store.
describe("ToggleSettingsButton", () => {
  it("renders an accessible toggle button", () => {
    render(<ToggleSettingsButton />);
    expect(screen.getByLabelText("Toggle settings panel")).toBeInTheDocument();
  });

  it("toggles panelOpen when clicked", () => {
    settingsStore.update({ panelOpen: false });
    render(<ToggleSettingsButton />);
    const btn = screen.getByLabelText("Toggle settings panel");

    act(() => {
      btn.click();
    });
    expect(settingsStore.get().panelOpen).toBe(true);

    act(() => {
      btn.click();
    });
    expect(settingsStore.get().panelOpen).toBe(false);
  });
});
