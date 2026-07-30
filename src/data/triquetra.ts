/**
 * CCL triquetra mark — authored vector (v2), redesigned 2026-07-30.
 * Source of truth: .brief/branding/triquetra-v2.svg (3 hand-authored paths).
 *
 * The paths below are AUTHORED vectors, not traced. The old PNG-trace pipeline
 * (scripts/extract_triquetra.py + .brief/branding/Triquetra_Fill.png) is OBSOLETE
 * for the v2 mark — do not re-run it against this geometry.
 *
 * Loop order encodes positional meaning: the site maps loop index -> chapter
 * glow (see Triquetra.tsx and SignatureMeaning.tsx, world index -> activeLoop).
 * Order verified by area centroid inside the 460.66 x 428.07 viewBox:
 *   [0] top blade    centroid ~ (276, 118)  -> Creative (top)
 *   [1] lower-right  centroid ~ (323, 355)  -> Code      (lower-right)
 *   [2] lower-left   centroid ~ ( 94, 277)  -> Logic     (lower-left)
 * The authored file already lists them in this order, so no reordering was needed.
 */
export const TRIQUETRA_VIEWBOX = "0 0 460.66 428.07";

// Parsed viewBox — the v2 mark is NON-square (~1.076:1). Everything that used to
// assume a 512 square derives its centre/scale from these instead.
const VB_PARTS = TRIQUETRA_VIEWBOX.split(/\s+/).map(Number);
export const VB_W = VB_PARTS[2];
export const VB_H = VB_PARTS[3];
export const VB_CX = VB_W / 2;
export const VB_CY = VB_H / 2;
export const VB_MAX = Math.max(VB_W, VB_H);

export const TRIQUETRA_LOOPS: string[] = [
  // [0] top blade — Creative
  "M334.85,131c-7.86,32.09-24.56,76.88-24.74,107.51-.28,16.01,5.47,32.13,17.34,44.68.94.99,1.9,1.95,2.89,2.86h0c2.04,2.15,1.94,5.55-.21,7.58-1.54,1.46-3.73,1.83-5.59,1.12h-.04c-13.91-5.53-26.86-14.1-37.82-25.69-21-22.18-30.55-51.04-28.87-79.3.2-34.08,14.82-89.81,1.84-118.42-2.88-6.91-7.04-13.44-12.49-19.2-24.07-25.43-64.19-26.53-89.61-2.47-10.44,9.88-16.8,22.44-18.99,35.6-.18,1.15-.73,2.25-1.64,3.12-2.19,2.08-5.66,1.98-7.73-.21-1.27-1.35-1.73-3.17-1.39-4.85,4.4-20.08,14.72-39.07,30.77-54.26,42.59-40.31,109.79-38.46,150.1,4.13,25.61,27.06,34.26,64.09,26.2,97.81Z",
  // [1] lower-right — Code
  "M281.3,398.92c-23.86-22.85-54.3-59.71-80.73-75.18-13.72-8.24-30.56-11.33-47.36-7.32-1.33.32-2.64.67-3.92,1.07h0c-2.88.69-5.78-1.09-6.47-3.98-.49-2.07.28-4.14,1.82-5.4l.02-.03c11.74-9.28,25.64-16.21,41.15-19.92,29.71-7.09,59.48-.94,83.12,14.65,29.42,17.21,70.37,57.74,101.64,60.81,7.42.96,15.16.62,22.88-1.22,34.05-8.13,55.07-42.32,46.94-76.38-3.34-13.98-11.03-25.77-21.34-34.24-.91-.73-1.59-1.76-1.88-2.98-.7-2.94,1.11-5.89,4.05-6.59,1.8-.43,3.61.09,4.9,1.23,15.19,13.85,26.48,32.28,31.61,53.78,13.61,57.04-21.59,114.31-78.62,127.92-36.24,8.65-72.63-2.38-97.81-26.22Z",
  // [2] lower-left — Logic
  "M76.05,218.59c31.72-9.24,78.86-17.17,105.48-32.33,14-7.76,25.09-20.8,30.02-37.36.39-1.31.73-2.62,1.04-3.93h0c.85-2.84,3.84-4.45,6.68-3.61,2.04.61,3.45,2.31,3.77,4.28v.03c2.18,14.81,1.23,30.31-3.32,45.6-8.71,29.27-28.93,51.98-54.24,64.66-29.62,16.87-85.19,32.07-103.48,57.62-4.54,5.95-8.12,12.82-10.38,20.42-9.99,33.56,9.12,68.85,42.67,78.84,13.77,4.1,27.84,3.33,40.33-1.36,1.09-.42,2.32-.49,3.52-.14,2.9.86,4.54,3.91,3.68,6.8-.53,1.78-1.88,3.08-3.51,3.63-19.59,6.23-41.19,6.79-62.38.48C19.71,405.51-12.29,346.38,4.44,290.18c10.63-35.71,38.38-61.71,71.61-71.59Z",
];

/**
 * Real bounding box of the mark, sampled from the authored paths at runtime
 * (browser only — uses SVG getTotalLength/getPointAtLength). Replaces the old
 * hard-coded trace bbox. Returns viewBox-space { x, y, w, h }.
 */
export function sampleMarkBBox(): { x: number; y: number; w: number; h: number } {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const d of TRIQUETRA_LOOPS) {
    path.setAttribute("d", d);
    const len = path.getTotalLength();
    const steps = Math.max(64, Math.round(len / 4));
    for (let i = 0; i <= steps; i++) {
      const p = path.getPointAtLength((i / steps) * len);
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
