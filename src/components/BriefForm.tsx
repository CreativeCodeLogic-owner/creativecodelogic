import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/scroll";
import { sealStampTl } from "@/lib/seal";
import { CAPTCHA_SITEKEY } from "@/lib/flags";
import { mountInvisibleCaptcha, type InvisibleCaptcha } from "@/lib/captcha";
import { submitForm } from "@/lib/submit";
import { CaptchaNotice } from "@/components/CaptchaNotice";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const MAILTO = "hello@creativecodelogic.com";
const SUBJECT = "Project brief — Creative Code Logic";
const KINDS = ["Website", "Web app", "Mobile app", "Something else"];
const TIMINGS = ["As soon as possible", "In the next few months", "Just exploring"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "form" | "sending" | "success" | "error";
type Step = 1 | 2 | 3;

type Answers = {
  kind: string;
  kindOther: string;
  problem: string;
  timing: string;
  email: string;
};

function mailtoHref(a: Answers): string {
  const body = [
    `What are you making: ${a.kind}${a.kindOther ? ` — ${a.kindOther}` : ""}`,
    `What it should solve: ${a.problem}`,
    `Timeline: ${a.timing}`,
    `Reply to: ${a.email}`,
  ].join("\n");
  return `mailto:${MAILTO}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(body)}`;
}

const chipClass = (selected: boolean) =>
  `inline-flex min-h-[40px] items-center rounded-full border px-4 py-2 text-sm transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
    selected
      ? "border-accent bg-accent text-navy"
      : "border-accent/50 text-ink hover:bg-accent/10"
  }`;

const fieldClass =
  "w-full rounded-md border border-ink/15 bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-mist/70 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

/**
 * The brief flow — three questions, one at a time, that resolve into a real
 * submission (Formspark) or a mailto: fallback when no form id is configured.
 * Scrubbed height is stable: the caller reserves the swap box; this only fills
 * it. Reduced motion: instant step swaps, no seal animation.
 */
export function BriefForm() {
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState<Step>(1);
  const [status, setStatus] = useState<Status>("form");
  const [kind, setKind] = useState("");
  const [kindOther, setKindOther] = useState("");
  const [problem, setProblem] = useState("");
  const [timing, setTiming] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const panelRef = useRef<HTMLDivElement>(null);
  const firstControlRef = useRef<HTMLElement | null>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLSpanElement>(null);
  const captchaBoxRef = useRef<HTMLDivElement>(null);
  const captchaRef = useRef<InvisibleCaptcha | null>(null);

  // lazy-load + mount the invisible captcha the first time the brief opens
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

  const stepValid =
    step === 1 ? kind !== "" : step === 2 ? problem.trim().length >= 10 : timing !== "" && EMAIL_RE.test(email);

  // animate the panel in + move focus + keep layout measured on each swap
  useLayoutEffect(() => {
    const focusTarget =
      status === "success" ? successRef.current : firstControlRef.current;
    if (!reduced && panelRef.current) {
      // opacity (not autoAlpha) so the panel never goes visibility:hidden —
      // otherwise focus() below can't land on a control inside it
      gsap.fromTo(
        panelRef.current,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" },
      );
    }
    if (status === "success" && sealRef.current) {
      if (reduced) {
        gsap.set(sealRef.current, { autoAlpha: 1 });
      } else {
        sealStampTl(sealRef.current);
      }
    }
    focusTarget?.focus();
    ScrollTrigger.refresh();
  }, [step, status, reduced]);

  const back = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  async function send() {
    const answers: Answers = { kind, kindOther, problem, timing, email };
    setStatus("sending");
    const result = await submitForm(
      { form: "brief", kind, kindOther, problem, timing, email, _gotcha: honeypot },
      mailtoHref(answers),
      captchaRef.current,
    );
    setStatus(result);
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepValid) return;
    if (step < 3) setStep((s) => ((s + 1) as Step));
    else void send();
  };

  if (status === "success") {
    return (
      <div
        ref={successRef}
        data-brief-success
        tabIndex={-1}
        className="flex flex-col items-center text-center focus-visible:outline-none"
      >
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
        <p className="max-w-sm text-lg leading-relaxed text-ink" role="status">
          Received. We&rsquo;ll come back with thinking, not a sales call.
        </p>
      </div>
    );
  }

  return (
    <form
      data-brief-form
      onSubmit={onSubmit}
      noValidate
      className="mx-auto w-full max-w-lg text-left"
    >
      {/* progress */}
      <div
        className="mb-6 flex items-center justify-center gap-2"
        aria-label={`Step ${step} of 3`}
      >
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            data-dot
            aria-hidden="true"
            className={`h-2 w-2 rounded-full transition-colors duration-300 ${
              n === step ? "bg-accent" : n < step ? "bg-accent/60" : "bg-accent/25"
            }`}
          />
        ))}
      </div>

      <div ref={panelRef}>
        {step === 1 && (
          <fieldset className="border-0 p-0">
            <legend className="mb-4 block font-display text-xl text-ink">
              What are you making?
            </legend>
            <div className="flex flex-wrap gap-2.5">
              {KINDS.map((k, i) => (
                <button
                  key={k}
                  ref={i === 0 ? (el) => { firstControlRef.current = el; } : undefined}
                  type="button"
                  aria-pressed={kind === k}
                  data-chip
                  onClick={() => setKind(k)}
                  className={chipClass(kind === k)}
                >
                  {k}
                </button>
              ))}
            </div>
            <label htmlFor="brief-kind-note" className="mt-5 block">
              <span className="sr-only">A few words about what you are making</span>
              <input
                id="brief-kind-note"
                type="text"
                value={kindOther}
                onChange={(e) => setKindOther(e.target.value)}
                placeholder="A few words, if you like"
                className={fieldClass}
              />
            </label>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset className="border-0 p-0">
            <legend className="mb-4 block font-display text-xl text-ink">
              What should it solve?
            </legend>
            <label htmlFor="brief-problem">
              <span className="sr-only">The problem, in your words</span>
              <textarea
                id="brief-problem"
                ref={(el) => { firstControlRef.current = el; }}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                rows={3}
                placeholder="The problem, in your words. A sentence is enough."
                className={`${fieldClass} resize-none`}
              />
            </label>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset className="border-0 p-0">
            <legend className="mb-4 block font-display text-xl text-ink">
              When do you need it?
            </legend>
            <div className="flex flex-wrap gap-2.5">
              {TIMINGS.map((t, i) => (
                <button
                  key={t}
                  ref={i === 0 ? (el) => { firstControlRef.current = el; } : undefined}
                  type="button"
                  aria-pressed={timing === t}
                  data-chip
                  onClick={() => setTiming(t)}
                  className={chipClass(timing === t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <label htmlFor="brief-email" className="mt-5 block">
              <span className="mb-2 block text-sm text-mist">
                Where do we send the thinking?
              </span>
              <input
                id="brief-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                aria-describedby={status === "error" ? "brief-error" : undefined}
                className={fieldClass}
              />
            </label>
            {status === "error" && (
              <p id="brief-error" role="alert" className="mt-3 text-sm text-mist">
                Something broke on the way.{" "}
                <a
                  href={mailtoHref({ kind, kindOther, problem, timing, email })}
                  className="text-accent underline underline-offset-2"
                >
                  Send it by email instead →
                </a>
              </p>
            )}
          </fieldset>
        )}
      </div>

      {/* honeypot — hidden from users, catches bots */}
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

      <div className="mt-7 flex items-center justify-between gap-4">
        {step > 1 ? (
          <button
            type="button"
            data-brief-back
            onClick={back}
            className="text-sm text-mist transition-colors duration-200 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            ← Back
          </button>
        ) : (
          <span />
        )}

        {step < 3 ? (
          <button
            type="submit"
            data-brief-next
            disabled={!stepValid}
            className="rounded-full border border-accent px-6 py-2.5 text-sm font-medium text-accent transition-colors duration-200 hover:bg-accent hover:text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue →
          </button>
        ) : (
          <button
            type="submit"
            data-brief-submit
            disabled={!stepValid || status === "sending"}
            className="rounded-full border border-accent bg-accent/10 px-6 py-2.5 text-sm font-medium text-accent transition-colors duration-200 hover:bg-accent hover:text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "sending" ? "Sending…" : "Send the brief"}
          </button>
        )}
      </div>

      {/* invisible reCAPTCHA anchor + required attribution */}
      <div ref={captchaBoxRef} />
      <CaptchaNotice />
    </form>
  );
}
