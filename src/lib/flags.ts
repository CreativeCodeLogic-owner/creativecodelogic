/** Feature flags from the environment (see .env / .env.example). */
export const SHOW_WORK = import.meta.env.VITE_SHOW_WORK === "true";

/**
 * Formspark form id for the brief flow. Empty/undefined → the brief still works
 * but the final submit composes a mailto: instead of POSTing (see BriefForm).
 */
export const FORMSPARK_FORM_ID =
  (import.meta.env.VITE_FORMSPARK_FORM_ID as string | undefined) ?? "";
