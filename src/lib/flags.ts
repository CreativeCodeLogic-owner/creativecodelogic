/** Feature flags from the environment (see .env / .env.example). */
export const SHOW_WORK = import.meta.env.VITE_SHOW_WORK === "true";

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
