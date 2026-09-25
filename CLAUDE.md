# OpenWolf

This project uses OpenWolf for context management. The always-on rules live in `.claude/rules/openwolf.md`; the hooks handle bookkeeping (anatomy index, memory log, read tracking) automatically.

For the full operating protocol (session handoff, memory discipline, bug logging), load the `openwolf` skill, or read `.wolf/OPENWOLF.md`. Regenerate the session handoff with `/handoff`.

# Project
CCL (Creative Code Logic) corporate website v4 — single-page scroll-driven
marketing site. React 19 + TypeScript strict, Vite 8, Tailwind CSS v4
(design tokens in @theme in src/index.css), GSAP 3 + ScrollTrigger, Lenis,
bun as package manager. Four-chapter scroll story around the triquetra mark
(Hero, the three worlds, How we build, Invitation), plus a Work chapter
behind VITE_SHOW_WORK.
AGENTS.md is deprecated — never follow it.

# Rules
- Import gsap/ScrollTrigger ONLY from src/lib/scroll.ts, never from the gsap package.
- Every animated component ships a working prefers-reduced-motion fallback rendering the final static state.
- GSAP animations live in useLayoutEffect inside gsap.context(..., rootRef), cleaned up with ctx.revert().
- data-* attributes are the animation selectors and verify-script targets — keep them stable.
- Hot paths (pointermove / per-frame) mutate the DOM directly; React state only for discrete UI state.
- Call ScrollTrigger.refresh() after layout-affecting changes.
- TS strict with noUnusedLocals/noUnusedParameters — build fails on unused vars.
- Styling = Tailwind utilities with theme tokens (text-ink, text-mist, bg-navy, text-accent, text-sand, font-display, font-body, font-mono); bespoke shared effects live in src/index.css. Fonts: Aptos (display + body), JetBrains Mono (mono) — all self-hosted.
- Copy voice: measured, intelligent, direct, humble-confident. No exclamation marks. Source of truth: copy/.
- Never touch .secrets/ or .env.
- Every feature/fix commit updates CHANGELOG.md under [Unreleased].

# Commands
- bun run dev (:5173) | bun run build (tsc --noEmit + vite build) | bun run preview
- Visual verification: node scripts/verify6.mjs against a running dev server on :5173 (latest pass; verify.mjs–verify5.mjs are older iterations). It must print VERIFY6: PASS and exit 0.
- Production builds fail unless VITE_FORMSPARK_FORM_ID_BRIEF, VITE_FORMSPARK_FORM_ID_CONTACT, VITE_CAPTCHA_SITEKEY and VITE_GA_MEASUREMENT_ID are set (vite.config.ts).
