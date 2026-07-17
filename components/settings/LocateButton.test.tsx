import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocateButton } from "./LocateButton";

// ── LocateButton ───────────────────────────────────────────────
// Critical path: the button only appears once a user location is
// available, and clicking it focuses the map on the user.
vi.mock("layers/location", () => ({
  focusUserLocation: vi.fn(),
  onLocationAvailabilityChange: vi.fn(),
}));

import { focusUserLocation, onLocationAvailabilityChange } from "layers/location";

describe("LocateButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("subscribes to location availability on mount", () => {
    render(<LocateButton />);
    expect(onLocationAvailabilityChange).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when location is unavailable", () => {
    vi.mocked(onLocationAvailabilityChange).mockImplementation((cb) => {
      cb(false);
      return () => {};
    });
    const { container } = render(<LocateButton />);
    expect(container.querySelector('[aria-label="Focus on my location"]')).toBeNull();
  });

  it("renders and focuses location when available", () => {
    vi.mocked(onLocationAvailabilityChange).mockImplementation((cb) => {
      cb(true);
      return () => {};
    });
    render(<LocateButton />);
    const btn = screen.getByLabelText("Focus on my location");
    expect(btn).toBeInTheDocument();

    btn.click();
    expect(focusUserLocation).toHaveBeenCalledTimes(1);
  });
});
