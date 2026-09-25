# Creative Code Logic — website v4

The CCL corporate site: a single-page, scroll-driven brand experience. The
story runs in four chapters around one through-line, the triquetra mark. It
is drawn, taken apart into three worlds (Creative, Code, Logic), rebuilt as a
process, and offered as an invitation. Every chapter resolves back into the
mark. A fifth chapter, Work, is built but ships only when `VITE_SHOW_WORK=true`.

## Stack

- **React 19** + **TypeScript** (strict, `noUnusedLocals`/`noUnusedParameters`)
- **Vite 8**, **bun** as the package manager and runtime
- **Tailwind CSS v4** — CSS-first, design tokens in `@theme` in `src/index.css`
- **GSAP 3** + **ScrollTrigger** for animation, **Lenis** for smooth scroll
- Self-hosted **Aptos** (variable) for body + display and **JetBrains Mono**
  for the terminal — no third-party font runtime dependency

## Getting started

```bash
bun install
cp .env.example .env      # then fill in the values (see below)
bun run dev               # http://localhost:5173
```

### Environment

Copy `.env.example` to `.env` and set each variable. The example file holds
names only — real values never live in the repo.

| Variable | Purpose |
| --- | --- |
| `VITE_SHOW_WORK` | Toggles the Work chapter (`SignatureLives`). `true` shows it. |
| `VITE_AMBIENT` | Mounts the ambient background field (`AmbientField`). `true` shows it; off by default (solid navy). |
| `VITE_FORMSPARK_FORM_ID_BRIEF` | Formspark form id for the inline brief flow. Required for production builds. |
| `VITE_FORMSPARK_FORM_ID_CONTACT` | Formspark form id for the say-hello drawer. Required for production builds. |
| `VITE_CAPTCHA_SITEKEY` | reCAPTCHA v2 (visible checkbox) site key for the contact drawer. Required for production builds. |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 id (`G-…`). Enables the consent banner and GA4 under Consent Mode v2. Required for production builds. |

Services behind these: the two forms post to **Formspark**; the contact form
is protected by a **reCAPTCHA v2 checkbox** whose *secret* lives in the
Formspark dashboard, not in this repo.

**Production build guard.** `bun run build` fails fast, naming the missing
variables (never their values), if any of the four required ids is empty
(`vite.config.ts`). In dev, empty values degrade instead: the brief falls back
to a `mailto:`, the contact drawer shows its error state rather than dropping a
message, the captcha is skipped, and with no GA id no banner or analytics load.

## Commands

| Command | What it does |
| --- | --- |
| `bun run dev` | Dev server on `:5173`. |
| `bun run build` | `tsc --noEmit` then `vite build` — the build gates on a clean type-check. |
| `bun run preview` | Serves the production build (`dist/`) on `:4173`. |

### Verification

Visual/behavioural checks run headless against a running dev server:

```bash
bun run dev
node scripts/verify6.mjs
```

`verify6.mjs` drives real Chrome across three viewports (full desktop,
reduced-motion, 390px mobile) and asserts the whole site: hero stability, the
three worlds, the brief flow and hello drawer (focus management, scroll lock,
captcha gating, no email leakage), the mobile menu, self-hosted fonts, nav
state, touch targets and the consent flow. Every check is compared against an
explicit expectation map; the run ends with `VERIFY6: PASS` or `VERIFY6: FAIL`
and exits non-zero on any failure or console error. Benched systems are listed
as skips. Set `CHROME_PATH` to override the default Chrome location.
Screenshots land in `scripts/shots/v6/`. Earlier `verify.mjs`–`verify5.mjs`
are prior iterations; `verify6.mjs` is the current pass.

## Project structure

```
src/
  App.tsx                      composition: the chapters in order
  main.tsx                     React root
  index.css                    Tailwind @theme tokens + @font-face
  components/
    HeroSignature.tsx          Hero: The Mark (#signature)
    SignatureMeaning.tsx       What goes into the build; hosts the three worlds
    worlds/
      WorldCreative.tsx        01 the comet: draws the mark, palette interaction
      WorldCode.tsx            02 the terminal: build log + metrics, matrix assembly
      WorldLogic.tsx           03 the blueprint: technical construction, drag loops
    SignatureLives.tsx         Work: Built and live (#work), only when VITE_SHOW_WORK=true
    EarnSignature.tsx          How we build / Process (#process)
    Invitation.tsx             The Invitation / Contact (#contact)
    BriefForm.tsx              inline three-question brief
    HelloDrawer.tsx            slide-in say-hello drawer
    ConsentBanner.tsx          consent-first GA4 banner (Consent Mode v2)
    MobileMenu.tsx             full-screen mobile navigation
    BackToTop.tsx              floating scroll-to-top pill
    Nav.tsx  Footer.tsx  Triquetra.tsx   chrome (CCL wordmark link, Privacy choices) + the mark
    AmbientField.tsx           BENCHED: faint per-chapter background field
    NavFrieze.tsx              BENCHED: header's scattered-triquetra frieze (WebP variants)
    ProgressLine.tsx           BENCHED: scroll-drawn left-edge rule
  lib/
    scroll.ts                  the single GSAP/ScrollTrigger + Lenis wiring point
    flags.ts                   env-driven feature flags
    consent.ts                 consent storage + gtag consent/page_view helpers
    submit.ts                  shared Formspark submission path
    captcha.ts                 reCAPTCHA v2 checkbox lazy-load / render
    seal.ts                    the seal-stamp animation
  hooks/
    useMagnetic.ts             magnetic hover
    usePrefersReducedMotion.ts reactive reduced-motion flag
  data/
    triquetra.ts               authored v2 mark: 3 loop paths + derived VB_* geometry
    triquetraAscii.ts          authored ASCII mark for the Code terminal matrix
    triquetraBuild.ts          real construction circles for the Logic blueprint
    friezeCompositions.ts      curated header-frieze layouts (designer-tunable; frieze benched)
  assets/
    triquetra-variants/        8 styled mark variants (SVG sources + the WebP the frieze loads)
public/                        fonts/, og.jpg, favicon set, robots.txt, sitemap.xml,
                               site.webmanifest, static 404.html / terms.html / privacy.html,
                               and email/ (signature avatars + noindex pages, not linked)
scripts/                       verify*.mjs, asset generators
docs/                          architecture.md, deployment.md, superpowers/ (archive)
```

### Benched systems

Kept in the tree, not shipped. Each revives without other changes:

| Component | How it is off | Revive |
| --- | --- | --- |
| `AmbientField` | `VITE_AMBIENT` is not `true` | set `VITE_AMBIENT=true` and rebuild |
| `ProgressLine` | import commented out and not mounted in `App.tsx` | uncomment the import and mount `<ProgressLine />` in `App.tsx` |
| `NavFrieze` | import commented out and not mounted in `Nav.tsx` | uncomment the import and mount `<NavFrieze />` inside the `<header>` in `Nav.tsx` |

verify6 skips each benched system's checks. When you revive one, add its
checks to the `EXPECTED` map in `scripts/verify6.mjs`, or the gate fails.

## Conventions

Project conventions — GSAP/scroll wiring, reduced-motion contract, `data-*`
selector discipline, copy voice, styling tokens — live in **`CLAUDE.md`**. Read
it before changing code rather than duplicating the rules here.

## Current quality bar

PageSpeed Insights (Lighthouse 13.5.0), measured **2026-09-25** against the live
site <https://creativecodelogic.com>:

| Form factor | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS | Speed Index | Report |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Desktop | 95 | 100 | 100 | 100 | 0.8s | 1.0s | 140ms | 0 | 0.8s | [desktop](https://pagespeed.web.dev/analysis/https-creativecodelogic-com/o8ty0auv7a?form_factor=desktop) |
| Mobile (emulated Moto G Power, slow 4G) | 75 | 100 | 100 | 100 | 3.3s | 4.3s | 140ms | 0 | 4.9s | [mobile](https://pagespeed.web.dev/analysis/https-creativecodelogic-com/o8ty0auv7a?form_factor=mobile) |

Mobile performance work is planned. Re-measured against the live site after each
meaningful deploy. The terminal in the Code chapter shows the desktop values, and
it never claims anything unmeasured.
