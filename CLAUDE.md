# OpenWolf

@.wolf/OPENWOLF.md

This project uses OpenWolf for context management. Read and follow .wolf/OPENWOLF.md every session. Check .wolf/cerebrum.md before generating code. Check .wolf/anatomy.md before reading files.

# Project
CCL (Creative Code Logic) corporate website v4 — single-page scroll-driven
marketing site. React 19 + TypeScript strict, Vite 8, Tailwind CSS v4
(design tokens in @theme in src/index.css), GSAP 3 + ScrollTrigger, Lenis,
bun as package manager. Five-chapter scroll story around the triquetra mark.
AGENTS.md is deprecated — never follow it.

# Rules
- Import gsap/ScrollTrigger ONLY from src/lib/scroll.ts, never from the gsap package.
- Every animated component ships a working prefers-reduced-motion fallback rendering the final static state.
- GSAP animations live in useLayoutEffect inside gsap.context(..., rootRef), cleaned up with ctx.revert().
- data-* attributes are the animation selectors and verify-script targets — keep them stable.
- Hot paths (pointermove / per-frame) mutate the DOM directly; React state only for discrete UI state.
- Call ScrollTrigger.refresh() after layout-affecting changes.
- TS strict with noUnusedLocals/noUnusedParameters — build fails on unused vars.
- Styling = Tailwind utilities with theme tokens (text-ink, text-mist, bg-navy, text-accent, text-sand, font-display, font-mono); bespoke shared effects live in src/index.css.
- Copy voice: measured, intelligent, direct, humble-confident. No exclamation marks. Source of truth: copy/.
- Never touch .secrets/ or .env.
- Every feature/fix commit updates CHANGELOG.md under [Unreleased].

# Commands
- bun run dev (:5173) | bun run build (tsc --noEmit + vite build) | bun run preview
- Visual verification: node scripts/verify6.mjs against a running dev server (latest pass; verify.mjs–verify5.mjs are older iterations).
