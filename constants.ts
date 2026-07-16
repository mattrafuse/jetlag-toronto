export const QUARTER_MILE = 402.336;

export const MILES_TO_KM = 1.60934;

/** Large bounding box covering the entire region (reused from border.ts pattern). */
export const OUTER_BOUNDS: [number, number][] = [
  [-90, -180],
  [90, -180],
  [90, 180],
  [-90, 180],
  [-90, -180],
];
