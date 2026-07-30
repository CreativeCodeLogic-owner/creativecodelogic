/**
 * Real construction geometry for the v2 triquetra, extracted from the designer's
 * build sheet .brief/branding/triquetra-v2-build.svg (a gitignored working file —
 * its CONTENT is embedded here; it is never imported from .brief).
 *
 * Coordinate mapping: the build sheet's <g id="triquetra"> fill paths are
 * byte-identical (relative curve deltas) to src/data/triquetra.ts, offset by
 * exactly (+0.5, +0.5) in their M commands — so scale = 1, no rotation, and
 * build -> triquetra space is a pure translate(-0.5, -0.5). Each guide circle's
 * SVG transform is a rotation about its own centre (invisible for a circle), so
 * the rendered centre equals its cx/cy. Verified numerically: the centre circle
 * maps to (230.73, 249.51) vs the sampled composition centre (230.7, 249.5) —
 * residual 0.03 units. Every circle below is already in triquetra.ts viewBox
 * space ("0 0 460.66 428.07"): 6 x r63.39, 6 x r106.17, 1 x r37.18 (centre).
 */
export type BuildCircle = { cx: number; cy: number; r: number };

export const TRIQUETRA_BUILD_CIRCLES: BuildCircle[] = [
  { cx: 201.11, cy: 95.71, r: 63.39 },
  { cx: 373.51, cy: 239.58, r: 63.39 },
  { cx: 231.53, cy: 106.17, r: 106.17 },
  { cx: 363.78, cy: 196.1, r: 106.17 },
  { cx: 378.7, cy: 300.71, r: 63.39 },
  { cx: 167.96, cy: 378.1, r: 63.39 },
  { cx: 354.46, cy: 321.87, r: 106.17 },
  { cx: 210.47, cy: 391.44, r: 106.17 },
  { cx: 112.36, cy: 352.07, r: 63.39 },
  { cx: 150.75, cy: 130.84, r: 63.39 },
  { cx: 106.2, cy: 320.47, r: 106.17 },
  { cx: 117.95, cy: 160.98, r: 106.17 },
  { cx: 230.73, cy: 249.51, r: 37.18 },
];

/** Composition centre — the r=37.18 build circle (== mean of the loop centroids). */
export const BUILD_CENTER = { x: 230.73, y: 249.51 };
