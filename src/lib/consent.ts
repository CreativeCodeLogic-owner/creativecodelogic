/**
 * Consent-first analytics. GA never loads and no cookie is set until the visitor
 * explicitly accepts. The choice is stored locally and re-asked after ~12 months.
 * Declining (or having no choice) means zero Google requests.
 */
const KEY = "ccl-consent";
const VERSION = 1;
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // ~12 months, then re-ask

export type ConsentChoice = "accept" | "decline";
type Stored = { choice: ConsentChoice; ts: number; v: number };

/** Fired when the stored choice is cleared (footer "Privacy choices"), so the
 *  banner can re-summon itself. */
export const CONSENT_RESET_EVENT = "ccl:consent-reset";

/** The current stored choice, or null when there is none / it has expired. */
export function getConsent(): ConsentChoice | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Stored;
    if (s.v !== VERSION || typeof s.ts !== "number") return null;
    if (Date.now() - s.ts > MAX_AGE_MS) return null; // expired → re-ask
    return s.choice === "accept" || s.choice === "decline" ? s.choice : null;
  } catch {
    return null;
  }
}

export function setConsent(choice: ConsentChoice): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ choice, ts: Date.now(), v: VERSION } satisfies Stored));
  } catch {
    /* storage unavailable — treat as no consent */
  }
}

/** Clear the stored choice, return consent to denied, drop GA cookies, and
 *  notify the banner to re-appear (withdrawal). */
export function clearConsent(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  denyAnalytics();
  clearGaCookies();
  window.dispatchEvent(new Event(CONSENT_RESET_EVENT));
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Consent Mode v2: gtag.js and the consent 'default' (denied) are set up inline
 * in index.html on page load. These just flip analytics_storage — GA never
 * measures or sets cookies until granted.
 */
export function grantAnalytics(): void {
  window.gtag?.("consent", "update", { analytics_storage: "granted" });
}

/** Record this visit's page view (config runs with send_page_view:false, so the
 *  view is only counted once consent is granted). */
export function recordPageView(): void {
  window.gtag?.("event", "page_view");
}

export function denyAnalytics(): void {
  window.gtag?.("consent", "update", { analytics_storage: "denied" });
}

/** Remove GA's own cookies (`_ga`, `_ga_*`) — used on withdrawal. Best-effort
 *  across the host and its registrable domain. */
export function clearGaCookies(): void {
  const host = location.hostname;
  const parts = host.split(".");
  const domains = new Set([host, "." + host, "." + parts.slice(-2).join(".")]);
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0].trim();
    if (!/^_ga/.test(name)) continue;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    for (const d of domains) {
      document.cookie = `${name}=; path=/; domain=${d}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  }
}
