import { beforeEach, describe, expect, it } from "vitest";
import { questionsCallbacks, questionsStore } from "./store";

describe("questionsStore", () => {
  beforeEach(() => {
    // Reset to initial state before each test
    questionsStore.update({
      panelOpen: false,
      activeTab: "radar",
      radarCenter: null,
      radarDistance: 5,
      radarCustomDistance: 0,
      radarUseCustom: false,
      thermoStart: null,
      thermoEnd: null,
      thermoDistance: 0.5,
      history: [],
      stations: [],
      showRemoved: false,
    });
  });

  it("returns the current state via get()", () => {
    const state = questionsStore.get();
    expect(state.panelOpen).toBe(false);
    expect(state.activeTab).toBe("radar");
  });

  it("merges partial updates into state", () => {
    questionsStore.update({ panelOpen: true, radarDistance: 10 });
    const state = questionsStore.get();
    expect(state.panelOpen).toBe(true);
    expect(state.radarDistance).toBe(10);
    // Unchanged fields are preserved
    expect(state.activeTab).toBe("radar");
  });

  it("notifies subscribers on update", () => {
    let callCount = 0;
    const unsubscribe = questionsStore.subscribe(() => {
      callCount++;
    });

    questionsStore.update({ panelOpen: true });
    expect(callCount).toBe(1);

    questionsStore.update({ radarDistance: 3 });
    expect(callCount).toBe(2);

    unsubscribe();

    questionsStore.update({ panelOpen: false });
    expect(callCount).toBe(2); // no new calls after unsubscribe
  });

  it("supports multiple subscribers", () => {
    let countA = 0;
    let countB = 0;
    const unsubA = questionsStore.subscribe(() => countA++);
    const unsubB = questionsStore.subscribe(() => countB++);

    questionsStore.update({ panelOpen: true });
    expect(countA).toBe(1);
    expect(countB).toBe(1);

    unsubA();
    questionsStore.update({ panelOpen: false });
    expect(countA).toBe(1);
    expect(countB).toBe(2);

    unsubB();
  });
});

describe("questionsCallbacks", () => {
  it("all callbacks are no-ops by default", () => {
    // These should not throw
    expect(() => questionsCallbacks.submitRadar("yes")).not.toThrow();
    expect(() => questionsCallbacks.submitThermo("hotter")).not.toThrow();
    expect(() => questionsCallbacks.switchTab("radar")).not.toThrow();
    expect(() => questionsCallbacks.clearRadarMarker()).not.toThrow();
    expect(() => questionsCallbacks.clearThermoMarkers()).not.toThrow();
    expect(() => questionsCallbacks.startRadarPicking()).not.toThrow();
    expect(() => questionsCallbacks.startThermoPicking()).not.toThrow();
    expect(() => questionsCallbacks.setShowRemoved(true)).not.toThrow();
  });

  it("callbacks can be overridden", () => {
    let captured: string | null = null;
    questionsCallbacks.submitRadar = (answer) => {
      captured = answer;
    };
    questionsCallbacks.submitRadar("no");
    expect(captured).toBe("no");

    // Reset
    questionsCallbacks.submitRadar = () => {};
  });
});
