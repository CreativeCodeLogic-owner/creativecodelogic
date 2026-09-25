# Architecture

A map of how the site fits together. For the coding conventions themselves, see
`CLAUDE.md`.

## Chapters and components

The site is one page, composed in `src/App.tsx`: four chapters by default, plus
a Work chapter behind `VITE_SHOW_WORK`. Each resolves back into the triquetra
mark.

| Chapter | Component | Section id | What it is |
| --- | --- | --- | --- |
| The Mark (hero) | `HeroSignature` | `#signature` | The triquetra draws itself loop by loop, then the headline rotates through the three ingredients. |
| What goes into the build | `SignatureMeaning` | none | Hosts the three worlds (below). |
| Built and live (Work) | `SignatureLives` | `#work` | Case cards (still placeholders). Rendered only when `SHOW_WORK` is set. |
| How we build (Process) | `EarnSignature` | `#process` | The build standard, step dots filling, the seal stamp. |
| The Invitation | `Invitation` | `#contact` | The closer: opens the brief flow and the hello drawer. |

Chrome: `Nav`, `Footer`, `BackToTop`, `ConsentBanner`, and `Triquetra` (the
mark as inline SVG, reused in the hero and worlds). The nav's `#signature` link
is the **CCL wordmark** (`font-display`, semibold, tracked, ink, hover accent;
aria-label "CCL, Creative Code Logic, back to top"), in both the desktop nav
and the mobile menu. `BackToTop` is a floating scroll-to-top pill that fades in
past the first viewport and hides while the inline brief is open. The footer
carries Terms, Privacy and, when a GA id is set, "Privacy choices" (see
Consent and analytics).

**Benched** (kept in the tree, not shipped):

- `ProgressLine`, the scroll-drawn left-edge rule (z-55, tapering 6px to 1px).
  Unmounted in `App.tsx`; revive by uncommenting its import and mounting it.
- `NavFrieze`, the header frieze (below). Unmounted in `Nav.tsx`; revive by
  uncommenting its import and mounting it inside the `<header>`.
- `AmbientField`, a faint per-chapter background field. Behind the
  `VITE_AMBIENT` flag, off by default (the page ships a solid navy background).

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

## Header frieze (benched)

Benched since 4.2.1: `NavFrieze` is not mounted, so none of this ships. It is
kept for revival. `NavFrieze` scatters faint styled triquetra variants behind
the nav bar. `data/friezeCompositions.ts` is the **designer-tunable** surface: 5
desktop + 3 mobile curated compositions, each one anchor + 3–4 satellites with
discrete positions/sizes/rotations and faint opacities (`0.03`/`0.05`/`0.08`).
Per load one composition is chosen at random and the 8 variants are shuffled
and dealt onto its positions: no repeats within a composition, and the plain
fill never lands on the anchor. The variants load as **WebP** (220px, quality
85), pre-rasterized from the `.svg` sources in `assets/triquetra-variants/` by
`scripts/rasterize-frieze.mjs` and bundled via `import.meta.glob("*.webp")`,
decoded `async` at `fetchpriority="low"`. Purely decorative: `aria-hidden`,
`pointer-events: none`, below the nav content, clipped by the header's
`overflow-hidden`.

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
                       └─ honeypot short-circuit · empty id → mailto (brief)
                          or "error" (contact) · attaches g-recaptcha-response
                          when a token is present
```

- **`lib/submit.ts`** takes `(formId, payload, mailtoHref | null, token)` and
  returns `"success"` or `"error"`:
  - the honeypot (`_gotcha`) silently returns `"success"` (bots are swallowed);
  - an empty form id with a `mailto:` (the brief) opens the mail client and
    returns `"success"`;
  - an empty form id without one (the contact drawer, which shows no email)
    returns `"error"`, so the drawer shows "Something broke on the way. Give it
    another try." with a Try again button, and never drops a message silently;
  - otherwise it POSTs JSON; a network failure or non-2xx response returns
    `"error"` (the brief's error state offers a `mailto:` link, the drawer its
    retry).

  Production builds cannot reach the empty-id paths: `vite.config.ts` refuses
  to build without both form ids (see Deployment).
- **`lib/captcha.ts`** lazy-loads reCAPTCHA `api.js` (explicit render) exactly
  once, on first open of a form that needs it, and renders a **visible v2
  checkbox** (contact drawer only — the brief has no captcha). The widget's
  callback pushes the token into React state, which gates the Send button.
- **`lib/flags.ts`** reads the env flags: `SHOW_WORK`, `SHOW_AMBIENT`,
  `FORMSPARK_FORM_ID_BRIEF`, `FORMSPARK_FORM_ID_CONTACT`, `CAPTCHA_SITEKEY`,
  `GA_MEASUREMENT_ID`. In dev, empty/false values degrade as described above.
- **State.** `BriefForm`'s answers are lifted into `Invitation` so they survive
  a close/reopen; only a successful submission resets them.

## Consent and analytics

GA4 runs under **Consent Mode v2**. The tag library loads with the page, but
nothing is set or recorded until the visitor accepts.

1. **`index.html`** holds an inline snippet that runs only when
   `%VITE_GA_MEASUREMENT_ID%` starts with `G-`. It sets `analytics_storage`,
   `ad_storage`, `ad_user_data` and `ad_personalization` to **denied** by
   default, grants `analytics_storage` early for a stored, unexpired accept
   (so gtag.js starts in the right state), runs `config` with
   `send_page_view: false`, and loads `gtag.js`. It never sends a page_view.
2. **`ConsentBanner`** (non-modal, `role="region"`, hidden while the inline
   brief is open) shows only with a GA id and no stored choice. On mount, a
   stored accept re-grants and records the page view; a stored decline
   re-denies. Accept stores the choice, grants and records the page view;
   Decline stores the choice and denies.
3. **`lib/consent.ts`** stores the choice in `localStorage` (`ccl-consent`,
   versioned, re-asked after 12 months) and holds the gtag helpers.
   `recordPageView()` has a module-scope once-guard, so a page load sends at
   most one page_view (StrictMode's double effects included).
4. **Withdrawal.** The footer's "Privacy choices" button (rendered only with a
   GA id) calls `clearConsent()`: it removes the stored choice, denies
   `analytics_storage`, deletes `_ga*` cookies on the host and parent domain,
   and dispatches `ccl:consent-reset` so the banner re-appears.

verify6's consent checks assert 0 `/g/collect` hits and 0 `_ga*` cookies
before a choice, one page_view after Accept, one more after a reload, and none
after Decline or withdrawal.
