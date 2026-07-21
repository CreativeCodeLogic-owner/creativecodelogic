import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, startScroll, stopScroll } from "@/lib/scroll";
import { sealStampTl } from "@/lib/seal";
import { CAPTCHA_SITEKEY } from "@/lib/flags";
import { mountInvisibleCaptcha, type InvisibleCaptcha } from "@/lib/captcha";
import { submitForm, type SubmitResult } from "@/lib/submit";
import { CaptchaNotice } from "@/components/CaptchaNotice";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const MAILTO = "hello@creativecodelogic.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEADING_ID = "hello-heading";

const fieldClass =
  "w-full rounded-md border border-ink/15 bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-mist/70 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

function mailtoHref(email: string, message: string): string {
  const body = [`From: ${email}`, "", message].join("\n");
  return `mailto:${MAILTO}?subject=${encodeURIComponent("Say hello — Creative Code Logic")}&body=${encodeURIComponent(body)}`;
}

/**
 * A slide-in drawer for a quick hello. Same Formspark endpoint as the brief,
 * tagged form:"hello". role=dialog, focus trapped, Esc + backdrop close, scroll
 * locked while open. Reduced motion: instant show/hide, no slide.
 */
export function HelloDrawer({ onClose }: { onClose: () => void }) {
  const reduced = usePrefersReducedMotion();
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const sealRef = useRef<HTMLSpanElement>(null);
  const captchaBoxRef = useRef<HTMLDivElement>(null);
  const captchaRef = useRef<InvisibleCaptcha | null>(null);
  const closing = useRef(false);

  const [status, setStatus] = useState<SubmitResult | "form" | "sending">("form");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const valid = EMAIL_RE.test(email) && message.trim().length >= 5;

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

  // lazy-load the captcha the first time the drawer opens
  useEffect(() => {
    if (!CAPTCHA_SITEKEY || !captchaBoxRef.current) return;
    let cancelled = false;
    mountInvisibleCaptcha(captchaBoxRef.current)
      .then((c) => {
        if (!cancelled) captchaRef.current = c;
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

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    const nodes = panelRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || status === "sending") return;
    setStatus("sending");
    const result = await submitForm(
      { form: "hello", email, message, _gotcha: honeypot },
      mailtoHref(email, message),
      captchaRef.current,
    );
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
              placeholder="you@company.com"
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

            {status === "error" && (
              <p id="hello-error" role="alert" className="mt-3 text-sm text-mist">
                Something broke on the way.{" "}
                <a
                  href={mailtoHref(email, message)}
                  className="text-accent underline underline-offset-2"
                >
                  Send it by email instead →
                </a>
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

            <button
              type="submit"
              data-hello-submit
              disabled={!valid || status === "sending"}
              className="mt-7 self-start rounded-full border border-accent bg-accent/10 px-6 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === "sending" ? "Sending…" : "Send"}
            </button>

            <div ref={captchaBoxRef} />
            <CaptchaNotice />

            <p className="mt-6 text-xs text-mist/60">
              Prefer email?{" "}
              <a
                href={`mailto:${MAILTO}`}
                className="text-mist underline underline-offset-2 hover:text-ink"
              >
                {MAILTO}
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
