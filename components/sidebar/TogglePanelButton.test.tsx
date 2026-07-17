import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { questionsStore } from "../../questions";
import { TogglePanelButton } from "./TogglePanelButton";

// ── TogglePanelButton ──────────────────────────────────────────
// Critical path: clicking the button flips the questions panel open
// state in the shared questions store.
describe("TogglePanelButton", () => {
  it("renders an accessible toggle button", () => {
    render(<TogglePanelButton />);
    expect(screen.getByLabelText("Toggle questions panel")).toBeInTheDocument();
  });

  it("toggles panelOpen when clicked", () => {
    questionsStore.update({ panelOpen: false });
    render(<TogglePanelButton />);
    const btn = screen.getByLabelText("Toggle questions panel");

    act(() => {
      btn.click();
    });
    expect(questionsStore.get().panelOpen).toBe(true);

    act(() => {
      btn.click();
    });
    expect(questionsStore.get().panelOpen).toBe(false);
  });
});
