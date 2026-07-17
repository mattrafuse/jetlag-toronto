import { describe, expect, it } from "vitest";
import { findHub, HUBS, hubStationOptions } from "./hubs";

// ── HUBS / findHub / hubStationOptions ─────────────────────────
describe("hubs", () => {
  it("exposes a non-empty list of hub definitions", () => {
    expect(HUBS.length).toBeGreaterThan(0);
    for (const hub of HUBS) {
      expect(typeof hub.id).toBe("string");
      expect(typeof hub.label).toBe("string");
      expect(typeof hub.match).toBe("function");
    }
  });

  it("matches Union Station under multiple names", () => {
    const hub = findHub("Union Station");
    expect(hub?.id).toBe("Union Station");
    expect(findHub("Union")?.id).toBe("Union Station");
  });

  it("matches Kennedy case-insensitively", () => {
    expect(findHub("KENNEDY GO")?.id).toBe("Kennedy");
    expect(findHub("Kennedy Station")?.id).toBe("Kennedy");
  });

  it("matches Weston, Mount Dennis, Eglinton, Cedarvale, Bloor-Yonge, St George, Downsview Park, Sheppard-Yonge", () => {
    expect(findHub("Weston GO")?.id).toBe("Weston");
    expect(findHub("Mount Dennis")?.id).toBe("Mount Dennis");
    expect(findHub("Eglinton")?.id).toBe("Eglinton");
    expect(findHub("Eglinton Station")?.id).toBe("Eglinton");
    expect(findHub("Cedarvale Station")?.id).toBe("Cedarvale");
    expect(findHub("Eglinton West")?.id).toBe("Cedarvale");
    expect(findHub("Bloor-Yonge")?.id).toBe("Bloor-Yonge");
    expect(findHub("St George")?.id).toBe("St George");
    expect(findHub("Downsview Park GO")?.id).toBe("Downsview Park");
    expect(findHub("Sheppard-Yonge")?.id).toBe("Sheppard-Yonge");
  });

  it("returns undefined for a non-hub station name", () => {
    expect(findHub("Finch Station")).toBeUndefined();
    expect(findHub("")).toBeUndefined();
  });

  it("produces hub station options with __skipHub set", () => {
    const hub = HUBS[0];
    const opts = hubStationOptions(hub);
    expect(opts.fillColor).toBe(hub.color);
    expect(opts.__skipHub).toBe(true);
    expect(opts.label).toBe(hub.label);
    expect(opts.circle?.fillColor).toBe(hub.color);
  });
});
