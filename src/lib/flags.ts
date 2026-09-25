/** Feature flags from the environment (see .env / .env.example). */
export const SHOW_WORK = import.meta.env.VITE_SHOW_WORK === "true";

/**
 * Ambient background field. Off by default (solid navy background) — the
 * component and its verify logic are preserved for possible revival. Set
 * VITE_AMBIENT=true to mount it.
 */
export const SHOW_AMBIENT = import.meta.env.VITE_AMBIENT === "true";

/**
 * Formspark form ids — one per form. Empty/undefined → the brief's final submit
 * composes a mailto: instead of POSTing; the contact drawer (no email fallback)
 * shows its error state. Production builds refuse to run without them
 * (see vite.config.ts).
 */
export const FORMSPARK_FORM_ID_BRIEF =
  (import.meta.env.VITE_FORMSPARK_FORM_ID_BRIEF as string | undefined) ?? "";
export const FORMSPARK_FORM_ID_CONTACT =
  (import.meta.env.VITE_FORMSPARK_FORM_ID_CONTACT as string | undefined) ?? "";

/**
 * reCAPTCHA v2 site key for the visible checkbox in the contact drawer.
 * Empty/undefined → the checkbox is skipped entirely (dev keeps working).
 */
export const CAPTCHA_SITEKEY =
  (import.meta.env.VITE_CAPTCHA_SITEKEY as string | undefined) ?? "";

/**
 * Google Analytics 4 measurement id (`G-XXXXXXXX`). Empty → no consent banner
 * and no analytics at all (dev default). With an id, gtag.js loads with the page
 * under Consent Mode v2, but sets no cookies and records nothing until accept.
 */
export const GA_MEASUREMENT_ID =
  (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) ?? "";
