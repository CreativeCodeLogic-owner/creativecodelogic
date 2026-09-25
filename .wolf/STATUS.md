---
description: session handoff, regenerate with /handoff when a quest finishes
budget_tokens: 1000
---
# STATUS: ccl-website

> Single source of truth for resuming work. Read this FIRST when starting a session.
> Last updated: 2026-09-25

---

## Done (2026-09-25)

- `f657a9e` email signature assets under `public/email/` (avatars + noindex pages), `Disallow: /email/` in robots.txt. Deployed.
- `56b35a1` fix round: truthful consent copy (Consent Mode v2), contact drawer returns an error instead of silently dropping a message, production build guard for the 4 required env ids, mobile palette gap (layout box instead of mid-reveal rect), terminal module count 50, verify6 PASS/FAIL gate with exit code + `CHROME_PATH`. Deployed.
- `dfcef74` / tag `v4.2.2`: live PageSpeed sync (desktop 95 in the terminal, desktop + mobile rows in the README). Deployed.
- Cloudflare Configuration Rule "Email Signatures Folder" turns Email Obfuscation off for `/email/`.
- Housekeeping: OpenWolf upgrade committed with portable hook paths and all hook modules tracked; generated agent configs ignored; docs and `.wolf/` synced.
- Terminal metric label restored to "Lighthouse" (log line keeps "lighthouse desktop 95"): committed, **not yet deployed**.

---

## Next phase: mobile performance

**Goal:** lift PSI mobile performance from 75 (LCP 4.3s, FCP 3.3s; emulated Moto G Power, slow 4G) without touching desktop (95) or the 100s.

PSI mobile opportunities (2026-09-25 run):
- Render-blocking CSS, ~600ms estimated saving.
- Late font chain: CSS → Aptos woff2, with no preload on that path.
- JetBrains Mono loads eagerly although it is only used below the fold (terminal).
- ~100ms of forced reflow.
- On a first visit the LCP element is the **consent banner text**, not the hero.

### Acceptance criteria
1. PSI mobile performance measurably above 75 on https://creativecodelogic.com, with desktop still ≥ 95 and accessibility / best practices / SEO at 100.
2. `VERIFY6: PASS`, zero console errors, no CLS regression.
3. Terminal + README quality bar re-synced from the live PSI run.

### Also next
- Deploy the terminal label fix (next release or with the mobile work).

### Open decisions
- Whether the consent banner should render later or smaller so it stops being the mobile LCP element (copy must stay accurate).

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
