/**
 * Curated header-frieze compositions — DESIGNER-TUNABLE. Ghassan edits the
 * values here; NavFrieze picks one at random per load and deals the styled
 * triquetra variants onto its positions.
 *
 * Authoring rules (mirrors the ambient-field hierarchy lessons):
 *  - Exactly ONE anchor per composition (90–110px, bleeds past the 64px bar),
 *    placed off-centre (~15–30% or ~70–85% x), alternating side across the set.
 *  - 3–4 satellites (36–64px). No two positions within 12% x of each other.
 *  - Discrete values only: rotation ∈ {-24,-12,0,12,24}; opacity ∈
 *    {0.06,0.10,0.16}. Any position in the nav-text band (x 30–75%) uses 0.06
 *    or 0.10 only. (Mobile keeps the CTA corner light too.)
 *  - Compositions differ in silhouette (anchor left vs right, dense-left vs
 *    dense-right, edge-bleeder vs none) so reloads feel alive.
 */
export type FriezePosition = {
  x: number; // horizontal centre, % of bar width
  size: number; // px
  rotation: number; // deg ∈ {-24,-12,0,12,24}
  opacity: number; // ∈ {0.06,0.10,0.16}
  role: "anchor" | "satellite";
};
export type FriezeComposition = FriezePosition[];

// anchor side alternates L, R, L, R, L across the set
export const DESKTOP_COMPOSITIONS: FriezeComposition[] = [
  // 1 — anchor left, dense-left / sparse-right, right edge-bleeder
  [
    { x: 6, size: 44, rotation: 12, opacity: 0.1, role: "satellite" },
    { x: 18, size: 100, rotation: -12, opacity: 0.16, role: "anchor" },
    { x: 34, size: 52, rotation: 0, opacity: 0.1, role: "satellite" },
    { x: 58, size: 40, rotation: 24, opacity: 0.06, role: "satellite" },
    { x: 88, size: 48, rotation: -24, opacity: 0.16, role: "satellite" },
  ],
  // 2 — anchor right, sparse-left / dense-right, right edge-bleeder
  [
    { x: 10, size: 40, rotation: 24, opacity: 0.16, role: "satellite" },
    { x: 40, size: 44, rotation: -12, opacity: 0.06, role: "satellite" },
    { x: 62, size: 52, rotation: 12, opacity: 0.1, role: "satellite" },
    { x: 80, size: 100, rotation: 12, opacity: 0.16, role: "anchor" },
    { x: 94, size: 48, rotation: -24, opacity: 0.16, role: "satellite" },
  ],
  // 3 — anchor left-of-centre, contained (no edge bleeders)
  [
    { x: 26, size: 90, rotation: 0, opacity: 0.16, role: "anchor" },
    { x: 44, size: 48, rotation: -24, opacity: 0.1, role: "satellite" },
    { x: 60, size: 40, rotation: 24, opacity: 0.06, role: "satellite" },
    { x: 76, size: 56, rotation: 12, opacity: 0.16, role: "satellite" },
  ],
  // 4 — anchor right, left edge-bleeder
  [
    { x: 4, size: 52, rotation: -24, opacity: 0.16, role: "satellite" },
    { x: 28, size: 40, rotation: 12, opacity: 0.16, role: "satellite" },
    { x: 50, size: 48, rotation: 0, opacity: 0.1, role: "satellite" },
    { x: 78, size: 100, rotation: -12, opacity: 0.16, role: "anchor" },
  ],
  // 5 — anchor far left, sparse trailing right, no far-right mark
  [
    { x: 15, size: 96, rotation: 12, opacity: 0.16, role: "anchor" },
    { x: 38, size: 44, rotation: -12, opacity: 0.06, role: "satellite" },
    { x: 56, size: 52, rotation: 24, opacity: 0.1, role: "satellite" },
    { x: 72, size: 40, rotation: 0, opacity: 0.06, role: "satellite" },
  ],
];

// mobile: the CTA + hamburger live at the right, so the right corner stays light
export const MOBILE_COMPOSITIONS: FriezeComposition[] = [
  // 1 — anchor left
  [
    { x: 18, size: 92, rotation: -12, opacity: 0.16, role: "anchor" },
    { x: 38, size: 44, rotation: 12, opacity: 0.1, role: "satellite" },
    { x: 56, size: 40, rotation: 0, opacity: 0.1, role: "satellite" },
    { x: 82, size: 38, rotation: 24, opacity: 0.06, role: "satellite" },
  ],
  // 2 — anchor right (kept light behind the CTA)
  [
    { x: 12, size: 40, rotation: 24, opacity: 0.16, role: "satellite" },
    { x: 34, size: 44, rotation: -12, opacity: 0.1, role: "satellite" },
    { x: 56, size: 38, rotation: 12, opacity: 0.06, role: "satellite" },
    { x: 80, size: 96, rotation: 12, opacity: 0.1, role: "anchor" },
  ],
  // 3 — anchor left, right corner clear for the CTA
  [
    { x: 8, size: 40, rotation: 24, opacity: 0.16, role: "satellite" },
    { x: 24, size: 100, rotation: 12, opacity: 0.16, role: "anchor" },
    { x: 44, size: 42, rotation: -24, opacity: 0.1, role: "satellite" },
    { x: 62, size: 38, rotation: 0, opacity: 0.06, role: "satellite" },
  ],
];
