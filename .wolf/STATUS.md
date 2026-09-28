---
description: session handoff, regenerate with /handoff when a quest finishes
budget_tokens: 1000
---
# STATUS: ccl-website

> Single source of truth for resuming work. Read this FIRST when starting a session.
> Last updated: 2026-09-28

---

## Done

- 2026-09-25: `/email/` signature assets, fix round, `v4.2.2` PSI sync, OpenWolf housekeeping, perf (`74b1a7d`: font preloads, deferred gtag.js, Tailwind scoping; local lab Perf 58 → 67), deep links (`30e4aba`). Dropped: React.lazy splitting (TBT worse), inlined CSS (no FCP gain).
- 2026-09-28, all deployed:
  - `3b8c7c5` "How we build" = the client process (Listen, Think, Build, Ship, Care) under the pillars Designed to Solve / Built to Last; md+ pins the whole chapter as one frame (strip fallback on short viewports, unpinned scrub below md); Ship seal = signature at ship; Care pulse while on screen. Slogan "Designed to Solve. Built to Last." everywhere (hero, footer, Terms/Privacy footers). Brand system in CLAUDE.md, copy/, cerebrum.
  - `72794e2` back-to-top lifts clear of the footer.
  - `cdd3fcc` OpenWolf `init`/`update` rewrite settings.json to absolute paths: committed file stays portable, local copy is skip-worktree (see docs/deployment.md).
  - `b9a6ab9` triquetra path samples precomputed (`bun run gen:triquetra` → `src/data/triquetraSamples.ts`, 5 decimals; prod build fails if stale). No path sampling at load (live: 0 getPointAtLength / 0 detached getTotalLength). Local lab Perf 67 → 85, TBT 1147 → 343ms.
  - `79e2256` nav scroll-state trigger created after first paint (TBT median 343 → 321ms).

### Open items
- The email signature source (`signatures/v2/hosted/email/*.html`) still says "Built to Perform"; `public/email/` is unchanged until it's updated.
- verify6 `hello.tabStaysInside` / `shiftTabStaysInside` flake intermittently (12 rapid Tabs race the reCAPTCHA iframe's focus bounce); pacing the Tabs would harden it.
- Mid-page reload restores scroll only sometimes on live (the browser restores before the client render has height); the nav state always matches the real position.

---

## Next phase: live numbers → release 4.3.0

**Goal:** lift PSI mobile (75 · LCP 4.3s · FCP 3.3s on the last live run) without touching desktop (95) or the 100s. Unreleased changes since v4.2.2 are live but untagged.

1. **Ghassan runs PageSpeed Insights** (desktop + mobile) on https://creativecodelogic.com.
2. Sync the terminal (desktop) + README quality bar (desktop + mobile) with those numbers, then release 4.3.0 (release checklist in `docs/deployment.md`).
3. **Optional, decided after the live numbers:** static hero shell with a pre-painted consent banner (option B): final-state hero + banner markup in `index.html`, an inline pre-paint script shows the banner only without a stored `ccl-consent`, React `createRoot` replaces it; guard shell/React drift with a verify6 check. The banner text is the mobile LCP element on a first visit.

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
