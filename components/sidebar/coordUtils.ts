/**
 * Returns true when both lat/lng strings are non-empty and parse to finite
 * numbers. Used to guard the coordinate-input handlers in the question forms
 * so the duplicated `!val || Number.isNaN(lat) || Number.isNaN(lng)` check
 * lives in one place.
 */
export const validateCoordinates = (latitude: string, longitude: string): boolean =>
  latitude !== "" &&
  longitude !== "" &&
  !Number.isNaN(Number(latitude)) &&
  !Number.isNaN(Number(longitude));
