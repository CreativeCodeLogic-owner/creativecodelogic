# Memory

> Chronological action log. Hooks and AI append to this file automatically.
> Old sessions are consolidated by the daemon weekly.

## Session: 2026-07-21 13:54

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 13:56 | Edited .gitignore | expanded (+8 lines) | ~55 |
| 13:56 | Edited CLAUDE.md | expanded (+23 lines) | ~466 |
| 13:57 | Edited CLAUDE.md | removed 24 lines | ~52 |
| 13:58 | Edited CLAUDE.md | expanded (+23 lines) | ~466 |
| 14:00 | Foundation pass: git init + baseline commit (14ad7d9), CLAUDE.md authority + cerebrum seed commit (1c773b1) | .gitignore, CLAUDE.md, .wolf/cerebrum.md | build passed clean; sensitive paths (.env/.secrets/runtime json) confirmed gitignored | ~200 |
| 13:59 | Session end: 4 writes across 2 files (.gitignore, CLAUDE.md) | 2 reads | ~1169 tok |
| 14:08 | Created .gitattributes | — | ~4 |
| 14:08 | Edited .gitignore | 3→4 lines | ~27 |
| 14:15 | Created src/components/worlds/WorldLogic.tsx | — | ~3195 |
| 14:15 | Edited scripts/verify6.mjs | added 1 condition(s) | ~452 |
| 14:20 | Task A hygiene: .gitattributes (* text=auto) + renormalize + ignore hook _session.json; commit 343f6d3 | .gitattributes, .gitignore | LF/CRLF noise gone, tree clean | ~120 |
| 14:22 | Task B: reworked World Logic (03) → blueprint construction of the mark; added Logic coverage to verify6 | WorldLogic.tsx, verify6.mjs | build clean; verify6 full+reduced+mobile pass, 0 console errors; guides=5/loops=3/ticks=12/fragments=0; stage box 420/380 unchanged | ~4100 |
| 14:21 | Session end: 8 writes across 5 files (.gitignore, CLAUDE.md, .gitattributes, WorldLogic.tsx, verify6.mjs) | 8 reads | ~20031 tok |
| 14:29 | Created src/components/worlds/WorldLogic.tsx | — | ~5356 |
| 14:29 | Edited src/components/worlds/WorldLogic.tsx | 3→1 lines | ~8 |
| 14:29 | Edited scripts/verify6.mjs | 14→18 lines | ~261 |
| 14:35 | World Logic drafting-detail pass: plotter head, dimension/annotation layer, registration marks, per-loop lock pulses; extended verify6 3b | WorldLogic.tsx, verify6.mjs | build clean; verify6 full+reduced+mobile pass, 0 console errors; plotter=1/dims=16/regmarks=4/120°=true; scrollHeight 4431 unchanged | ~5600 |
| 14:33 | Session end: 11 writes across 5 files (.gitignore, CLAUDE.md, .gitattributes, WorldLogic.tsx, verify6.mjs) | 8 reads | ~25674 tok |
| 14:38 | Edited src/components/worlds/WorldLogic.tsx | 12→15 lines | ~186 |
| 14:41 | Edited src/components/worlds/WorldLogic.tsx | CSS: g | ~116 |
| 14:42 | Edited src/components/worlds/WorldLogic.tsx | 10→11 lines | ~106 |
| 14:45 | Polish: World Logic annotation spacing — R labels ride radially outward from composition centre (fixes R2/R3 overlap), 120° pushed clear, vertical dim line drops its "1:1" (keeps ticks), deleted stray shot | WorldLogic.tsx | build clean; verify6 3 passes, 0 errors; dims 16→15; screenshot confirms no label/stroke overlap | ~250 |
| 14:45 | Session end: 14 writes across 5 files (.gitignore, CLAUDE.md, .gitattributes, WorldLogic.tsx, verify6.mjs) | 9 reads | ~28999 tok |
| 15:08 | Edited src/lib/flags.ts | added nullish coalescing | ~118 |
| 15:09 | Created src/components/BriefForm.tsx | — | ~3367 |
| 15:10 | Created src/components/Invitation.tsx | — | ~1036 |
| 15:12 | Edited src/components/BriefForm.tsx | CSS: visibility, opacity, opacity | ~98 |
| 15:12 | Edited src/components/Invitation.tsx | "mt-10 flex w-full min-h-[" → "mt-10 flex w-full min-h-[" | ~28 |
| 15:14 | Edited scripts/verify6.mjs | added optional chaining | ~681 |
| 14:55 | Built inline 3-question brief flow: BriefForm.tsx (Formspark POST + mailto fallback, honeypot, a11y, reduced-motion), wired into Invitation.tsx with a fixed-height swap box; added flags.FORMSPARK_FORM_ID + .env.example line; verify6 section 6 | BriefForm.tsx, Invitation.tsx, flags.ts, .env.example, verify6.mjs | build clean; verify6 3 passes 0 errors; footShift=0 open/steps, focus 1/2/3 land, submit gated until valid; fixed autoAlpha→opacity focus bug | ~9000 |
| 15:18 | Session end: 20 writes across 8 files (.gitignore, CLAUDE.md, .gitattributes, WorldLogic.tsx, verify6.mjs) | 15 reads | ~35954 tok |
| 16:36 | Edited src/lib/flags.ts | expanded (+7 lines) | ~97 |
| 16:36 | Edited src/lib/scroll.ts | added optional chaining | ~101 |
| 16:36 | Edited src/index.css | CSS: visibility | ~38 |
| 16:37 | Created src/lib/captcha.ts | — | ~709 |
| 16:37 | Created src/lib/submit.ts | — | ~394 |
| 16:37 | Created src/components/CaptchaNotice.tsx | — | ~244 |
| 16:37 | Edited src/components/BriefForm.tsx | added 3 import(s) | ~134 |
| 16:38 | Edited src/components/BriefForm.tsx | added 2 condition(s) | ~205 |
| 16:38 | Edited src/components/BriefForm.tsx | CSS: form, _gotcha | ~96 |
| 16:38 | Edited src/components/BriefForm.tsx | 7→11 lines | ~72 |
| 16:39 | Created src/components/HelloDrawer.tsx | — | ~2874 |
| 16:39 | Edited src/components/Invitation.tsx | added 2 import(s) | ~111 |
| 16:39 | Edited src/components/Invitation.tsx | 2→4 lines | ~59 |
| 16:39 | Edited src/components/Invitation.tsx | added optional chaining | ~183 |
| 16:41 | Edited scripts/verify6.mjs | added 1 condition(s) | ~124 |
| 16:41 | Edited scripts/verify6.mjs | added 1 condition(s) | ~258 |
| 16:41 | Edited scripts/verify6.mjs | added optional chaining | ~486 |
| 15:20 | Invisible reCAPTCHA v2 + say-hello drawer: captcha.ts (lazy-load, invisible widget) + submit.ts (shared Formspark path w/ token) + CaptchaNotice; HelloDrawer.tsx (portal, focus-trap, Esc/backdrop, scroll-lock); BriefForm tagged form:"brief"; scroll.ts stop/startScroll; verify6 sec 6+7 | captcha.ts, submit.ts, CaptchaNotice.tsx, HelloDrawer.tsx, BriefForm.tsx, Invitation.tsx, flags.ts, scroll.ts, index.css, .env.example, verify6.mjs | build clean; verify6 3 passes 0 errors; lazy-load proven (recaptchaBeforeOpen=false/After=true), drawer dialog+focus-trap+esc+backdrop+focus-return all pass; reduced-motion drawer smoke clean | ~12000 |
| 16:46 | Session end: 37 writes across 14 files (.gitignore, CLAUDE.md, .gitattributes, WorldLogic.tsx, verify6.mjs) | 17 reads | ~42592 tok |
| 15:40 | Debugged Formspark 500 (form RBavvWpyd) via curl probes | .wolf/buglog.json (bug-013) | ROOT CAUSE = dashboard-side: every submit rejected as spam (header formspark-status: spam), incl. minimal token-less body + matching Origin → reCAPTCHA secret missing/mismatched with VITE_CAPTCHA_SITEKEY. No code change (payload correct). | ~600 |
