# Deployment

## Build

```bash
bun install
bun run build        # tsc --noEmit + vite build → dist/
bun run preview      # serve dist/ on :4173 to sanity-check the production build
```

Deploy the contents of `dist/` as static files. `public/` (fonts, `og.jpg`,
`favicon.svg`, `robots.txt`, `sitemap.xml`) is copied to the root of `dist/`.

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

List the production domains for the site key — `creativecodelogic.com` (and
`www` if used) plus `localhost` for local testing. A domain mismatch renders an
error widget and the Send button stays disabled.

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
