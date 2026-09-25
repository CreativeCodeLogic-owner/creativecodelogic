# Deployment

## Build

```bash
bun install
bun run build        # tsc --noEmit + vite build → dist/
bun run preview      # serve dist/ on :4173 to sanity-check the production build
```

Deploy the contents of `dist/` as static files. `public/` (fonts, `og.jpg`, the
favicon set, `site.webmanifest`, `robots.txt`, `sitemap.xml`, the static
`404.html` / `terms.html` / `privacy.html`, and `email/`) is copied to the root
of `dist/`.

`email/` holds the email-signature assets: one avatar per mailbox plus a
`noindex` copy page per person (`/email/<id>`). They are not linked from the
site, are disallowed in `robots.txt`, and are loaded by the signatures from
`https://creativecodelogic.com/email/avatar-<id>.png`, so they must stay at
that path.

## Hosting

- **Origin:** Firebase Hosting, project `creativecodelogic` (set in
  `.firebaserc`). The origin host is <https://creativecodelogic.web.app>
  (mirror: `creativecodelogic.firebaseapp.com`).
- **Production domain:** <https://creativecodelogic.com> is live and is the
  canonical host. It is served through **Cloudflare**, which sits in front of
  Firebase Hosting.
- **www:** `www.creativecodelogic.com` is not configured yet (no DNS record).
- **Git remote:** `git@github.com:CreativeCodeLogic-owner/creativecodelogic.git`
  (SSH; tokens never go in the remote/config).
- **Config:** `firebase.json`: `hosting.public: dist`, `cleanUrls: true` (so
  `/terms`, `/privacy` and `/email/<id>` serve extensionless; `.html`
  301-redirects), long-cache immutable headers on `/fonts` and `/assets`,
  day-cache on root images. Firebase serves `dist/404.html` for unmatched
  routes automatically.

```bash
firebase deploy --only hosting        # uses .firebaserc default project
```

### Cloudflare

Cloudflare rewrites HTML it serves unless told not to, so two settings matter:

- The **Configuration Rule "Email Signatures Folder"** (`/email/` →
  Email Obfuscation **Off**) must stay. Without it, Cloudflare replaces the
  `mailto:` links on the signature pages with `/cdn-cgi/l/email-protection`
  links and "[email protected]", which breaks signatures copied from them.
  Check with `curl -s https://creativecodelogic.com/email/admin | grep -c
  email-protection` (expect 0).
- **Never enable Hotlink Protection without exempting `/email/`.** Email
  clients load the signature avatars from other origins; hotlink protection
  would block them.

When served HTML differs from `dist/`, compare the `.com` response with the
`.web.app` origin to tell a Cloudflare rewrite from a deploy problem.

## Environment variables

Set these in the build environment (or a production `.env`). Names only: real
values never live in the repo. See `.env.example`.

| Variable | Purpose | Production build |
| --- | --- | --- |
| `VITE_FORMSPARK_FORM_ID_BRIEF` | Formspark form id for the brief flow. | required |
| `VITE_FORMSPARK_FORM_ID_CONTACT` | Formspark form id for the contact drawer. | required |
| `VITE_CAPTCHA_SITEKEY` | reCAPTCHA v2 checkbox **site** key (contact drawer). | required |
| `VITE_GA_MEASUREMENT_ID` | GA4 measurement id (`G-…`), consent-gated. | required |
| `VITE_SHOW_WORK` | `true` renders the Work chapter. | optional |
| `VITE_AMBIENT` | `true` mounts the ambient background field. | optional |

These are build-time (`VITE_*`); rebuild after changing them.

**Build guard.** `vite.config.ts` makes a production `vite build` throw, naming
the missing variables (never their values), when any of the four required ids
is empty. Process environment variables override `.env`. Dev (`bun run dev`)
is not affected.

## Formspark dashboard

Two forms back the site; configure each:

- **CONTACT form** (`VITE_FORMSPARK_FORM_ID_CONTACT`): enable reCAPTCHA and set
  the reCAPTCHA **secret** that pairs with `VITE_CAPTCHA_SITEKEY`. The site
  renders the **visible reCAPTCHA v2 checkbox**, so the key pair must be a v2
  "Checkbox" pair (not Invisible, not v3). Enable the honeypot (`_gotcha`).
- **BRIEF form** (`VITE_FORMSPARK_FORM_ID_BRIEF`): reCAPTCHA **disabled** (the
  brief sends no token). Honeypot (`_gotcha`) can stay on.
- Optionally route/filter the shared inbox by the `form` field (`brief` vs
  `hello`).

> A misconfigured captcha secret makes Formspark reject every submission as spam
> with HTTP 500 (`formspark-status: spam`), including token-less ones. If real
> submissions 500, check the CONTACT form's captcha secret first.

## reCAPTCHA admin console

List every live host for the site key: `creativecodelogic.com`, the Firebase
hosts `creativecodelogic.web.app` and `creativecodelogic.firebaseapp.com`,
`www.creativecodelogic.com` if it is ever configured, plus `localhost` for
local testing. A domain mismatch renders an error widget and the Send button
stays disabled.

## Canonical origin: www vs non-www

The site uses **non-www** (`https://creativecodelogic.com/`) everywhere. If www
becomes canonical, find-replace the origin in:

- `index.html`: `<link rel="canonical">`, `og:url`, `og:image`,
  `twitter:image`, and the JSON-LD `url` / `logo`
- `public/robots.txt`: the `Sitemap:` line
- `public/sitemap.xml`: the `<loc>` entries
- `public/email/*.html`: the avatar URLs (and the signatures already sent out)

If www is added, 301 it to the canonical host.

## Release checklist

1. `bun run build` (clean), then `node scripts/verify6.mjs` against a single
   dev server on `:5173`: it must print `VERIFY6: PASS` and exit 0.
2. Scoped commit: stage explicit paths only, check `git diff --cached --stat`.
3. `git push origin main`.
4. `firebase deploy --only hosting`.
5. Live verification on **both** hosts (`creativecodelogic.com` and
   `creativecodelogic.web.app`): `/` returns 200, the served `index-*.js`
   matches `dist/`, and the changed strings are present in the live bundle;
   `/email/admin` has 0 `email-protection`; `/robots.txt` still disallows
   `/email/`.
6. Run PageSpeed Insights on <https://creativecodelogic.com>, desktop and
   mobile.
7. Sync the terminal (`WorldCode.tsx` `BUILD_LOG` + `METRICS`, desktop values)
   and the README quality bar (desktop and mobile rows) with the live numbers.
8. Release commit: move `[Unreleased]` to a `## [X.Y.Z] - YYYY-MM-DD` heading
   in `CHANGELOG.md` (fresh empty `[Unreleased]` above), bump `package.json`,
   commit as `release: X.Y.Z`, and create an **annotated** tag:
   `git tag -a vX.Y.Z -m "…"` (lightweight tags are skipped by
   `--follow-tags`).
9. `git push origin main --follow-tags`, then confirm with
   `git ls-remote --tags origin vX.Y.Z`.
10. `firebase deploy --only hosting` and repeat the live verification.

Also after a deploy: confirm zero requests to `fonts.googleapis.com` /
`fonts.gstatic.com` (fonts are self-hosted), and submit both forms end to end
when their configuration changed.
