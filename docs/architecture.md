# Architecture

A map of how the site fits together. For the coding conventions themselves, see
`CLAUDE.md`.

## Chapters and components

The site is one page, composed in `src/App.tsx` as five chapters in order. Each
resolves back into the triquetra mark.

| Chapter | Component | Section id | What it is |
| --- | --- | --- | --- |
| 1 — The Mark | `HeroSignature` | `#signature` | The triquetra draws itself loop by loop, then the headline rotates through the three ingredients. |
| 2 — What goes into the build | `SignatureMeaning` | — | Hosts the three worlds (below). |
| 3 — Built and live (Work) | `SignatureLives` | `#work` | Case cards. Rendered only when `SHOW_WORK` is set. |
| 4 — How we build (Process) | `EarnSignature` | `#process` | The build standard, step dots filling, the seal stamp. |
| 5 — The Invitation | `Invitation` | `#contact` | The closer: opens the brief flow and the hello drawer. |

Chrome: `Nav`, `Footer`, `ProgressLine` (the scroll-drawn edge rule), and
`Triquetra` (the mark as inline SVG, reused everywhere).

### The three worlds

`SignatureMeaning` renders the mark taken apart into three self-contained worlds,
each a different rendering of the same triquetra:

- **`WorldCreative`** — *the comet.* An ambient canvas loop: dots emerge from a
  grid, snap into constellation positions, a comet traces the mark dot-to-dot,
  the fill whispers in, then it fades and restarts. The colour palette (outline
  + fill) is the only interaction.
- **`WorldCode`** — *the terminal.* A build-log types in, real metrics count up
  (Lighthouse / LCP / console errors — measured, not invented), the log wipes,
  and the mark assembles matrix-style from falling braille characters. Holds,
  then restarts.
- **`WorldLogic`** — *the blueprint.* A scroll-scrubbed technical drawing:
  registration marks and a blueprint grid fade in, dashed construction guides
  draw, the three loops trace over them with a plotter head riding the tip,
  then fills settle while a dimension/annotation layer resolves. Once assembled,
  each loop can be dragged and springs back.

## Animation system

- **`src/lib/scroll.ts` is the single wiring point.** It registers ScrollTrigger,
  wires Lenis into the GSAP ticker, and exports `gsap`, `ScrollTrigger`,
  `scrollToId`, and `stopScroll`/`startScroll` (modal scroll lock). Import GSAP
  and ScrollTrigger from here, never from the `gsap` package directly.
- **Reduced motion.** `usePrefersReducedMotion` gates every animation. Under
  reduced motion, components render their final static state (the fully-drawn
  mark, the completed log, instant swaps) — never a blank or mid-animation
  state. `initSmoothScroll` also no-ops (no Lenis) under reduced motion.
- **`data-*` selectors are the contract.** Animations target `data-*` attributes
  (`data-world`, `data-loop`, `data-metric-value`, `data-brief-*`, …), and the
  verify script asserts against the same attributes. Keep them stable when
  refactoring markup.
- **Discipline.** GSAP animations live in `useLayoutEffect` inside
  `gsap.context(..., rootRef)`, cleaned up with `ctx.revert()`. Hot paths
  (pointermove, per-frame) mutate the DOM directly; React state is for discrete
  UI state only. Call `ScrollTrigger.refresh()` after layout-affecting changes.
- **Focus + overlays.** Drawers/menus (`HelloDrawer`, `MobileMenu`) portal to
  `document.body` at `z-[60]` (above the `z-50` nav), trap focus with sentinel
  guard elements (not keydown-only — that fails across a cross-origin captcha
  iframe), lock scroll via `stopScroll`/`startScroll`, and reveal with `opacity`
  (never `autoAlpha`, whose `visibility:hidden` blocks `focus()`).

## Forms

Both forms share one submission path and post to Formspark.

```
BriefForm   ─┐
             ├─►  lib/submit.ts  ──►  POST https://submit-form.com/<form id>
HelloDrawer ─┘         │
                       └─ honeypot short-circuit · empty id → mailto (brief only)
                          · attaches g-recaptcha-response when a token is present
```

- **`lib/submit.ts`** takes `(formId, payload, mailtoHref | null, token)`. The
  honeypot (`_gotcha`) silently succeeds; an empty form id falls back to a
  `mailto:` when one is provided (brief) or a quiet no-op success (contact — no
  email in that UI); otherwise it POSTs JSON.
- **`lib/captcha.ts`** lazy-loads reCAPTCHA `api.js` (explicit render) exactly
  once, on first open of a form that needs it, and renders a **visible v2
  checkbox** (contact drawer only — the brief has no captcha). The widget's
  callback pushes the token into React state, which gates the Send button.
- **`lib/flags.ts`** reads the env flags: `SHOW_WORK`, `FORMSPARK_FORM_ID_BRIEF`,
  `FORMSPARK_FORM_ID_CONTACT`, `CAPTCHA_SITEKEY`. Empty values degrade
  gracefully.
- **State.** `BriefForm`'s answers are lifted into `Invitation` so they survive
  a close/reopen; only a successful submission resets them.
