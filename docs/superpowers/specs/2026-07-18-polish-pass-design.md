# Team + Reviewer Polish Pass — Design Spec

## Goal
Tighten the hero lockup, strengthen World Creative, fix World Code terminal fit and layout, restore separation between world panels, and simplify the footer. Keep everything not mentioned exactly as-is.

## 1. Hero lockup
**Files:** `src/components/HeroSignature.tsx`

- Reduce triquetra stroke width from `12` to `3` px.
- Increase mark size by ~20%:
  - mobile: `w-[min(52vw,240px)]` → `w-[min(62vw,290px)]`
  - desktop: `md:w-[min(30vw,300px)]` → `md:w-[min(36vw,360px)]`
- Halve the vertical gap between mark and headline: `mt-10 md:mt-14` → `mt-5 md:mt-7`.
- Shrink the `*` in "Built with Creative Code Logic*" to 50% current size (superscript-like position is fine).
- Preserve the invisible sizer and absolute-positioned shared headline box so there is zero y-drift across loops.

## 2. World Creative — strongest world
**Files:** `src/components/worlds/WorldCreative.tsx`

- Make the canvas mark substantially bigger to fill its panel's visual area (`size = min(w, h) * 0.78`, up from `0.5`).
- Raise resting dot opacity to `0.45` (from `0.25`).
- Add a grid-to-home intro phase:
  - Dots begin as a uniform square grid of points covering the mark's bounding area.
  - Animate from grid positions to true triquetra positions over ~1.2s with staggered ease.
  - After all dots arrive, the comet begins its dot-to-dot draw.
- Slow comet traversal to ~6.5s full traversal (from 4s).
- After fill completes, hold 3s, fade ~0.8s, then restart the whole cycle (grid → positions → comet → glow → fill).
- Keep the faded/empty gap between cycles under 1s.
- Palette stays directly under the mark with labels, unchanged behavior.
- Reduced motion: static full mark, palette functional.

## 3. World Code — layout + terminal fit
**Files:** `src/components/worlds/WorldCode.tsx`

- Desktop (>=1024px): terminal left, copy right. Mobile keeps reading order: copy first, terminal second.
- Terminal height fits content; remove dead vertical gap between build log and metrics. Metrics sit directly under the log with normal line spacing.
- Matrix phase: ASCII art renders centered horizontally and vertically in the terminal, noticeably bigger than now. Terminal box sizes to contain the art with even padding; no empty bands above/below.
- Transition between log phase and matrix phase must not shift page layout: reserve via `min-height` of the larger phase, content centered in both.
- Keep the loop: log → metrics → hold 2s → wipe → matrix assemble → hold 4s → restart.

## 4. World panels — restore separation
**Files:** `src/components/worlds/WorldCreative.tsx`, `src/components/worlds/WorldCode.tsx`, `src/components/worlds/WorldLogic.tsx`

- Increase panels from `md:min-h-[46svh]` to `md:min-h-[60svh]` so each world owns its moment.
- Compensate by trimming dead space inside panels rather than between them.
- Total page height with Work hidden must stay <= ~75% of pre-prompt-06 height (7044px → target ≤ 5283px).
- Report before/after `document.documentElement.scrollHeight`.

## 5. Footer
**Files:** `src/components/Footer.tsx`

- Remove the triquetra symbol row and the Contact / LinkedIn row.
- Keep only the centered single line:
  `© 2026 Built with Creative Code Logic*. Designed to solve. Built to perform.`

## Quality bar
- Transform/opacity only; offscreen loops paused.
- No new dependencies.
- `tsc --noEmit` + `vite build` clean.
- Headless passes (`verify4.mjs`): full, reduced-motion, 390px; zero console errors.
- Hero y-drift check across two loops.
- `ScrollTrigger.refresh()` after layout changes.
- Print changed files (one line per change) and before/after scrollHeight.
