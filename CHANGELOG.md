# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims
to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Aptos is now the site's primary typeface for both body and display text; the mono face (JetBrains Mono) is unchanged. Inter and Space Grotesk were removed.
- The ambient background field is now behind a `VITE_AMBIENT` flag and off by default — the page ships a solid navy background. The component and its verification are preserved for possible revival.

### Fixed
- Say-hello drawer no longer crops on narrow mobile viewports: width is clamped to `min(420px, 100%)`, height uses `100dvh` with safe-area padding so the iOS toolbar never covers the Send button, and the reCAPTCHA renders in its compact size below ~360px so it always fits.
- Code terminal (chapter 02) no longer changes height between its build-log and matrix phases — the box is measured once after fonts load and locked to the taller of the two.

## [4.0.0] - 2026-07-22

First tracked release of v4 — the enhancement pass over the baseline snapshot,
shipped to Firebase Hosting at <https://beta-creativecodelogic.web.app>.

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
