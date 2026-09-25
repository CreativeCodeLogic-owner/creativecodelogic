# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-09-25T09:19:46.276Z
> Files: 80 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `.firebaserc` (~16 tok)
- `.gitattributes` — Git attributes (~4 tok)
- `.gitignore` — Git ignore rules (~107 tok)
- `CHANGELOG.md` — Changelog (~3832 tok)
- `CLAUDE.md` — OpenWolf (~603 tok)
- `firebase.json` (~225 tok)
- `index.html` — Creative Code Logic · Built with creativity, code, and logic (~1543 tok)
- `package.json` — Node.js package manifest (~181 tok)
- `README.md` — Project documentation (~2089 tok)
- `tsconfig.json` — TypeScript configuration (~144 tok)
- `vite.config.ts` — A production build without these ships a site whose forms, captcha or (~343 tok)

## copy/

- `homepage-narrative-v1.md` — CCL Website — Homepage Narrative v1 (~1612 tok)
- `homepage-narrative-v2.md` — CCL Website — Homepage Narrative v2 (~1294 tok)

## docs/

- `architecture.md` — Architecture (~2654 tok)
- `deployment.md` — Deployment (~1694 tok)

## docs/superpowers/plans/

- `2026-07-18-polish-pass-plan.md` — Team + Reviewer Polish Pass — Implementation Plan (~2237 tok)

## docs/superpowers/specs/

- `2026-07-18-polish-pass-design.md` — Team + Reviewer Polish Pass — Design Spec (~913 tok)

## public/

- `404.html` — Page not found · Creative Code Logic (~1043 tok)
- `privacy.html` — Privacy Policy · Creative Code Logic (~1754 tok)
- `robots.txt` (~24 tok)
- `site.webmanifest` (~108 tok)
- `sitemap.xml` (~89 tok)
- `terms.html` — Terms of Use · Creative Code Logic (~1565 tok)

## public/email/

- `admin.html` — CCL Admin | CCL signature (~878 tok)
- `devteam.html` — CCL Dev Team | CCL signature (~881 tok)
- `ghassan.html` — Ghassan Abboud | CCL signature (~913 tok)
- `nadim.html` — Nadim | CCL signature (~907 tok)
- `oussama.html` — Oussama | CCL signature (~907 tok)

## scripts/

- `extract_triquetra.py` — Trace the CCL triquetra PNG into three SVG stroke paths (one per loop/blade). (~2211 tok)
- `make_product_placeholders.py` — Generate placeholder case-card images (public/products/*.png). (~1722 tok)
- `rasterize-frieze.mjs` — Build-time asset step (not shipped, no runtime dep): rasterize each triquetra (~513 tok)
- `verify.mjs` — Visual/runtime verification for the CCL site against the dev server. (~860 tok)
- `verify2.mjs` — v2 verification: three worlds + P2 fixes, full / reduced / mobile passes. (~1210 tok)
- `verify3.mjs` — v3 verification: hero rotation, world triquetra embeddings, v2 copy. (~1095 tok)
- `verify4.mjs` — v4 verification: hero loop, creative game, ascii playground, logic drag, (~2575 tok)
- `verify5.mjs` — v5 verification: hero state model (2 loops), creative persistence+reset+ (~2685 tok)
- `verify6.mjs` — v6 verification: hero y-stability across 2 loops, comet ambient, matrix (~17932 tok)

## src/

- `App.tsx` — import { ProgressLine } from "@/components/ProgressLine"; // benched per team feedback 2026-08 (~646 tok)
- `index.css` — Styles: 25 rules, 8 vars (~1614 tok)
- `main.tsx` (~68 tok)

## src/assets/triquetra-variants/

- `01_triquetra_build.webp` (~2845 tok)
- `02_triquetra_outline.webp` (~2037 tok)
- `03_triquetra_fill.webp` (~1426 tok)
- `04_triquetra_8bit_fill.webp` (~878 tok)
- `05_triquetra_8bit_outline.webp` (~1243 tok)
- `06_triquetra_dots_lines.webp` (~1815 tok)
- `07_triquetra_dots.webp` (~1208 tok)
- `08_triquetra_ascii.webp` (~3053 tok)

## src/components/

- `AmbientField.tsx` — Deterministic PRNG so a chapter's scatter is identical across reloads. (~4020 tok)
- `BackToTop.tsx` — A floating "back to top" pill, fixed bottom-right (below the drawer/menu at (~820 tok)
- `BriefForm.tsx` — The brief's data — lifted to the caller so it survives close/reopen. (~3847 tok)
- `ChunkMounted.tsx` — Rendered as the last child inside a lazy chapter's Suspense boundary: it (~180 tok)
- `ConsentBanner.tsx` — Consent-first analytics notice. Shown on first visit only when a GA id is (~1186 tok)
- `EarnSignature.tsx` — Chapter 4 — How we build. (~2030 tok)
- `Footer.tsx` — Footer (~458 tok)
- `HelloDrawer.tsx` — A slide-in drawer for a quick hello. Posts to the CONTACT Formspark form (~3531 tok)
- `HeroSignature.tsx` — Chapter 1 — The Mark. (~2461 tok)
- `Invitation.tsx` — Chapter 5 — The Invitation. (~1797 tok)
- `MobileMenu.tsx` — Close with focus returned to the hamburger. (~1732 tok)
- `Nav.tsx` — import { NavFrieze } from "@/components/NavFrieze"; // benched per team feedback 2026-08 (~1430 tok)
- `NavFrieze.tsx` — Deal distinct variants onto a composition's positions (no repeats within a (~1038 tok)
- `ProgressLine.tsx` — The journey line — a cyan rule glued to the left edge, drawn by scroll. A (~762 tok)
- `SignatureLives.tsx` — Chapter 3 — Built and live. (~2227 tok)
- `SignatureMeaning.tsx` — Chapter 2 — What goes into the build. (~1207 tok)
- `Triquetra.tsx` — Index of the loop that glows cyan — 0 top, 1 lower-right, 2 lower-left (~502 tok)

## src/components/worlds/

- `WorldCode.tsx` — World B — Code. Ambient terminal loop: the build log streams in, metrics (~4511 tok)
- `WorldCreative.tsx` — Indices of ~target dots per loop, denser where curvature is higher. (~5754 tok)
- `WorldLogic.tsx` — Built once at mount — pure geometry, no data: (~6068 tok)

## src/data/

- `friezeCompositions.ts` — Curated header-frieze compositions — DESIGNER-TUNABLE. Ghassan edits the (~1276 tok)
- `triquetra.ts` — CCL triquetra mark — authored vector (v2), redesigned 2026-07-30. (~1183 tok)
- `triquetraAscii.ts` — Authored ASCII rendering of the v2 triquetra mark, embedded verbatim from (~457 tok)
- `triquetraBuild.ts` — Real construction geometry for the v2 triquetra, extracted from the designer's (~497 tok)

## src/hooks/

- `useMagnetic.ts` — Magnetic hover: the element leans toward the cursor when it comes within (~731 tok)
- `usePrefersReducedMotion.ts` — Reactive prefers-reduced-motion flag. (~165 tok)

## src/lib/

- `captcha.ts` — Lazy-load the reCAPTCHA script exactly once (explicit render mode). (~682 tok)
- `consent.ts` — Consent-first analytics under Consent Mode v2. The gtag.js library loads with (~1110 tok)
- `flags.ts` — Feature flags from the environment (see .env / .env.example). (~433 tok)
- `scroll.ts` — Wire Lenis smooth scrolling into the GSAP ticker so ScrollTrigger and (~549 tok)
- `seal.ts` — The physical seal stamp: scale 1.6 → 1 with a -8deg → 0deg settle and an (~344 tok)
- `submit.ts` — Shared submission path. Honeypot short-circuits; an empty form id falls back (~358 tok)
