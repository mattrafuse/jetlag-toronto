import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { settingsCallbacks, settingsStore } from "../settings/store";
import { SettingsPanel } from "./SettingsPanel";

// ── SettingsPanel ──────────────────────────────────────────────
// Critical path: the panel renders the layer toggles and forwards
// user interactions to the settings callbacks.
describe("SettingsPanel", () => {
  beforeEach(() => {
    vi.spyOn(settingsCallbacks, "toggleLayer").mockImplementation(() => {});
    vi.spyOn(settingsCallbacks, "toggleDarkMode").mockImplementation(() => {});
    vi.spyOn(settingsCallbacks, "toggleStationLabels").mockImplementation(() => {});
    vi.spyOn(settingsCallbacks, "toggleBorderEditable").mockImplementation(() => {});
    vi.spyOn(settingsCallbacks, "exportBorder").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the Map Settings heading", () => {
    render(<SettingsPanel />);
    expect(screen.getByText("Map Settings")).toBeInTheDocument();
  });

  it("collapses the panel when panelOpen is false", () => {
    settingsStore.update({ panelOpen: false });
    const { container } = render(<SettingsPanel />);
    const collapse = container.querySelector(".MuiCollapse-root");
    expect(collapse).not.toBeNull();
    expect(collapse!.classList.contains("MuiCollapse-hidden")).toBe(true);
    expect(collapse!.classList.contains("MuiCollapse-entered")).toBe(false);
  });

  it("expands the panel when panelOpen is true", () => {
    settingsStore.update({ panelOpen: true });
    const { container } = render(<SettingsPanel />);
    const collapse = container.querySelector(".MuiCollapse-root");
    expect(collapse).not.toBeNull();
    expect(collapse!.classList.contains("MuiCollapse-entered")).toBe(true);
    expect(collapse!.classList.contains("MuiCollapse-hidden")).toBe(false);
  });

  it("renders all layer checkboxes", () => {
    render(<SettingsPanel />);
    expect(screen.getByLabelText("GO Trains")).toBeInTheDocument();
    expect(screen.getByLabelText("TTC Subway/LRT Lines")).toBeInTheDocument();
    expect(screen.getByLabelText("Border Mask")).toBeInTheDocument();
    expect(screen.getByLabelText("My Location")).toBeInTheDocument();
  });

  it("forwards layer toggle to settingsCallbacks.toggleLayer", () => {
    // Default trains=true, so a click toggles it to false.
    render(<SettingsPanel />);
    const trains = screen.getByLabelText("GO Trains") as HTMLInputElement;
    act(() => {
      trains.click();
    });
    expect(settingsCallbacks.toggleLayer).toHaveBeenCalledWith("chk-trains", false);
  });

  it("forwards dark mode toggle", () => {
    render(<SettingsPanel />);
    const dark = screen.getByLabelText("Dark Mode") as HTMLInputElement;
    act(() => {
      dark.click();
    });
    expect(settingsCallbacks.toggleDarkMode).toHaveBeenCalledWith(true);
  });

  it("forwards station labels toggle", () => {
    // Default stationLabels=false, so a click toggles it to true.
    render(<SettingsPanel />);
    const labels = screen.getByLabelText("Show Station Labels") as HTMLInputElement;
    act(() => {
      labels.click();
    });
    expect(settingsCallbacks.toggleStationLabels).toHaveBeenCalledWith(true);
  });

  it("forwards border editable toggle", () => {
    render(<SettingsPanel />);
    const edit = screen.getByLabelText("Edit Border") as HTMLInputElement;
    act(() => {
      edit.click();
    });
    expect(settingsCallbacks.toggleBorderEditable).toHaveBeenCalledWith(true);
  });

  it("forwards export border button click", () => {
    render(<SettingsPanel />);
    const btn = screen.getByText("Export Border GeoJSON");
    act(() => {
      btn.click();
    });
    expect(settingsCallbacks.exportBorder).toHaveBeenCalledTimes(1);
  });
});
