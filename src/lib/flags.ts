/** Feature flags from the environment (see .env / .env.example). */
export const SHOW_WORK = import.meta.env.VITE_SHOW_WORK === "true";

/**
 * Ambient background field. Off by default (solid navy background) — the
 * component and its verify logic are preserved for possible revival. Set
 * VITE_AMBIENT=true to mount it.
 */
export const SHOW_AMBIENT = import.meta.env.VITE_AMBIENT === "true";

/**
 * Formspark form ids — one per form. Empty/undefined → that form still works
 * but its final submit composes a mailto: instead of POSTing (brief only;
 * the contact drawer has no email fallback).
 */
export const FORMSPARK_FORM_ID_BRIEF =
  (import.meta.env.VITE_FORMSPARK_FORM_ID_BRIEF as string | undefined) ?? "";
export const FORMSPARK_FORM_ID_CONTACT =
  (import.meta.env.VITE_FORMSPARK_FORM_ID_CONTACT as string | undefined) ?? "";

/**
 * Invisible reCAPTCHA v2 site key. Empty/undefined → captcha is skipped
 * entirely (dev + mailto fallback keep working).
 */
export const CAPTCHA_SITEKEY =
  (import.meta.env.VITE_CAPTCHA_SITEKEY as string | undefined) ?? "";

/**
 * Google Analytics 4 measurement id (`G-XXXXXXXX`). Empty → no consent banner
 * and no analytics at all (dev default). GA loads only after explicit consent.
 */
export const GA_MEASUREMENT_ID =
  (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) ?? "";
