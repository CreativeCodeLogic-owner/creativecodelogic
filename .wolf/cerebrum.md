# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-09-25 (consolidated; superseded entries removed, architecture lives in docs/)

## User Preferences

- Git: stage explicit paths only and show `git diff --cached --stat` before every commit; never sweep unrelated changes in. Commit, push, tag and deploy only when the task grants it.
- Every commit also includes the hook-maintained `.wolf/anatomy.md`, `.wolf/anatomy-index.json` and `.wolf/memory.md` whenever they are modified (since 2026-09-25). Buglog auto-detect is off (`openwolf.buglog.auto_detect: false`); log real bugs by hand.
- Release commits are titled `release: X.Y.Z`; release tags are annotated.
- On a stated stop condition (for example machine-specific values), stop and report with options before committing.
- Reports: facts over prose, file:line citations, tables for verification.
- Docs and copy: no em dashes, no exclamation marks; only facts verified in code or config.

## Key Learnings

- **Project:** ccl-website. AGENTS.md is deprecated (2026-07-21); CLAUDE.md + .wolf/ are the authority.
- Architecture, consent flow, forms and release process are documented in `docs/architecture.md` and `docs/deployment.md`; read those instead of re-deriving.
- `src/data/triquetra.ts` holds the authored v2 mark (source `.brief/branding/triquetra-v2.svg`). The old PNG trace pipeline (`scripts/extract_triquetra.py`) is obsolete for v2.
- GA4 = Consent Mode v2. gtag.js always loads; `analytics_storage` defaults to denied; `config` has `send_page_view:false`. The APP owns page_view (`recordPageView()`, once-guarded per load, called on mount for a stored accept and on Accept); index.html never fires one. Correct pre-consent test = 0 `/g/collect` + 0 `_ga*` cookies, not "0 Google requests".
- Testing GA4 hits: never assert exact `/g/collect` counts in a fixed window (hits are batched/delayed 3-5s). Filter `en=page_view` and poll for the cumulative total.
- Terminal (WorldCode.tsx) and README numbers come only from LIVE measurements (PageSpeed Insights on https://creativecodelogic.com), never local preview. Terminal shows desktop; README shows desktop + mobile.
- Inline links in body text need a persistent underline (Lighthouse `link-in-text-block`).
- verify6: CHROME_PATH override (default hard-coded Chrome path); aggregate gate compares every boolean against the `EXPECTED` map, prints `VERIFY6: PASS|FAIL`, exits 1 on failure or console error. Adding/renaming/reviving a check means adding its key to `EXPECTED`. Benched systems report `skipped:true`.
- Production builds are guarded (vite.config.ts): build throws, naming missing vars, if VITE_FORMSPARK_FORM_ID_BRIEF/_CONTACT, VITE_CAPTCHA_SITEKEY or VITE_GA_MEASUREMENT_ID is empty. process.env beats .env. On Windows test with Git Bash `VAR= bun run build`; PowerShell `$env:VAR = ""` deletes the var.
- Contact drawer: empty form id returns "error" (retry state), never fake success. Brief keeps its mailto fallback. Captcha is the VISIBLE v2 checkbox (contact only); the single VITE_FORMSPARK_FORM_ID and the invisible captcha are gone.
- Fonts: Aptos (display + body) and JetBrains Mono, self-hosted. Inter and Space Grotesk are gone.
- Cloudflare fronts creativecodelogic.com; .web.app is the Firebase origin. Cloudflare Email Obfuscation rewrites mailto links unless the "Email Signatures Folder" rule (/email/) stays. Compare .com vs .web.app when served HTML differs from dist.
- OpenWolf hooks: settings.json must use `$CLAUDE_PROJECT_DIR/.wolf/hooks/...` (portable; verified firing in a fresh headless session). All hook modules are tracked; only `hooks/_*.json` and `hooks/sessions/` are ignored. Buglog auto-logging is `openwolf.buglog.auto_detect` (off since 2026-09-25).

## Do-Not-Repeat

<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->
- [2026-09-25] Never position in-flow content from `getBoundingClientRect()` of an element that may be mid-GSAP-tween (`gsap.from(..., {y:36})` at mount). In-flow siblings follow the untransformed box, so the WorldCreative palette overlapped the body copy by 4px. Use the layout box (`offsetTop` + `offsetHeight`).
- [2026-09-25] A verification script that only prints results can't fail: verify6 printed false assertions for weeks while exiting 0. Every check needs an explicit expected value and a non-zero exit on mismatch.
- [2026-09-25] Stopping `bun run dev` via the background-task stop can orphan `node vite.js` on :5173; the next dev server silently moves to :5174 and verify tests the stale one. After a restart, check `Get-NetTCPConnection -LocalPort 5173,5174 -State Listen` and kill leftover vite PIDs.
- [2026-08-24] Before trusting a post-deploy live Lighthouse number, check TTFB (`curl -w "tls=%{time_appconnect}s ttfb=%{time_starttransfer}s"`). A degraded network path (~2.8s TLS, ~3.5s TTFB) produces noisy scores that look like regressions; don't sync numbers from such a run.
- [2026-08-04] `git push --follow-tags` only pushes ANNOTATED tags. Always `git tag -a vX.Y.Z -m "…"`, then verify with `git ls-remote --tags origin vX.Y.Z`.
- [2026-07-22] Canvas marks placed exactly at a clearance boundary fail `>=` checks by float epsilon. Add ~2px PAD (bug-067).
- [2026-07-22] Verify canvas VISIBILITY by pixel readback (`getImageData`, count alpha>0), not DOM state; AmbientField once passed every DOM check while hidden.
- [2026-07-22] If html has a background, body's background no longer propagates to the canvas and covers z-[-N] layers. Keep the page background on html only (bug-019).
- [2026-07-21] Don't reveal with gsap `autoAlpha` (visibility:hidden) when you must `focus()` inside in the same tick; focus silently no-ops. Use `opacity`, or focus in onComplete.
- [2026-07-21] A keydown Tab trap can't contain focus across a cross-origin iframe (reCAPTCHA). Use focus SENTINELS (`tabIndex={0}` guards first/last that bounce focus). Esc won't fire inside the frame (acceptable).
- [2026-07-21] When computing a trap's first/last focusable, skip hidden (`offsetParent === null`) and `tabIndex === -1` elements (reCAPTCHA's hidden textarea, honeypots).
- [2026-07-21] `grecaptcha.render()` throws "already rendered" under StrictMode double effects: guard with a `renderedRef`, don't let its `.catch` set error state. Drive the submit gate from the widget `callback` state, never by polling `getResponse()`.
- [2026-07-21] Don't stack two `backdrop-filter` layers: unmounting the top one drops the lower blur in Chromium until repaint. The drawer backdrop is plain `bg-navy/75`. ST+Lenis desync after programmatic `scrollIntoView` in the harness is not a product bug.
- [2026-07-21] Same-position `{cond ? <div> : <div>}` branches reuse the DOM node, carrying gsap inline styles across. Give branches distinct `key`s. Tell: rect exists but `elementFromPoint` hits an ancestor; synthetic clicks work, real ones don't.
- [2026-07-21] Never give an always-on scroll-STATE trigger an upper bound: `toggleClass` with `end:"max"` strips the class at the bottom. Use unbounded `start:0 end:"max"` with manual onUpdate/onRefresh toggles, set initial state on mount, and don't gate scroll-state styling behind reduced motion (bug-016).

## Decision Log

- [2026-07-21] All three worlds resolve into the mark: 01 comet draws it, 02 terminal matrix assembles it (authored ASCII), 03 blueprint constructs it (real construction circles, scrub-reversible, draggable loops). No personal data or fake UI inside the visuals.
- [2026-07-21] Terminal shows only real measured values ("judge it now"); never fabricate build/perf claims.
- [2026-07-21] Inline brief keeps a reserved swap-box height so the footer never shifts across closed/open/success (closed page is deliberately taller).
- [2026-07-21] Contact stack: two Formspark forms (BRIEF without captcha, CONTACT with visible v2 checkbox); no email addresses in the contact UI. Overlays (drawer, mobile menu) portal to body at z-[60] with sentinel traps and scroll lock; the menu's close control lives inside the dialog.
- [2026-07-21] Canonical origin is non-www https://creativecodelogic.com; SEO meta and JSON-LD carry only real data.
- [2026-08-24] ProgressLine and NavFrieze benched per team feedback (kept for revival); nav link "CCL" is the wordmark.
- [2026-09-25] Mobile performance is the next phase (PSI mobile 75); see .wolf/STATUS.md.
