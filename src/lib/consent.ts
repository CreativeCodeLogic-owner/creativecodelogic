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

/** Clear the stored choice and notify the banner to re-appear (withdrawal). */
export function clearConsent(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(CONSENT_RESET_EVENT));
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

let loaded = false;

/** Inject gtag.js once and configure the id (default page_view — one page, no
 *  SPA routing to track). No-op without an id. */
export function loadAnalytics(id: string): void {
  if (loaded || !id) return;
  loaded = true;
  window[`ga-disable-${id}`] = false;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  const gtag = (...args: unknown[]) => {
    window.dataLayer!.push(args);
  };
  gtag("js", new Date());
  gtag("config", id, { send_page_view: true });
  window.gtag = gtag;
}

/** Belt-and-suspenders: stop GA from collecting if it was loaded this session. */
export function disableAnalytics(id: string): void {
  if (id) window[`ga-disable-${id}`] = true;
}
