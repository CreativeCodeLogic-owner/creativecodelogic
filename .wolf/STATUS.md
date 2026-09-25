---
description: session handoff, regenerate with /handoff when a quest finishes
budget_tokens: 1000
---
# STATUS: ccl-website

> Single source of truth for resuming work. Read this FIRST when starting a session.
> Last updated: 2026-09-25

---

## Done (2026-09-25)

- `f657a9e` `/email/` signature assets (robots Disallow); Cloudflare rule "Email Signatures Folder" keeps mailto links intact.
- `56b35a1` fix round (consent copy, contact-form guard, build guard, palette gap, verify6 gate) and `dfcef74` / `v4.2.2` live PSI sync.
- Housekeeping: OpenWolf upgrade (portable hooks, all modules tracked), docs + `.wolf/` synced, buglog auto-detect off.
- `3862c41` terminal metric label restored to "Lighthouse" (log line keeps "lighthouse desktop 95"). Deployed.
- `74b1a7d` perf: Aptos Regular + Bold preloaded, gtag.js injected after the load event (consent unchanged; live: load 772ms, gtag start 1469ms), Tailwind scanning scoped to `src/` + `index.html`, privacy wording updated. Local mobile lab (guidance only): Perf 58 → 67, LCP 4.41s → 3.37s. Deployed.
- `30e4aba` deep links `/#process` and `/#contact` land on their sections on load (verify6 deepLinks checks). Deployed.
- Tried and dropped: React.lazy code-splitting of below-fold chapters (TBT worse), inlined CSS (no FCP gain; FCP is JS-bound).

---

## Next phase: mobile performance, part 2 → release 4.3.0

**Goal:** lift PSI mobile (75 · LCP 4.3s · FCP 3.3s on the last live run) without touching desktop (95) or the 100s. Unreleased changes since v4.2.2 are live but untagged.

1. **Precompute the triquetra path samples.** The CPU profile (4x throttle) puts ~3s of main thread in SVG `getPointAtLength()` sampling at mount: `WorldCreative.tsx:107` (~2.1s), `WorldLogic.tsx:47` (~0.9s), plus `sampleMarkBBox()` in `src/data/triquetra.ts`. The geometry is constant: precompute at build time (or one shared plain-JS sampler), keep the output pixel-identical.
2. **Static hero shell with a pre-painted consent banner (option B).** Hand-written final-state hero + banner markup in `index.html`, shown before JS; an inline pre-paint script shows the banner only without a stored `ccl-consent`. React `createRoot` replaces it (no hydration). Guard shell/React geometry drift with a verify6 check. The banner text is the mobile LCP element on a first visit.
3. Then: PageSpeed Insights (desktop + mobile) on https://creativecodelogic.com, sync terminal + README, release 4.3.0 (see the release checklist in `docs/deployment.md`).

### Acceptance criteria
1. PSI mobile performance measurably above 75, desktop still ≥ 95, accessibility / best practices / SEO at 100.
2. `VERIFY6: PASS`, zero console errors, no CLS regression, reduced-motion screenshots pixel-identical.
3. Terminal + README quality bar re-synced from the live PSI run.

---

## Active architecture

- **Stack:** React 19 + TS strict, Vite 8, Tailwind v4, GSAP 3 + ScrollTrigger (only via `src/lib/scroll.ts`), Lenis, bun. Firebase Hosting behind Cloudflare.
- **Chapters:** Hero, three worlds (Creative / Code / Logic), How we build, Invitation; Work behind `VITE_SHOW_WORK`. Benched: AmbientField, ProgressLine, NavFrieze.
- **Patterns:** reduced-motion final states, `data-*` selectors shared with verify6, Consent Mode v2 (page_view owned by the app), explicit verify6 `EXPECTED` map.

---

## External blockers (don't block coding)

- `www.creativecodelogic.com` has no DNS record yet.
- Keep the Cloudflare `/email/` rule; never enable Hotlink Protection without exempting `/email/`.

---

## Useful commands

```bash
bun run dev                     # :5173 (single listener; verify6 is hard-wired to it)
bun run build                   # tsc + vite build; fails without the 4 required env ids
node scripts/verify6.mjs        # must end with VERIFY6: PASS, exit 0
firebase deploy --only hosting  # project creativecodelogic
curl -s https://creativecodelogic.com/email/admin | grep -c email-protection   # expect 0
```

---

## References (read IF needed)

- `.wolf/cerebrum.md`: preferences, Do-Not-Repeat, decision log
- `docs/deployment.md`: hosting, Cloudflare, env, release checklist
- `.wolf/buglog.json`: known bugs + fixes
