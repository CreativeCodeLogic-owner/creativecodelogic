import { GA_MEASUREMENT_ID } from "@/lib/flags";
import { clearConsent } from "@/lib/consent";

export function Footer() {
  return (
    <footer className="border-t border-ink/8">
      <div className="mx-auto max-w-6xl px-6 py-8 text-center md:px-10">
        <p className="text-[10px] leading-relaxed text-mist">
          © 2026 Built with Creative Code Logic
          <span className="text-accent">*</span>. Designed to solve. Built to
          perform.
          {" · "}
          <a
            href="/terms"
            className="rounded-sm transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Terms
          </a>
          {" · "}
          <a
            href="/privacy"
            className="rounded-sm transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Privacy
          </a>
          {/* withdrawal: clears the stored choice and re-summons the consent
              banner — GDPR wants withdrawal as easy as consent */}
          {GA_MEASUREMENT_ID && (
            <>
              {" · "}
              <button
                type="button"
                data-privacy-choices
                onClick={() => clearConsent()}
                className="rounded-sm transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                Privacy choices
              </button>
            </>
          )}
        </p>
      </div>
    </footer>
  );
}
