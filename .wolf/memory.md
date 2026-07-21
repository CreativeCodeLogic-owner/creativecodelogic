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
| 17:21 | Session end: 37 writes across 14 files (.gitignore, CLAUDE.md, .gitattributes, WorldLogic.tsx, verify6.mjs) | 17 reads | ~42592 tok |
| 18:00 | Edited src/lib/flags.ts | 6→9 lines | ~127 |
| 18:00 | Created src/lib/submit.ts | — | ~326 |
| 18:00 | Created src/lib/captcha.ts | — | ~690 |
| 18:01 | Edited src/index.css | removed 6 lines | ~4 |
| 18:01 | Edited src/components/BriefForm.tsx | 8→6 lines | ~93 |
| 18:01 | Edited src/components/BriefForm.tsx | removed 18 lines | ~6 |
| 18:01 | Edited src/components/BriefForm.tsx | 6→7 lines | ~70 |
| 18:01 | Edited src/components/BriefForm.tsx | 9→5 lines | ~12 |
| 18:02 | Created src/components/HelloDrawer.tsx | — | ~2959 |
| 18:03 | Edited scripts/verify6.mjs | reduced (-13 lines) | ~42 |
| 18:03 | Edited scripts/verify6.mjs | added 1 condition(s) | ~674 |
| 18:07 | Edited src/components/HelloDrawer.tsx | added optional chaining | ~274 |
| 18:08 | Edited src/components/HelloDrawer.tsx | CSS: sentinel | ~125 |
| 18:08 | Edited src/components/HelloDrawer.tsx | CSS: sentinel | ~64 |
| 18:08 | Edited scripts/verify6.mjs | 6→8 lines | ~108 |
| 18:14 | Edited src/components/HelloDrawer.tsx | 6→11 lines | ~127 |
| 18:14 | Edited scripts/verify6.mjs | modified if() | ~41 |
| 16:10 | Contact restructure: 2 Formspark forms (BRIEF/CONTACT), brief drops captcha entirely, HelloDrawer gets VISIBLE reCAPTCHA v2 checkbox (dark), no emails in contact UI (removed Prefer-email + mailto error fallback → Try again). Deleted CaptchaNotice + badge CSS. Fixed focus trap across cross-origin iframe (sentinels) + hidden-focusable filter | flags.ts, .env.example, submit.ts, captcha.ts, BriefForm.tsx, HelloDrawer.tsx, index.css, verify6.mjs, deleted CaptchaNotice.tsx | build clean; verify6 3 passes 0 errors; brief noRecaptcha=true; drawer checkbox iframe renders, send gated by captcha, focus trap+esc+backdrop+focus-return all pass | ~14000 |
| 18:20 | Session end: 54 writes across 14 files (.gitignore, CLAUDE.md, .gitattributes, WorldLogic.tsx, verify6.mjs) | 17 reads | ~49730 tok |
| 18:35 | Edited src/lib/captcha.ts | onChange() → onToken() | ~318 |
| 18:35 | Edited src/components/HelloDrawer.tsx | 10→10 lines | ~115 |
| 18:35 | Edited src/components/HelloDrawer.tsx | added 1 condition(s) | ~214 |
| 18:35 | Edited src/components/HelloDrawer.tsx | 10→9 lines | ~95 |
| 18:38 | Edited src/components/HelloDrawer.tsx | inline fix | ~22 |
| 18:38 | Edited src/components/HelloDrawer.tsx | 3→8 lines | ~87 |
| 18:38 | Edited src/components/HelloDrawer.tsx | 6→6 lines | ~43 |
| 18:41 | Edited scripts/verify6.mjs | added optional chaining | ~139 |
| 18:46 | Edited src/components/HelloDrawer.tsx | 3→4 lines | ~52 |
| 18:46 | Edited src/components/HelloDrawer.tsx | 17→15 lines | ~159 |
| 16:50 | Two real-device bug fixes on contact drawer. Bug A: Send never enabled after captcha solve → token now driven into React state via widget callback (captcha.ts onToken), gate on captchaToken; +renderedRef guard for StrictMode double-render, +defensive error path. Bug B: nav blur lost after drawer close (class PRESENT → Chromium backdrop-filter compositing) → dropped drawer backdrop-blur (bg-navy/75) + rAF ScrollTrigger.update() on close | HelloDrawer.tsx, captcha.ts, verify6.mjs | build clean; verify6 3 passes 0 errors; navScrolledSurvivesCycle=true; sendGatedByCaptcha=true (solve path is manual — CI can't solve captcha) | ~6000 |
| 18:50 | Session end: 64 writes across 14 files (.gitignore, CLAUDE.md, .gitattributes, WorldLogic.tsx, verify6.mjs) | 19 reads | ~51775 tok |
| 19:02 | Edited src/components/Nav.tsx | 6→5 lines | ~72 |
| 19:02 | Edited src/components/Nav.tsx | CSS: scroll, onUpdate, onRefresh | ~254 |
| 19:03 | Edited scripts/verify6.mjs | added optional chaining | ~110 |
| 19:03 | Edited scripts/verify6.mjs | added optional chaining | ~138 |
| 17:15 | Fix nav .nav-scrolled dropping at page bottom: bounded ScrollTrigger toggleClass (start:40 end:max) deactivates past max → class stripped. Replaced with unbounded start:0 end:max + manual onUpdate/onRefresh toggle on self.scroll()>40, initial apply(window.scrollY), and removed reduced-motion early-return (scroll-state ≠ motion). verify6: nav-scrolled holds at absolute bottom in full + reduced passes | Nav.tsx, verify6.mjs | build clean; 3 passes 0 errors; navScrolledAtBottom true in FULL + REDUCED | ~2500 |
| 19:07 | Session end: 68 writes across 15 files (.gitignore, CLAUDE.md, .gitattributes, WorldLogic.tsx, verify6.mjs) | 19 reads | ~52836 tok |
| 20:01 | Created src/components/BriefForm.tsx | — | ~3847 |
| 20:02 | Edited src/components/Invitation.tsx | 2→2 lines | ~39 |
| 20:02 | Edited src/components/Invitation.tsx | 4→7 lines | ~114 |
| 20:02 | Edited src/components/Invitation.tsx | added optional chaining | ~318 |
| 20:02 | Edited src/components/Invitation.tsx | expanded (+6 lines) | ~88 |
| 20:03 | Edited scripts/verify6.mjs | added optional chaining | ~717 |
| 20:04 | Edited scripts/verify6.mjs | expanded (+19 lines) | ~295 |
| 20:14 | Edited src/components/Invitation.tsx | CSS: below | ~161 |
| 20:17 | Edited src/components/Invitation.tsx | CSS: closes | ~328 |
| 20:20 | Edited src/components/Invitation.tsx | CSS: visibility, opacity, opacity | ~128 |
| 18:15 | Brief flow close affordance + state preservation: lifted brief data (step+answers) to Invitation so it survives close/reopen; × close (data-brief-close, contextual "Done" on success) + scoped Esc; reset only on success. Fixed two bugs: (1) React reused the CTA/brief-wrap <div> node → brief invisible/unclickable → distinct keys; (2) autoAlpha CTA fade-in blocked focus → opacity | BriefForm.tsx, Invitation.tsx, verify6.mjs | build clean; verify6 3 passes 0 errors; close/reopen preserves step+chips+text+email, focus returns to CTA, footer unchanged, Esc scoped (outside=no close), reduced-motion instant swaps | ~9000 |
| 20:26 | Session end: 78 writes across 15 files (.gitignore, CLAUDE.md, .gitattributes, WorldLogic.tsx, verify6.mjs) | 21 reads | ~62723 tok |
| 20:44 | Created src/components/MobileMenu.tsx | — | ~1576 |
| 20:44 | Edited src/components/MobileMenu.tsx | 8→7 lines | ~87 |
| 20:44 | Edited src/components/Nav.tsx | modified Nav() | ~246 |
| 20:45 | Edited src/components/Nav.tsx | added optional chaining | ~733 |
| 20:45 | Edited src/components/HeroSignature.tsx | 14→14 lines | ~187 |
| 20:45 | Edited src/components/worlds/WorldCreative.tsx | expanded (+6 lines) | ~287 |
| 20:47 | Edited scripts/verify6.mjs | added 1 condition(s) | ~222 |
| 20:48 | Edited scripts/verify6.mjs | added 2 condition(s) | ~855 |
| 18:55 | Mobile menu + site-wide focus/touch polish: MobileMenu.tsx (full-screen overlay, sentinel focus-trap, Esc, scroll-lock, portal, opacity reveal) wired into Nav.tsx with a 44px hamburger (right of CTA pill); focus-visible rings on nav links/logo/CTAs/hero CTAs; palette swatches → 40px hit area w/ 16px dot | MobileMenu.tsx, Nav.tsx, HeroSignature.tsx, WorldCreative.tsx, verify6.mjs | build clean; verify6 3 passes 0 errors; menu dialog+focus+trap+esc+scroll-lock+nav-scroll+reduced all pass; hamburgerHiddenDesktop=true; paletteHit 40/dot 16 | ~10000 |
| 20:55 | Session end: 86 writes across 18 files (.gitignore, CLAUDE.md, .gitattributes, WorldLogic.tsx, verify6.mjs) | 25 reads | ~68954 tok |
| 21:17 | Edited src/components/worlds/WorldCreative.tsx | 8→11 lines | ~157 |
| 21:17 | Edited src/components/worlds/WorldCreative.tsx | 2 → 1 | ~25 |
| 21:17 | Edited src/components/worlds/WorldCreative.tsx | modified if() | ~411 |
| 21:18 | Edited scripts/verify6.mjs | added 2 condition(s) | ~283 |
| 19:05 | Fix palette clipping at 390px: 40px targets made the side-by-side row overflow the panel clip. Stack groups vertically below md (flex-col gap-3, max-w-[92vw]), keep side-by-side md+; tightened swatch gap-2→gap-1; layout() now measures real palette height (data-palette offsetHeight) for mark centering + --mobile-body-mt | WorldCreative.tsx, verify6.mjs | build clean; verify6 3 passes 0 errors; paletteInViewportMobile+paletteNoBodyOverlap true; desktop tighter single row; 40px hit/16px dot intact | ~3000 |
| 21:31 | Session end: 90 writes across 18 files (.gitignore, CLAUDE.md, .gitattributes, WorldLogic.tsx, verify6.mjs) | 26 reads | ~69953 tok |
| 21:37 | Edited src/components/worlds/WorldCode.tsx | expanded (+11 lines) | ~412 |
| 21:45 | Truthfulness pass on World Code terminal: measured real Lighthouse (perf 98, LCP 0.7s, a11y 96, BP 100, SEO 91) on preview :4173; rewrote BUILD_LOG (bun run build / vite 8.1.5 / 45 modules / type-check clean 0 errors / verification 3/3 viewports 0 errors / lighthouse performance 98) and METRICS (98 / 0.7s / 0), removed fake tests/lighthouse-audit/deployed lines; added provenance comment | WorldCode.tsx | build clean; verify6 3/3 0 errors (rare transient headless flake, not app error); terminal renders truthful log + metrics count-up | ~4000 |
| 22:03 | Session end: 91 writes across 19 files (.gitignore, CLAUDE.md, .gitattributes, WorldLogic.tsx, verify6.mjs) | 28 reads | ~74844 tok |
| 22:07 | Edited src/index.css | expanded (+25 lines) | ~210 |
| 22:08 | Edited index.html | 16→21 lines | ~205 |
| 22:08 | Edited scripts/verify6.mjs | added 1 condition(s) | ~278 |
| 22:11 | Edited index.html | expanded (+24 lines) | ~483 |
| 22:11 | Created public/robots.txt | — | ~20 |
| 22:11 | Created public/sitemap.xml | — | ~47 |
| 22:11 | Edited src/components/Nav.tsx | 2→2 lines | ~55 |
| 22:11 | Edited src/components/worlds/WorldCode.tsx | 3→3 lines | ~38 |
| 22:14 | Edited src/components/worlds/WorldCode.tsx | modified Results() | ~292 |
| 22:18 | Edited index.html | reduced (-24 lines) | ~205 |
| 22:18 | Edited index.html | expanded (+24 lines) | ~483 |
| 22:30 | Pre-launch: self-hosted fonts (variable woff2 in public/fonts/, @font-face weight ranges, preload Space Grotesk, dropped Google Fonts links) + SEO (canonical, og:url/site_name/absolute image, twitter card, JSON-LD Organization, robots.txt, sitemap.xml) + a11y (nav logo aria-label label-in-name, terminal header contrast mist/60→/80). Re-measured Lighthouse: perf 95 / LCP 0.6 / a11y 100 / BP 100 / SEO 100. Updated terminal to 95/0.6s | index.html, index.css, Nav.tsx, WorldCode.tsx, public/fonts/*, robots.txt, sitemap.xml, verify6.mjs | build clean; verify6 3/3 0 errors; noGoogleFonts true; families render | ~9000 |
| 22:19 | Session end: 102 writes across 22 files (.gitignore, CLAUDE.md, .gitattributes, WorldLogic.tsx, verify6.mjs) | 29 reads | ~78639 tok |
| 22:27 | Created README.md | — | ~1395 |
| 22:27 | Created CHANGELOG.md | — | ~701 |
| 22:28 | Created docs/architecture.md | — | ~1310 |
| 22:28 | Created docs/deployment.md | — | ~827 |
| 22:28 | Edited CLAUDE.md | 2→3 lines | ~56 |
| 22:55 | Docs pass: README.md, CHANGELOG.md (keepachangelog, [Unreleased]+[4.0.0]), docs/architecture.md, docs/deployment.md; +CLAUDE.md rule (every feat/fix updates CHANGELOG). Set local git user CreativeCodeLogic-owner/admin@creativecodelogic.com; prep first push to origin | README.md, CHANGELOG.md, docs/*, CLAUDE.md | ready to push origin main | ~5000 |
