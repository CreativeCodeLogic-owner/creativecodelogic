import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, startScroll, stopScroll } from "@/lib/scroll";
import { sealStampTl } from "@/lib/seal";
import { CAPTCHA_SITEKEY, FORMSPARK_FORM_ID_CONTACT } from "@/lib/flags";
import { renderCheckbox, type CheckboxCaptcha } from "@/lib/captcha";
import { submitForm, type SubmitResult } from "@/lib/submit";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEADING_ID = "hello-heading";

const fieldClass =
  "w-full rounded-md border border-ink/15 bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-mist/70 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

/**
 * A slide-in drawer for a quick hello. Posts to the CONTACT Formspark form
 * (tagged form:"hello") with a VISIBLE reCAPTCHA v2 checkbox. No email address
 * appears anywhere in this UI. role=dialog, focus trapped, Esc + backdrop close,
 * scroll locked while open. Reduced motion: instant show/hide, no slide.
 */
export function HelloDrawer({ onClose }: { onClose: () => void }) {
  const reduced = usePrefersReducedMotion();
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const sealRef = useRef<HTMLSpanElement>(null);
  const captchaBoxRef = useRef<HTMLDivElement>(null);
  const captchaRef = useRef<CheckboxCaptcha | null>(null);
  const closing = useRef(false);

  const [status, setStatus] = useState<SubmitResult | "form" | "sending">("form");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [captchaSolved, setCaptchaSolved] = useState(false);

  const valid =
    EMAIL_RE.test(email) &&
    message.trim().length >= 5 &&
    (!CAPTCHA_SITEKEY || captchaSolved);

  // enter animation + scroll lock + initial focus
  useLayoutEffect(() => {
    stopScroll();
    if (!reduced && panelRef.current && backdropRef.current) {
      gsap.set(backdropRef.current, { opacity: 0 });
      gsap.set(panelRef.current, { xPercent: 100 });
      gsap.to(backdropRef.current, { opacity: 1, duration: 0.3, ease: "power2.out" });
      gsap.to(panelRef.current, { xPercent: 0, duration: 0.45, ease: "power3.out" });
    }
    emailRef.current?.focus();
    return () => startScroll();
  }, [reduced]);

  // lazy-load + render the visible captcha the first time the drawer opens
  useEffect(() => {
    if (!CAPTCHA_SITEKEY || !captchaBoxRef.current) return;
    let cancelled = false;
    renderCheckbox(captchaBoxRef.current, (solved) => {
      if (!cancelled) setCaptchaSolved(solved);
    })
      .then((c) => {
        if (cancelled) c.reset();
        else captchaRef.current = c;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // stamp the seal on success
  useLayoutEffect(() => {
    if (status !== "success" || !sealRef.current) return;
    if (reduced) gsap.set(sealRef.current, { autoAlpha: 1 });
    else sealStampTl(sealRef.current);
  }, [status, reduced]);

  const handleClose = () => {
    if (closing.current) return;
    closing.current = true;
    captchaRef.current?.reset();
    if (reduced || !panelRef.current || !backdropRef.current) {
      onClose();
      return;
    }
    gsap.to(backdropRef.current, { opacity: 0, duration: 0.25, ease: "power2.in" });
    gsap.to(panelRef.current, {
      xPercent: 100,
      duration: 0.3,
      ease: "power3.in",
      onComplete: onClose,
    });
  };

  // Esc-to-close. (Won't fire while focus is inside the cross-origin reCAPTCHA
  // iframe — the sentinels below keep focus from ever leaking past the panel.)
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    }
  };

  // Focus sentinels trap focus even across the reCAPTCHA iframe: a keydown trap
  // can't see Tab from inside a cross-origin frame, but a guard element that
  // *receives* focus when it wraps out can bounce it back to the other end.
  const realFocusables = () =>
    Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled])',
      ) ?? [],
    ).filter(
      (el) =>
        !el.hasAttribute("data-sentinel") &&
        el.tabIndex !== -1 && // skip the honeypot
        el.offsetParent !== null, // skip hidden (honeypot / reCAPTCHA's g-recaptcha-response textarea)
    );
  const focusFirst = () => realFocusables()[0]?.focus();
  const focusLast = () => {
    const els = realFocusables();
    els[els.length - 1]?.focus();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || status === "sending") return;
    setStatus("sending");
    const token = captchaRef.current?.getToken() ?? "";
    const result = await submitForm(
      FORMSPARK_FORM_ID_CONTACT,
      { form: "hello", email, message, _gotcha: honeypot },
      null, // no email fallback in the contact UI
      token,
    );
    captchaRef.current?.reset(); // clear the checkbox for a retry
    setStatus(result);
  };

  return (
    <div className="fixed inset-0 z-[60]" onKeyDown={onKeyDown}>
      <div
        ref={backdropRef}
        onClick={handleClose}
        aria-hidden="true"
        className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={HEADING_ID}
        className="absolute top-0 right-0 flex h-full w-full max-w-full flex-col overflow-y-auto border-l border-ink/10 bg-navy px-6 py-8 md:max-w-[420px] md:px-8"
      >
        {/* top focus sentinel: shift-tab out of the top wraps to the bottom */}
        <div data-sentinel tabIndex={0} aria-hidden="true" onFocus={focusLast} />

        <div className="mb-6 flex items-start justify-between">
          <h2 id={HEADING_ID} className="font-display text-2xl font-semibold text-ink">
            Say hello
          </h2>
          <button
            type="button"
            data-hello-close
            onClick={handleClose}
            aria-label="Close"
            className="-mr-1 rounded-full p-2 text-mist transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            ✕
          </button>
        </div>

        {status === "success" ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <span
              ref={sealRef}
              data-seal
              aria-hidden="true"
              className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-accent/40 text-lg text-accent"
              style={reduced ? undefined : { opacity: 0 }}
            >
              <span
                data-seal-ring
                className="absolute inset-0 rounded-full border border-accent/60 opacity-0"
              />
              ✦
            </span>
            <p className="max-w-xs leading-relaxed text-ink" role="status">
              Received. We&rsquo;ll come back with thinking, not a sales call.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-8 rounded-full border border-accent/50 px-6 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col">
            <p className="mb-6 leading-relaxed text-mist">
              A note is enough. We read everything.
            </p>

            <label htmlFor="hello-email" className="mb-2 block text-sm text-mist">
              Your email
            </label>
            <input
              id="hello-email"
              ref={emailRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Where should we reply?"
              aria-describedby={status === "error" ? "hello-error" : undefined}
              className={fieldClass}
            />

            <label htmlFor="hello-message" className="mt-5 mb-2 block text-sm text-mist">
              Your note
            </label>
            <textarea
              id="hello-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="What&rsquo;s on your mind?"
              aria-describedby={status === "error" ? "hello-error" : undefined}
              className={`${fieldClass} resize-none`}
            />

            {/* visible reCAPTCHA v2 checkbox (dark, normal) — only when configured */}
            {CAPTCHA_SITEKEY && <div ref={captchaBoxRef} data-captcha className="mt-5" />}

            {status === "error" && (
              <p id="hello-error" role="alert" className="mt-4 text-sm text-mist">
                Something broke on the way. Give it another try.
              </p>
            )}

            {/* honeypot */}
            <input
              type="text"
              name="_gotcha"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
            />

            {status === "error" ? (
              <button
                type="button"
                data-hello-retry
                onClick={() => setStatus("form")}
                className="mt-5 self-start rounded-full border border-accent bg-accent/10 px-6 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                Try again
              </button>
            ) : (
              <button
                type="submit"
                data-hello-submit
                disabled={!valid || status === "sending"}
                className="mt-5 self-start rounded-full border border-accent bg-accent/10 px-6 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
              >
                {status === "sending" ? "Sending…" : "Send"}
              </button>
            )}
          </form>
        )}

        {/* bottom focus sentinel: tab off the last control wraps to the top */}
        <div data-sentinel tabIndex={0} aria-hidden="true" onFocus={focusFirst} />
      </div>
    </div>
  );
}
