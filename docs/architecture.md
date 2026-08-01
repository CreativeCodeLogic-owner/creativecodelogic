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

Chrome: `Nav`, `Footer`, `ProgressLine`, `BackToTop`, and `Triquetra` (the mark
as inline SVG, reused in the hero and worlds). The nav carries **no wordmark
logo** — instead `NavFrieze` scatters faint triquetra variants across the bar
(see below). `ProgressLine` is the scroll-drawn edge rule, raised **above** the
nav (`z-55`, below the `z-60` modals) so it reads over the header; it tapers
from a bold 6px top to 1px. `BackToTop` is a floating scroll-to-top pill that
fades in past the first viewport and hides while the inline brief is open.
`AmbientField` (a faint per-chapter background field) is parked behind the
`VITE_AMBIENT` flag — off by default (the page ships a solid navy background).

### The three worlds

`SignatureMeaning` renders the mark taken apart into three self-contained worlds,
each a different rendering of the same triquetra:

- **`WorldCreative`** — *the comet.* An ambient canvas loop: dots emerge from a
  grid, snap into constellation positions, a comet traces the mark dot-to-dot,
  the fill whispers in, then it fades and restarts. The colour palette (outline
  + fill) is the only interaction.
- **`WorldCode`** — *the terminal.* A build-log types in, real metrics count up
  (Lighthouse / LCP / console errors — measured, not invented), the log wipes,
  and the mark assembles matrix-style from the **authored ASCII art**
  (`data/triquetraAscii.ts`, rendered in bold JetBrains Mono) falling into place.
  Holds, then restarts. The terminal body is locked to a constant height so it
  never resizes between the log and matrix phases.
- **`WorldLogic`** — *the blueprint.* A scroll-scrubbed technical drawing: the
  sheet furniture (blueprint grid + major gridlines, centre axes, registration
  marks) stays full-size while the drawing scales to 0.68 about the composition
  centre. The **real construction circles** from the designer's build sheet
  (`data/triquetraBuild.ts`, aligned to the mark) draw in, the three loops trace
  over them with a plotter head riding the tip, then fills settle while a
  dimension/annotation layer (dims, R/C legends, 120° arc, "460 × 428") resolves.
  Once assembled, each loop can be dragged and springs back.

## The mark

`data/triquetra.ts` is the single source of truth for the mark geometry: the
**authored vector v2** — three hand-authored SVG path strings in a non-square
`viewBox` of `0 0 460.66 428.07`. The file parses that viewBox into derived
constants (`VB_W`, `VB_H`, `VB_CX`, `VB_CY`, `VB_MAX`) plus a runtime
`sampleMarkBBox()`, and every consumer (hero draw, worlds glow, ambient field,
blueprint) derives its scale/centre from those — nothing assumes a square. Loop
order encodes meaning: index `0` = top blade (Creative), `1` = lower-right
(Code), `2` = lower-left (Logic); `Triquetra`/`SignatureMeaning` map the active
world's index to the glowing loop. The old PNG-trace pipeline
(`scripts/extract_triquetra.py`) is **retired** for v2 — the paths are authored,
not traced.

Derived renderings of the same mark live alongside it: `triquetraAscii.ts`
(the ASCII matrix), `triquetraBuild.ts` (the real construction circles), and
`favicon.svg` / the favicon set.

## Header frieze

`NavFrieze` replaces a single logo with a faint scatter of styled triquetra
variants. `data/friezeCompositions.ts` is the **designer-tunable** surface: 5
desktop + 3 mobile curated compositions, each one anchor + 3–4 satellites with
discrete positions/sizes/rotations and faint opacities (`0.03`/`0.05`/`0.08`).
Per load one composition is chosen at random and the 8 variant SVGs
(`assets/triquetra-variants/`, bundled via `import.meta.glob`) are shuffled and
dealt onto its positions — no repeats within a composition, and the plain fill
never lands on the anchor. Purely decorative: `aria-hidden`, `pointer-events:
none`, below the nav content, clipped by the header's `overflow-hidden`.

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
- **`lib/flags.ts`** reads the env flags: `SHOW_WORK`, `SHOW_AMBIENT`,
  `FORMSPARK_FORM_ID_BRIEF`, `FORMSPARK_FORM_ID_CONTACT`, `CAPTCHA_SITEKEY`.
  Empty/false values degrade gracefully.
- **State.** `BriefForm`'s answers are lifted into `Invitation` so they survive
  a close/reopen; only a successful submission resets them.
