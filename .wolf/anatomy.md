# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-07-21T10:56:25.067Z
> Files: 47 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `.gitignore` — Git ignore rules (~81 tok)
- `AGENTS.md` — CCL Website (www-v4) (~1851 tok)
- `CLAUDE.md` — OpenWolf (~445 tok)
- `index.html` — Creative Code Logic — Built with creativity, code, and logic (~368 tok)
- `package.json` — Node.js package manifest (~181 tok)
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

## docs/superpowers/plans/

- `2026-07-18-polish-pass-plan.md` — Team + Reviewer Polish Pass — Implementation Plan (~2237 tok)

## docs/superpowers/specs/

- `2026-07-18-polish-pass-design.md` — Team + Reviewer Polish Pass — Design Spec (~913 tok)

## scripts/

- `extract_triquetra.py` — Trace the CCL triquetra PNG into three SVG stroke paths (one per loop/blade). (~2211 tok)
- `make_product_placeholders.py` — Generate placeholder case-card images (public/products/*.png). (~1722 tok)
- `verify.mjs` — Visual/runtime verification for the CCL site against the dev server. (~860 tok)
- `verify2.mjs` — v2 verification: three worlds + P2 fixes, full / reduced / mobile passes. (~1210 tok)
- `verify3.mjs` — v3 verification: hero rotation, world triquetra embeddings, v2 copy. (~1095 tok)
- `verify4.mjs` — v4 verification: hero loop, creative game, ascii playground, logic drag, (~2575 tok)
- `verify5.mjs` — v5 verification: hero state model (2 loops), creative persistence+reset+ (~2685 tok)
- `verify6.mjs` — v6 verification: hero y-stability across 2 loops, comet ambient, matrix (~3032 tok)

## src/

- `App.tsx` — App — uses useEffect (~314 tok)
- `index.css` — Styles: 19 rules, 8 vars, 2 media queries, 5 animations (~1047 tok)
- `main.tsx` (~68 tok)

## src/components/

- `EarnSignature.tsx` — Chapter 4 — How we build. (~2078 tok)
- `Footer.tsx` — Footer (~112 tok)
- `HeroSignature.tsx` — Chapter 1 — The Mark. (~2168 tok)
- `Invitation.tsx` — Chapter 5 — The Invitation. (~716 tok)
- `Nav.tsx` — LINKS (~723 tok)
- `ProgressLine.tsx` — The journey line — a thin cyan rule down the page edge, drawn by scroll. (~297 tok)
- `SignatureLives.tsx` — Chapter 3 — Built and live. (~2222 tok)
- `SignatureMeaning.tsx` — Chapter 2 — What goes into the build. (~840 tok)
- `Triquetra.tsx` — Index of the loop that glows cyan — 0 top, 1 lower-right, 2 lower-left (~501 tok)

## src/components/worlds/

- `WorldCode.tsx` — Runtime braille renderer: rasterize the triquetra paths at cols×rows (~4479 tok)
- `WorldCreative.tsx` — Indices of ~target dots per loop, denser where curvature is higher. (~5363 tok)
- `WorldLogic.tsx` — final grid position (% of the fragments container) and width (~2483 tok)

## src/data/

- `triquetra.ts` — Triquetra loop paths traced from .brief/branding/Triquetra_Fill.png (~1056 tok)

## src/hooks/

- `useMagnetic.ts` — Magnetic hover: the element leans toward the cursor when it comes within (~731 tok)
- `usePrefersReducedMotion.ts` — Reactive prefers-reduced-motion flag. (~165 tok)

## src/lib/

- `flags.ts` — Feature flags from the environment (see .env / .env.example). (~40 tok)
- `scroll.ts` — Wire Lenis smooth scrolling into the GSAP ticker so ScrollTrigger and (~391 tok)
- `seal.ts` — The physical seal stamp: scale 1.6 → 1 with a -8deg → 0deg settle and an (~330 tok)
