import { describe, expect, it } from "vitest";
import { validateCoordinates } from "./coordUtils";

describe("validateCoordinates", () => {
  it("returns true for valid latitude and longitude", () => {
    expect(validateCoordinates("43.6532", "-79.3832")).toBe(true);
  });

  it("returns true for integer coordinates", () => {
    expect(validateCoordinates("0", "0")).toBe(true);
  });

  it("returns true for positive and negative numbers", () => {
    expect(validateCoordinates("90", "-180")).toBe(true);
  });

  it("returns false when latitude is empty", () => {
    expect(validateCoordinates("", "-79.3832")).toBe(false);
  });

  it("returns false when longitude is empty", () => {
    expect(validateCoordinates("43.6532", "")).toBe(false);
  });

  it("returns false when both are empty", () => {
    expect(validateCoordinates("", "")).toBe(false);
  });

  it("returns false when latitude is not a number", () => {
    expect(validateCoordinates("abc", "-79.3832")).toBe(false);
  });

  it("returns false when longitude is not a number", () => {
    expect(validateCoordinates("43.6532", "xyz")).toBe(false);
  });

  it("returns false when both are not numbers", () => {
    expect(validateCoordinates("abc", "xyz")).toBe(false);
  });

  it("returns true for whitespace-only strings (parsed as 0)", () => {
    expect(validateCoordinates("   ", "   ")).toBe(true);
  });
});
