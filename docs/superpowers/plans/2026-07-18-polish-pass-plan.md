# Team + Reviewer Polish Pass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the five-area polish pass (hero lockup, World Creative, World Code, world panel heights, footer) while preserving total page height budget and passing runtime verification.

**Architecture:** Keep changes localized to the affected components (`HeroSignature`, `WorldCreative`, `WorldCode`, `WorldLogic`, `Footer`) and the shared `Triquetra` mark. Maintain the existing GSAP/ScrollTrigger lifecycle and reduced-motion fallbacks. World Creative's canvas loop is extended with a grid-to-home intro phase before the existing comet cycle.

**Tech Stack:** React 19 + TypeScript, Vite 8, Tailwind CSS v4, GSAP 3 + ScrollTrigger, Lenis, bun.

## Global Constraints

- No new dependencies.
- Transform/opacity only; no layout-thrashing properties animated.
- Offscreen loops paused via IntersectionObserver/ScrollTrigger.
- Every animated component retains a working `prefers-reduced-motion` fallback.
- TypeScript strict (`noUnusedLocals`/`noUnusedParameters`); `bun run build` must pass.
- Headless verification via `node scripts/verify4.mjs` must pass for full, reduced-motion, and 390px viewports with zero console errors.
- Hero y-drift check across two loops.
- `ScrollTrigger.refresh()` after layout changes.
- Print changed files (one line per change) and before/after `document.documentElement.scrollHeight`.

---

### Task 1: Hero lockup

**Files:**
- Modify: `src/components/HeroSignature.tsx`

**Interfaces:**
- Consumes: `TRIQUETRA_LOOPS`, `TRIQUETRA_VIEWBOX` from `@/data/triquetra`; `gsap` from `@/lib/scroll`; `usePrefersReducedMotion`.
- Produces: Rendered hero with thinner stroke, larger mark, tighter headline gap, smaller asterisk, zero y-drift.

- [ ] **Step 1: Reduce triquetra stroke width**
  Change `strokeWidth={reduced ? 0 : 12}` to `strokeWidth={reduced ? 0 : 3}`.

- [ ] **Step 2: Increase triquetra size**
  Change mark container widths:
  - `w-[min(52vw,240px)] md:w-[min(30vw,300px)]` → `w-[min(62vw,290px)] md:w-[min(36vw,360px)]`.

- [ ] **Step 3: Tighten headline gap**
  Change `className="... mt-10 ... md:mt-14 ..."` to `mt-5 md:mt-7`.

- [ ] **Step 4: Shrink asterisk**
  Wrap the asterisk in a `<span className="text-[0.5em] align-super">*</span>` inside the final headline.

- [ ] **Step 5: Type-check**
  Run: `bun run build`
  Expected: passes with no TS errors.

---

### Task 2: World Creative — grid-to-constellation intro

**Files:**
- Modify: `src/components/worlds/WorldCreative.tsx`

**Interfaces:**
- Consumes: `TRIQUETRA_LOOPS`; `gsap`; `usePrefersReducedMotion`.
- Produces: Canvas-rendered Creative world with grid intro, brighter resting dots, larger mark, slower comet, tighter loop cycle.

- [ ] **Step 1: Enlarge the canvas mark**
  In `layout()`, change `const size = Math.min(w, h) * 0.5;` to `const size = Math.min(w, h) * 0.78;`.

- [ ] **Step 2: Brighten resting dots**
  In node rendering, change `const bright = (0.25 + 0.75 * lit) * globalA;` to use `0.45` as the base: `const bright = (0.45 + 0.55 * lit) * globalA;`.

- [ ] **Step 3: Add grid-to-home intro phase**
  - Define `GRID_COLS = 14`.
  - Compute an even square grid of `DOTS_PER_LOOP * 3` points covering the mark's bounding box (`cx ± size/2`, `cy ± size/2`).
  - Store `gridX`/`gridY` Float32Arrays aligned with each loop's dot indices.
  - On cycle start, set `phase = 'grid'` and `phaseStart = now`.
  - During `t < GRID_S (1.2s)`, render dots interpolated from grid positions to home positions using `easeOutBack` or `power2.out` and a per-dot stagger based on loop+dot index.
  - After the grid phase completes, switch to the existing comet travel phase.

- [ ] **Step 4: Slow comet traversal**
  Change `TRAVEL_S` from `4` to `6.5`.

- [ ] **Step 5: Tighten cycle restart gap**
  Change `FADE_S` from `1` to `0.8`. After fade completes, immediately reset `cycleStart`/`history`/`phase` with no extra delay so the empty gap stays under 1s.

- [ ] **Step 6: Reduced-motion fallback**
  Ensure `reduced` branch still renders the static full mark and palette remains functional.

- [ ] **Step 7: Type-check**
  Run: `bun run build`
  Expected: passes with no TS errors.

---

### Task 3: World Code — terminal fit and layout swap

**Files:**
- Modify: `src/components/worlds/WorldCode.tsx`

**Interfaces:**
- Consumes: `TRIQUETRA_LOOPS`; `gsap`, `ScrollTrigger`; `usePrefersReducedMotion`.
- Produces: Desktop terminal-left/copy-right layout; content-fitting terminal; centered, larger matrix art; layout-stable phase transition.

- [ ] **Step 1: Swap desktop layout**
  - Add `lg:flex-row-reverse` (or equivalent grid reordering) so that on desktop the terminal appears first visually while the source order keeps copy first for mobile.
  - Apply `lg:order-2` to copy and `lg:order-1` to terminal container, or use `lg:col-start-*` if using CSS Grid.

- [ ] **Step 2: Remove dead vertical gap in terminal**
  - Restructure terminal internals so metrics sit directly under the log with normal spacing. Remove any `mt-6`/`pt-5` that creates dead space; replace with compact `mt-3`/`pt-3` or remove entirely.
  - Ensure terminal height fits its content.

- [ ] **Step 3: Center and enlarge matrix ASCII art**
  - Increase matrix font size: `text-[13px]` → `text-[18px] md:text-[22px]` for the ASCII stage.
  - Center the stage horizontally (`text-center`) and vertically using flexbox inside the terminal body.

- [ ] **Step 4: Size terminal box to matrix art**
  During matrix phase, the terminal body uses flex centering with even padding (`p-6` or `p-8`). During log phase, the same box holds the log. Reserve the larger of the two heights via `min-height` on the terminal body container.

- [ ] **Step 5: Stabilize phase transition**
  - Set `min-height` on the log/matrix stage wrapper to the computed matrix height (or a safe CSS value) so switching phases does not change the terminal's outer box height.
  - Center content in both phases.

- [ ] **Step 6: Preserve loop timing**
  Keep log → metrics → hold 2s → wipe → matrix assemble → hold 4s → restart.

- [ ] **Step 7: Type-check**
  Run: `bun run build`
  Expected: passes with no TS errors.

---

### Task 4: World panels — restore separation

**Files:**
- Modify: `src/components/worlds/WorldCreative.tsx`
- Modify: `src/components/worlds/WorldCode.tsx`
- Modify: `src/components/worlds/WorldLogic.tsx`

**Interfaces:**
- Produces: Panels taller (`60svh`) while total page height stays within budget.

- [ ] **Step 1: Increase panel min-height**
  Change `md:min-h-[46svh]` to `md:min-h-[60svh]` in all three world panels.

- [ ] **Step 2: Trim internal dead space**
  - Reduce excessive vertical padding inside panels (e.g., `py-20 md:py-0` may stay, but tighten any large internal gaps).
  - In `WorldCreative` and `WorldCode`, ensure copy blocks and interactive elements still fit without extra whitespace.

- [ ] **Step 3: Measure total scroll height**
  Run the dev server (`bun run dev`), open the page with Work hidden, and capture `document.documentElement.scrollHeight` before and after changes.
  Target with Work hidden: ≤ 5283px (75% of 7044px).

- [ ] **Step 4: Type-check**
  Run: `bun run build`
  Expected: passes with no TS errors.

---

### Task 5: Footer simplification

**Files:**
- Modify: `src/components/Footer.tsx`

**Interfaces:**
- Produces: Footer with only the centered copyright line.

- [ ] **Step 1: Remove symbol and nav rows**
  Remove the `<Triquetra>` import and element, and remove the `<nav>` containing Contact / LinkedIn.

- [ ] **Step 2: Keep single centered line**
  Render only:
  ```
  © 2026 Built with Creative Code Logic*. Designed to solve. Built to perform.
  ```
  Ensure the line remains centered.

- [ ] **Step 3: Type-check**
  Run: `bun run build`
  Expected: passes with no TS errors.

---

### Task 6: Final verification

**Files:**
- All modified files above.

- [ ] **Step 1: Full build**
  Run: `bun run build`
  Expected: `tsc --noEmit` + `vite build` succeed.

- [ ] **Step 2: Dev server + scroll height**
  Run: `bun run dev &`
  Capture `document.documentElement.scrollHeight` with Work hidden (`VITE_SHOW_WORK=false`).

- [ ] **Step 3: Headless verification**
  Run: `node scripts/verify4.mjs`
  Expected: all passes (full, reduced-motion, 390px) with zero console errors.

- [ ] **Step 4: Hero y-drift check**
  Visually inspect (or via verify screenshot) that the headline block does not shift vertically between the rotated lines and the final line.

- [ ] **Step 5: ScrollTrigger refresh**
  Ensure `App.tsx` triggers `ScrollTrigger.refresh()` after layout-affecting changes (panels) are mounted.

- [ ] **Step 6: Report**
  Print changed files (one line per change) and before/after scrollHeight.
