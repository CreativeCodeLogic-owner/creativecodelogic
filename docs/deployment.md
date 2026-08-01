# Deployment

## Build

```bash
bun install
bun run build        # tsc --noEmit + vite build → dist/
bun run preview      # serve dist/ on :4173 to sanity-check the production build
```

Deploy the contents of `dist/` as static files. `public/` (fonts, `og.jpg`, the
favicon set, `site.webmanifest`, `robots.txt`, `sitemap.xml`, and the static
`404.html` / `terms.html` / `privacy.html`) is copied to the root of `dist/`.

## Hosting (Firebase)

- **Project:** `creativecodelogic` (set in `.firebaserc`).
- **Live URL:** <https://creativecodelogic.web.app> (mirror:
  `creativecodelogic.firebaseapp.com`). The intended production domain is
  `https://creativecodelogic.com` (custom-domain step below).
- **Git remote:** `git@github.com:CreativeCodeLogic-owner/creativecodelogic.git`
  (SSH; tokens never go in the remote/config).
- **Config:** `firebase.json` — `hosting.public: dist`, `cleanUrls: true` (so
  `/terms` and `/privacy` serve extensionless; `.html` 301-redirects), long-cache
  immutable headers on `/fonts` and `/assets`, day-cache on root images. Firebase
  serves `dist/404.html` for unmatched routes automatically.

```bash
firebase deploy --only hosting        # uses .firebaserc default project
```

### Custom domain

Connect `creativecodelogic.com` in the Firebase console (Hosting → Add custom
domain), then follow the DNS records it issues. Until it's live, the site is
reachable at the `.web.app` URL. Keep the canonical-origin choice (below) and the
reCAPTCHA domain list in sync with whichever host is live.

## Environment variables

Set these in the host's environment (or a production `.env`). Names only — real
values never live in the repo. See `.env.example`.

| Variable | Purpose |
| --- | --- |
| `VITE_SHOW_WORK` | `true` renders the Work chapter. |
| `VITE_FORMSPARK_FORM_ID_BRIEF` | Formspark form id for the brief flow. |
| `VITE_FORMSPARK_FORM_ID_CONTACT` | Formspark form id for the contact drawer. |
| `VITE_CAPTCHA_SITEKEY` | reCAPTCHA v2 checkbox **site** key (contact drawer). |

These are build-time (`VITE_*`) — rebuild after changing them.

## Formspark dashboard

Two forms back the site; configure each:

- **CONTACT form** (`VITE_FORMSPARK_FORM_ID_CONTACT`): enable reCAPTCHA and set
  the reCAPTCHA **secret** that pairs with `VITE_CAPTCHA_SITEKEY`. Both must be
  the **same reCAPTCHA v2 "Invisible"/"Checkbox" pair** — this project renders a
  visible **checkbox**, so use a v2 Checkbox key pair. Enable the honeypot
  (`_gotcha`).
- **BRIEF form** (`VITE_FORMSPARK_FORM_ID_BRIEF`): reCAPTCHA **disabled** (the
  brief sends no token). Honeypot (`_gotcha`) can stay on.
- Optionally route/filter the shared inbox by the `form` field (`brief` vs
  `hello`).

> A misconfigured captcha secret makes Formspark reject every submission as spam
> with HTTP 500 (`formspark-status: spam`) — including token-less ones. If real
> submissions 500, check the CONTACT form's captcha secret first.

## reCAPTCHA admin console

List every live host for the site key — the Firebase hosts
`creativecodelogic.web.app` and `creativecodelogic.firebaseapp.com`, the custom
domain `creativecodelogic.com` (and `www` if used) once connected, plus
`localhost` for local testing. A domain mismatch renders an error widget and the
Send button stays disabled, so add the `.web.app` host now (it's the live URL
until the custom domain resolves).

## Canonical origin: www vs non-www

The site currently uses **non-www** (`https://creativecodelogic.com/`)
everywhere. If www becomes canonical, find-replace the origin in:

- `index.html` — `<link rel="canonical">`, `og:url`, `og:image`,
  `twitter:image`, and the JSON-LD `url` / `logo`
- `public/robots.txt` — the `Sitemap:` line
- `public/sitemap.xml` — the `<loc>`

(Keep the host's own redirect — 301 the non-canonical host to the canonical
one — in sync with this choice.)

## Post-deploy checklist

- [ ] Verify the two forms submit end to end against the live Formspark forms
      (brief → mailto/POST, contact → captcha → POST).
- [ ] Confirm zero requests to `fonts.googleapis.com` / `fonts.gstatic.com`
      (fonts are self-hosted).
- [ ] Re-run Lighthouse against the **production URL** (same command as local:
      `bunx lighthouse <url> --preset=desktop`, `CHROME_PATH` set) — fonts, CDN,
      and hosting can shift LCP and the performance score.
- [ ] If the numbers shifted, update them in the two truthful places:
      `WorldCode.tsx` (`BUILD_LOG` + `METRICS`) and the README quality-bar table.
