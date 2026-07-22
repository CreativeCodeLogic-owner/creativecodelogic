# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-07-22T08:55:22.120Z
> Files: 65 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `.firebaserc` (~18 tok)
- `.gitattributes` (~4 tok)
- `.gitignore` — Git ignore rules (~99 tok)
- `AGENTS.md` — CCL Website (www-v4) (~1851 tok)
- `CHANGELOG.md` — Changelog (~1083 tok)
- `CLAUDE.md` — OpenWolf (~462 tok)
- `firebase.json` (~225 tok)
- `index.html` — Creative Code Logic — Built with creativity, code, and logic (~709 tok)
- `package.json` — Node.js package manifest (~181 tok)
- `README.md` — Project documentation (~1308 tok)
- `tsconfig.json` — TypeScript configuration (~144 tok)
- `vite.config.ts` — Vite build configuration (~98 tok)
- `www-v4.code-workspace` (~16 tok)

## .claude/

- `settings.json` (~441 tok)

## .claude/rules/

- `openwolf.md` (~313 tok)

## .review/

- `h2b.json` (~48 tok)

## .secrets/

- `firebase.md` — Declares firebaseConfig (~260 tok)
- `formspark.md` (~21 tok)
- `github.md` (~36 tok)

## copy/

- `homepage-narrative-v1.md` — CCL Website — Homepage Narrative v1 (~1612 tok)
- `homepage-narrative-v2.md` — CCL Website — Homepage Narrative v2 (~1294 tok)

## docs/

- `architecture.md` — Architecture (~1228 tok)
- `deployment.md` — Deployment (~775 tok)

## docs/superpowers/plans/

- `2026-07-18-polish-pass-plan.md` — Team + Reviewer Polish Pass — Implementation Plan (~2237 tok)

## docs/superpowers/specs/

- `2026-07-18-polish-pass-design.md` — Team + Reviewer Polish Pass — Design Spec (~913 tok)

## public/

- `privacy.html` — Privacy Policy — Creative Code Logic (~1447 tok)
- `robots.txt` (~19 tok)
- `sitemap.xml` (~83 tok)
- `terms.html` — Terms of Use — Creative Code Logic (~1461 tok)

## scripts/

- `extract_triquetra.py` — Trace the CCL triquetra PNG into three SVG stroke paths (one per loop/blade). (~2211 tok)
- `make_product_placeholders.py` — Generate placeholder case-card images (public/products/*.png). (~1722 tok)
- `verify.mjs` — Visual/runtime verification for the CCL site against the dev server. (~860 tok)
- `verify2.mjs` — v2 verification: three worlds + P2 fixes, full / reduced / mobile passes. (~1210 tok)
- `verify3.mjs` — v3 verification: hero rotation, world triquetra embeddings, v2 copy. (~1095 tok)
- `verify4.mjs` — v4 verification: hero loop, creative game, ascii playground, logic drag, (~2575 tok)
- `verify5.mjs` — v5 verification: hero state model (2 loops), creative persistence+reset+ (~2685 tok)
- `verify6.mjs` — v6 verification: hero y-stability across 2 loops, comet ambient, matrix (~10485 tok)

## src/

- `App.tsx` — App (~337 tok)
- `index.css` — Styles: 22 rules, 8 vars (~1297 tok)
- `main.tsx` (~68 tok)

## src/components/

- `AmbientField.tsx` — Deterministic PRNG so a chapter's scatter is identical across reloads. (~4030 tok)
- `BriefForm.tsx` — The brief's data — lifted to the caller so it survives close/reopen. (~3847 tok)
- `CaptchaNotice.tsx` — Google's required attribution when the reCAPTCHA badge is hidden. Renders (~244 tok)
- `EarnSignature.tsx` — Chapter 4 — How we build. (~2076 tok)
- `Footer.tsx` — Footer (~259 tok)
- `HelloDrawer.tsx` — A slide-in drawer for a quick hello. Posts to the CONTACT Formspark form (~3339 tok)
- `HeroSignature.tsx` — Chapter 1 — The Mark. (~2214 tok)
- `Invitation.tsx` — Chapter 5 — The Invitation. (~1768 tok)
- `MobileMenu.tsx` — Close with focus returned to the hamburger. (~1555 tok)
- `Nav.tsx` — MENU_ID (~1308 tok)
- `ProgressLine.tsx` — The journey line — a cyan rule glued to the left edge, drawn by scroll. A (~727 tok)
- `SignatureLives.tsx` — Chapter 3 — Built and live. (~2222 tok)
- `SignatureMeaning.tsx` — Chapter 2 — What goes into the build. (~840 tok)
- `Triquetra.tsx` — Index of the loop that glows cyan — 0 top, 1 lower-right, 2 lower-left (~501 tok)

## src/components/worlds/

- `WorldCode.tsx` — Runtime braille renderer: rasterize the triquetra paths at cols×rows (~4657 tok)
- `WorldCreative.tsx` — Indices of ~target dots per loop, denser where curvature is higher. (~5628 tok)
- `WorldLogic.tsx` — Sampled once at mount — pure geometry, no text or data: (~5462 tok)

## src/data/

- `triquetra.ts` — Triquetra loop paths traced from .brief/branding/Triquetra_Fill.png (~1056 tok)

## src/hooks/

- `useMagnetic.ts` — Magnetic hover: the element leans toward the cursor when it comes within (~731 tok)
- `usePrefersReducedMotion.ts` — Reactive prefers-reduced-motion flag. (~165 tok)

## src/lib/

- `captcha.ts` — Lazy-load the reCAPTCHA script exactly once (explicit render mode). (~670 tok)
- `flags.ts` — Feature flags from the environment (see .env / .env.example). (~234 tok)
- `scroll.ts` — Wire Lenis smooth scrolling into the GSAP ticker so ScrollTrigger and (~483 tok)
- `seal.ts` — The physical seal stamp: scale 1.6 → 1 with a -8deg → 0deg settle and an (~330 tok)
- `submit.ts` — Shared submission path. Honeypot short-circuits; an empty form id falls back (~326 tok)
