# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims
to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Terminal metric label reads Lighthouse again; the build log line keeps the desktop qualifier.

## [4.2.2] - 2026-09-25

### Added
- Email signature assets under `public/email/` (served at `/email/`): per-mailbox avatars and noindex signature pages, not linked from the site and disallowed in robots.txt.

### Changed
- Production builds fail fast when a required form, captcha or analytics id is missing (`vite.config.ts` names the missing variables, never their values).
- `verify6` now reports `VERIFY6: PASS` or `VERIFY6: FAIL` against an explicit expectation map, sets a non-zero exit code on any failure or console error, fixes its stale footer test (`/terms`, `/privacy`), and accepts a `CHROME_PATH` override.
- Terminal and README quality bar synced to the live PageSpeed measurement (desktop 95, LCP 1.0s; mobile 75 now published in the README).

### Fixed
- Consent banner copy now matches Consent Mode v2 and the privacy policy: the tag library loads with the page, but nothing is set or recorded until the visitor agrees.
- The contact drawer shows its error state instead of silently dropping a message when its form id is not configured.
- The palette no longer overlaps the body copy on narrow phones (the mobile layout measured the heading mid-reveal, 36px off its resting position).
- The terminal module count matches the build (50).

## [4.2.1] - 2026-08-24

### Changed
- Progress line benched per team feedback — `<ProgressLine />` is unmounted in `App.tsx` (component file kept; revive by re-mounting). The left-edge scroll rule no longer ships.
- Header frieze benched per team feedback — `<NavFrieze />` is unmounted in `Nav.tsx` (component file and `friezeCompositions.ts` kept; revive by re-mounting). The scattered-triquetra frieze behind the nav no longer ships, and its WebP variants are no longer requested.
- Nav label "The Mark" → **CCL** wordmark. The `#signature` link now carries the old logo treatment (`font-display`, semibold, `tracking-[0.22em]`, ink, hover accent) to set it apart from the mist links, in both the desktop nav and the mobile menu; aria-label "CCL, Creative Code Logic, back to top". `verify6` frieze/progress-line assertions were converted to skip cleanly when those systems are absent.

## [4.2.0] - 2026-08-04

### Added
- Consent-first Google Analytics 4 via **Consent Mode v2**. The standard gtag snippet is hardcoded in `index.html` (measurement id interpolated by Vite from `VITE_GA_MEASUREMENT_ID`, so the repo stays value-free; the snippet self-guards and emits nothing when the id is absent — the dev default). `analytics_storage` (and the ad-storage signals) default to **denied**, so although `gtag.js` loads with the page it sets **no analytics cookies and records no visit** (`config` runs `send_page_view:false`, so not even a cookieless ping fires) until the visitor accepts. A small, non-modal bottom banner (`ConsentBanner`, brand-styled, `role="region"`, keyboard-reachable, page usable behind it) offers Accept / Decline / Privacy on first visit. Accept flips consent to granted and records the page view; Decline (or ignore) keeps it denied — no cookies, no `/g/collect`. The choice is stored locally and re-asked after 12 months. Returning accepters are granted inline before `config` (correct consent state before the tag processes), and the app records their page view on mount, so they're counted on **every** visit without seeing the banner — recorded exactly once per page load (guarded against StrictMode's double effect invoke). A "Privacy choices" link in the footer withdraws consent, clears any `_ga*` cookies, and re-summons the banner. `lib/consent.ts` holds the storage + the `gtag('consent', …)` grant/deny/clear helpers. The privacy policy's "Cookies and analytics" section states the nuance exactly: the tag library loads with the page, but cookies are set and the visit measured only after you accept.

### Changed
- Header frieze variants ship as pre-rasterized **WebP** (220px, quality 85; built from the `.svg` sources by `scripts/rasterize-frieze.mjs`) instead of the source SVGs — the two heavy variants dropped ~85% (dots-lines 59→7 KB, ascii 71→12 KB) and the complex-SVG render cost is gone. The frieze `<img>`s decode `async` at `fetchpriority="low"`. Reclaims the Lighthouse points the SVG frieze had cost.

## [4.1.0] - 2026-08-01

### Added
- Floating "back to top" control (`BackToTop.tsx`) — a circular pill fixed bottom-right (safe-area aware, smaller on phones) that fades in once past the first viewport, smooth-scrolls to the top (instant under reduced motion), and hides while the inline brief is open so it never overlaps the Send button; sits below the drawer/menu in the stacking order.
- Branded 404 page (`public/404.html`) — matches the legal-page styling (navy/Aptos, triquetra mark), carries `noindex`, and is served automatically by Firebase Hosting for any unmatched route.

### Changed
- Hero subline ("*Designed to solve. Built to perform.") now breathes with the final headline instead of revealing once and staying put — it fades in just behind "Built with Creative Code Logic*" at resolve and fades out just behind it at the replay boundary, staying hidden through the three rotating lines. Opacity-only (stays in flow, so the CTAs never shift); reduced motion shows it static.
- Header now carries a decorative **frieze of triquetra variants** (`NavFrieze`) instead of a single logo. Each load picks one of a set of **curated compositions** (`src/data/friezeCompositions.ts` — 5 desktop, 3 mobile, designer-tunable): one anchor (90–110px, bleeding past the 64px band, clipped by `overflow-hidden`) plus 3–4 satellites (36–64px), discrete rotations, and faint discrete opacities (0.03/0.05/0.08), spaced ≥12% apart. The styled variant SVGs (`src/assets/triquetra-variants/`, loaded via `import.meta.glob`) are shuffled and dealt onto the positions — no repeats within a composition, and the plain fill never lands on the anchor. Purely decorative: aria-hidden, pointer-events-none, below the nav content. The bar content is links + CTA (+ hamburger on mobile); scroll-to-top is owned by the floating back-to-top.
- Progress line: bolder taper (6px at the top down to 1px, matching cap) and raised above the header (z-55, still below the z-60 modals) so it draws over the nav's blurred bar at the left edge.
- Further scale tuning: the 03/Logic construction drawing scales to 0.68 (sheet furniture stays full-size), and the pinned worlds triquetra is ~20% smaller on desktop and hidden on mobile (the grid column collapses with no ghost gap).
- Invitation heading now splits to two lines and carries the accent-asterisk lockup ("Creative Code Logic\*?"), mirroring the hero.
- Typography: em dashes removed from all shipped copy — separators (title/og/twitter tags, the terminal header) became middots (·); in-sentence dashes became en dashes (–).
- Every visible "Creative Code Logic" mention now carries the accent asterisk (hero, footer, invitation, the Work-chapter mention, and the legal pages' body + footer lines); excludes titles/meta/JSON-LD, aria-labels, and the email-subject string.
- Reconciled the regenerated favicon set: `site.webmanifest` references only existing icons (Android Chrome 192/512) and is linked from `index.html`; heads keep svg + ico + 16/32/96 + apple-touch.
- Mark-scale polish: the hero triquetra and the 01/Creative canvas mark are ~20% smaller, and the 03/Logic construction drawing (mark + real circles + annotations) scales to 0.8 about the composition centre while the sheet furniture (grid, axes, ticks, registration marks) stays full-size — the drawing shrinks, the sheet doesn't.
- "How we build": the Ship step's ✦-in-circle seal is now a plain accent asterisk (`*`, font-display) that stamps in at the same timeline beat; its body copy ends "…it earns the mark\*" with the accent asterisk replacing the period, mirroring the hero lockup.
- World Code (chapter 02) matrix now assembles a hand-authored ASCII rendering of the mark (embedded in `src/data/triquetraAscii.ts`) instead of the runtime braille rasterizer — rendered in bold JetBrains Mono, accent, centered. The old `generateBrailleMark` rasterizer was removed.
- World Logic (chapter 03) blueprint now draws the designer's real construction circles (13, embedded in `src/data/triquetraBuild.ts`, aligned to the mark) instead of the old approximated centroid/radius guides. The sheet gained major engineering-paper gridlines, true centre axes with edge ticks, C1–C3 circle legends, R1–R3 radius leaders on the real circles, and a truthful "460 × 428" sheet-dimension label replacing the inaccurate "1:1".
- Redesigned triquetra mark — replaced the PNG-traced paths with a new authored vector (v2, 3 paths, non-square `460.66×428.07` viewBox) everywhere it appears: hero draw, worlds loop-glow, code-terminal braille, logic blueprint, ambient field, nav logo, and `favicon.svg`. Loop order preserves the index→meaning mapping (top→Creative, lower-right→Code, lower-left→Logic). Every hard-coded `512`/`256`/trace-bbox geometry assumption now derives from the viewBox (parsed `VB_W`/`VB_H`/`VB_CX`/`VB_CY`/`VB_MAX` and a runtime `sampleMarkBBox()`), so the mark is no longer assumed square.
- New brand accent `#53d2ff` replaces `#57d3fe` across the theme token, components, canvas/SVG fills, legal pages, and the 404 page.
- Aptos is now the site's primary typeface for both body and display text; the mono face (JetBrains Mono) is unchanged. Inter and Space Grotesk were removed.
- The ambient background field is now behind a `VITE_AMBIENT` flag and off by default — the page ships a solid navy background. The component and its verification are preserved for possible revival.
- Go-live cutover: the git remote and Firebase project both point at the live target (`creativecodelogic`); the beta repository and beta Firebase project were removed from all configuration.
- Refreshed the social-share image (`og.jpg`) to the current v4 hero, and added canonical tags to the Terms and Privacy pages.

### Fixed
- Say-hello drawer no longer crops on narrow mobile viewports: width is clamped to `min(420px, 100%)`, height uses `100dvh` with safe-area padding so the iOS toolbar never covers the Send button, and the reCAPTCHA renders in its compact size below ~360px so it always fits.
- Code terminal (chapter 02) no longer changes height between its build-log and matrix phases — the box is measured once after fonts load and locked to the taller of the two.

## [4.0.0] - 2026-07-22

First tracked release of v4 — the enhancement pass over the baseline snapshot,
shipped to Firebase Hosting at <https://creativecodelogic.com>.

### Added
- Ambient background field — a faint per-chapter triquetra texture behind the page, with a scroll crossfade, gentle parallax, and a flow-field distribution (Poisson spacing, coherent rotation); idle when the page is still and deferred to idle time so performance stays flat.
- Terms of Use and Privacy Policy pages (static `public/terms.html`, `public/privacy.html`), linked from the footer and added to the sitemap.
- Favicon set (`favicon.ico`, 16/32 px PNGs, `apple-touch-icon.png`, Android Chrome PNGs) tracked and wired into every page head.
- Firebase Hosting deployment — `firebase.json` (`cleanUrls`, long-cache immutable headers for `/fonts` and `/assets`, day-cache for root images) and `.firebaserc`.
- Inline three-question brief flow with a Formspark backend and mailto fallback.
- Say-hello drawer: slide-in contact panel with focus trap, scroll lock, and seal-stamp success.
- Split Formspark forms — a dedicated BRIEF and CONTACT form, tagged so the inbox can tell them apart.
- Visible reCAPTCHA v2 checkbox on the contact drawer, lazy-loaded on first open only.
- Brief-flow close affordance (×, Esc) that preserves entered answers across close and reopen.
- Full-screen mobile menu with a hamburger toggle, portal, focus trap, and scroll lock.
- Site-wide `focus-visible` rings and ≥40px touch targets (nav, hero CTAs, palette swatches).
- World Logic drafting details — plotter head, dimension/annotation layer, registration marks, per-loop lock pulses.
- Self-hosted variable fonts (Inter, JetBrains Mono, Space Grotesk); removed the Google Fonts runtime dependency.
- SEO/meta layer — canonical, Open Graph, Twitter card, JSON-LD Organization, `robots.txt`, and `sitemap.xml`.
- Project context: git baseline, `CLAUDE.md` as the convention authority, OpenWolf cerebrum seed.

### Changed
- Ambient field recomposed as a constellation — one large anchor mark (150–190px) plus small satellites (48–72px) per chapter, side emphasis alternating chapter to chapter so the crossfade swings the weight across the page; density trimmed (5 desktop / 3 mobile), every mark held ≥24px clear of the viewport edges (no cropping).
- Progress line restyled — glued to the left edge, capped ends, a scroll-riding tip, and a taper from ~3px to 1px.
- Process section: connector now draws across ~3x more scroll so each step registers; step 04 renamed "Mark" → "Ship".
- Footer type scaled down (`text-sm` → `text-[10px]`).
- Legal links and `sitemap.xml` switched to extensionless `/terms` and `/privacy` (served via Firebase `cleanUrls`; the `.html` paths 301-redirect).
- World Code terminal metrics re-measured against the live deploy — 46 modules, Lighthouse desktop performance 98, LCP 0.8s (was 45 / 95 / 0.6s from the local preview).
- World Logic reworked from UI-fragment assembly (fake data) to a scrubbed blueprint construction of the mark.
- Contact stack: no email addresses in the contact UI; the drawer error state offers a quiet retry instead.
- World Code terminal build log and metrics now show only real, measured values (Lighthouse, LCP, module count).
- Nav scrolled-state trigger made unbounded and applied under reduced motion (it is scroll-state styling, not motion).
- Accessibility polish: nav logo accessible name contains its visible label; terminal header contrast raised.

### Fixed
- Nav lost its scrolled background at the bottom of the page (an end-bounded ScrollTrigger deactivating past `max`).
- Contact Send button never enabled after solving the captcha (the token now drives React state via the widget callback).
- Nav backdrop-blur dropped after the drawer closed (removed an overlapping backdrop-filter layer — Chromium compositing).
- Brief opened invisible/unclickable after adding the close affordance (React reused the CTA DOM node — fixed with keys).
- Palette clipped at 390px (the 40px touch targets overflowed the panel — groups now stack on mobile).
