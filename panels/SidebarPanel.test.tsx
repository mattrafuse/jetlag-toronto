import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { questionsCallbacks, questionsStore } from "../questions";
import { SidebarPanel } from "./SidebarPanel";

// ── SidebarPanel ───────────────────────────────────────────────
// Critical path: the panel renders the tab toggle, history, station
// list, and forwards tab switches / show-removed to the callbacks.
describe("SidebarPanel", () => {
  beforeEach(() => {
    vi.spyOn(questionsCallbacks, "switchTab").mockImplementation(() => {});
    vi.spyOn(questionsCallbacks, "setShowRemoved").mockImplementation(() => {});
    questionsStore.update({
      panelOpen: false,
      activeTab: "radar",
      history: [],
      stations: [],
      showRemoved: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the Ask a Question header", () => {
    render(<SidebarPanel />);
    expect(screen.getByText("Ask a Question")).toBeInTheDocument();
  });

  it("collapses the panel when panelOpen is false", () => {
    questionsStore.update({ panelOpen: false });
    const { container } = render(<SidebarPanel />);
    const collapse = container.querySelector(".MuiCollapse-root");
    expect(collapse).not.toBeNull();
    expect(collapse!.classList.contains("MuiCollapse-hidden")).toBe(true);
    expect(collapse!.classList.contains("MuiCollapse-entered")).toBe(false);
  });

  it("expands the panel when panelOpen is true", () => {
    questionsStore.update({ panelOpen: true });
    const { container } = render(<SidebarPanel />);
    const collapse = container.querySelector(".MuiCollapse-root");
    expect(collapse).not.toBeNull();
    expect(collapse!.classList.contains("MuiCollapse-entered")).toBe(true);
    expect(collapse!.classList.contains("MuiCollapse-hidden")).toBe(false);
  });

  it("renders both radar and thermometer tabs", () => {
    render(<SidebarPanel />);
    expect(screen.getByText("Radar")).toBeInTheDocument();
    expect(screen.getByText("Thermo")).toBeInTheDocument();
  });

  it("switches tab via callbacks.switchTab", () => {
    render(<SidebarPanel />);
    const thermoTab = screen.getByText("Thermo");
    act(() => {
      thermoTab.click();
    });
    expect(questionsCallbacks.switchTab).toHaveBeenCalledWith("thermometer");
  });

  it("shows empty history message when no history", () => {
    render(<SidebarPanel />);
    expect(screen.getByText("No questions asked yet")).toBeInTheDocument();
  });

  it("renders history items in reverse order", () => {
    questionsStore.update({
      history: [
        {
          id: "a",
          type: "radar",
          label: "1mi",
          answer: "yes",
          center: [0, 0],
          distance: 1,
        } as never,
        {
          id: "b",
          type: "radar",
          label: "2mi",
          answer: "no",
          center: [0, 0],
          distance: 2,
        } as never,
      ],
    });
    render(<SidebarPanel />);
    const titles = screen.getAllByText(/Radar \dmi/);
    // The most recent (id "b") should appear first in the reversed list.
    expect(titles[0].textContent).toContain("Radar 2mi");
    expect(titles[1].textContent).toContain("Radar 1mi");
  });

  it("shows empty station message when none loaded", () => {
    render(<SidebarPanel />);
    expect(screen.getByText("No stations loaded")).toBeInTheDocument();
  });

  it("renders station names from the store", () => {
    questionsStore.update({
      stations: [{ id: "s1", name: "Union Station", excluded: false }],
    });
    render(<SidebarPanel />);
    expect(screen.getByText("Union Station")).toBeInTheDocument();
  });

  it("forwards show-removed toggle to questionsCallbacks.setShowRemoved", () => {
    render(<SidebarPanel />);
    const checkbox = screen.getByLabelText("Show removed stations") as HTMLInputElement;
    act(() => {
      checkbox.click();
    });
    expect(questionsCallbacks.setShowRemoved).toHaveBeenCalledWith(true);
  });
});
