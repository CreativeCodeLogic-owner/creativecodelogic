import { useEffect, useState } from "react";
import { GA_MEASUREMENT_ID } from "@/lib/flags";
import {
  CONSENT_RESET_EVENT,
  disableAnalytics,
  getConsent,
  loadAnalytics,
  setConsent,
} from "@/lib/consent";

/**
 * Consent-first analytics notice. Shown on first visit only when a GA id is
 * configured and no choice is stored (re-asked after 12 months, or when the
 * footer's "Privacy choices" clears it). NOT a modal — no backdrop, no focus
 * trap, the page stays fully usable behind it. Accept loads GA; Decline (or
 * ignoring it) means zero Google requests. It yields to the inline brief so it
 * never stacks over the Send row, and `BackToTop` hides while it's up.
 */
export function ConsentBanner() {
  const id = GA_MEASUREMENT_ID;
  const [visible, setVisible] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);

  useEffect(() => {
    if (!id) return; // no id → no banner, no analytics
    const stored = getConsent();
    if (stored === "accept") loadAnalytics(id);
    else if (stored === "decline") disableAnalytics(id);
    else setVisible(true);
    const reshow = () => setVisible(true);
    window.addEventListener(CONSENT_RESET_EVENT, reshow);
    return () => window.removeEventListener(CONSENT_RESET_EVENT, reshow);
  }, [id]);

  // both the banner and the inline brief live at the bottom — yield to the brief
  useEffect(() => {
    const check = () => setBriefOpen(!!document.querySelector("[data-brief-form]"));
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  if (!id || !visible || briefOpen) return null;

  const accept = () => {
    setConsent("accept");
    loadAnalytics(id);
    setVisible(false);
  };
  const decline = () => {
    setConsent("decline");
    disableAnalytics(id);
    setVisible(false);
  };

  return (
    <div
      data-consent-banner
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-40 px-4"
      style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-3 rounded-xl border border-ink/10 bg-navy/95 p-4 text-sm leading-relaxed text-mist shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-prose">
          We&rsquo;d like to measure visits with Google Analytics. No marketing
          cookies, and nothing loads until you agree.{" "}
          <a
            href="/privacy"
            className="rounded-sm text-accent underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Privacy
          </a>
        </p>
        <div className="flex shrink-0 items-center gap-4">
          <button
            type="button"
            data-consent-decline
            onClick={decline}
            className="rounded-md text-mist transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Decline
          </button>
          <button
            type="button"
            data-consent-accept
            onClick={accept}
            className="rounded-full border border-accent bg-accent/10 px-5 py-2 font-medium text-accent transition-colors hover:bg-accent hover:text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
