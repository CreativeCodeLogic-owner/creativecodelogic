# Creative Code Logic — website v4

The CCL corporate site: a single-page, scroll-driven brand experience. The
story runs in five chapters around one through-line — the triquetra mark. It
is drawn, taken apart into three worlds (Creative, Code, Logic), rebuilt as a
process, and offered as an invitation. Every chapter resolves back into the
mark.

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
| `VITE_FORMSPARK_FORM_ID_BRIEF` | Formspark form id for the inline brief flow. |
| `VITE_FORMSPARK_FORM_ID_CONTACT` | Formspark form id for the say-hello drawer. |
| `VITE_CAPTCHA_SITEKEY` | reCAPTCHA v2 (checkbox) site key for the contact drawer. |

Services behind these: the two forms post to **Formspark**; the contact form
is protected by a **reCAPTCHA v2 checkbox** whose *secret* lives in the
Formspark dashboard, not in this repo. With any value empty, the flow degrades
gracefully (the brief falls back to a `mailto:`, the captcha is skipped).

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
state, and touch targets — with **zero console errors** as a hard gate.
Screenshots land in `scripts/shots/v6/`. Earlier `verify.mjs`–`verify5.mjs`
are prior iterations; `verify6.mjs` is the current pass.

## Project structure

```
src/
  App.tsx                      composition: the five chapters in order
  main.tsx                     React root
  index.css                    Tailwind @theme tokens + @font-face
  components/
    HeroSignature.tsx          Ch.1 — The Mark (#signature)
    SignatureMeaning.tsx       Ch.2 — What goes into the build; hosts the worlds
    worlds/
      WorldCreative.tsx        the comet — draws the mark, palette interaction
      WorldCode.tsx            the terminal — build log + metrics, matrix assembly
      WorldLogic.tsx           the blueprint — technical construction, drag loops
    SignatureLives.tsx         Ch.3 — Built and live / Work (#work, SHOW_WORK)
    EarnSignature.tsx          Ch.4 — How we build / Process (#process)
    Invitation.tsx             Ch.5 — The Invitation / Contact (#contact)
    BriefForm.tsx              inline three-question brief
    HelloDrawer.tsx            slide-in say-hello drawer
    MobileMenu.tsx             full-screen mobile navigation
    AmbientField.tsx           faint per-chapter background field (behind VITE_AMBIENT)
    NavFrieze.tsx              header's scattered-triquetra frieze (curated compositions)
    BackToTop.tsx              floating scroll-to-top pill
    Nav.tsx  Footer.tsx  ProgressLine.tsx  Triquetra.tsx   chrome + the mark
  lib/
    scroll.ts                  the single GSAP/ScrollTrigger + Lenis wiring point
    flags.ts                   env-driven feature flags
    submit.ts                  shared Formspark submission path
    captcha.ts                 reCAPTCHA v2 checkbox lazy-load / render
    seal.ts                    the seal-stamp animation
  hooks/
    useMagnetic.ts             magnetic hover
    usePrefersReducedMotion.ts reactive reduced-motion flag
  data/
    triquetra.ts               authored v2 mark — 3 loop paths + derived VB_* geometry
    triquetraAscii.ts          authored ASCII mark for the Code terminal matrix
    triquetraBuild.ts          real construction circles for the Logic blueprint
    friezeCompositions.ts      curated header-frieze layouts (designer-tunable)
  assets/
    triquetra-variants/        8 styled mark SVGs dealt into the header frieze
public/                        fonts/, og.jpg, favicon set, robots.txt, sitemap.xml,
                               site.webmanifest, and static 404.html / terms.html / privacy.html
scripts/                       verify*.mjs, asset generators
docs/                          architecture.md, deployment.md, superpowers/ (archive)
```

## Conventions

Project conventions — GSAP/scroll wiring, reduced-motion contract, `data-*`
selector discipline, copy voice, styling tokens — live in **`CLAUDE.md`**. Read
it before changing code rather than duplicating the rules here.

## Current quality bar

Lighthouse (desktop preset), measured **2026-08-01** against the live
production URL (<https://creativecodelogic.web.app>) for v4.1.0:

| Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- |
| 94 | 100 | 100 | 100 |

LCP 0.7s, CLS 0 (Performance varies 93–97 across warm runs — a cold first request
dips lower). Rasterizing the header frieze to WebP recovered the points the SVG
frieze had cost. Re-measured after each meaningful change and against the
production URL after deploy. The terminal in the Code chapter shows these same
real values — it never claims anything unmeasured.
