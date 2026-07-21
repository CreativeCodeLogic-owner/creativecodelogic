import { useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/scroll";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useMagnetic } from "@/hooks/useMagnetic";
import { BriefForm } from "@/components/BriefForm";

const CONTACT_HREF = "mailto:hello@creativecodelogic.com";

/**
 * Chapter 5 — The Invitation.
 * Large-type closer. The CTA opens an inline three-question brief flow in
 * place (no modal, no route); the swap area holds a stable height so the
 * footer never shifts between the CTA, the steps, and the success state.
 */
export function Invitation() {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const ctaRef = useMagnetic<HTMLButtonElement>(6, 60);
  const ctaBlockRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-invite-stagger]", {
        y: 36,
        autoAlpha: 0,
        duration: 0.9,
        stagger: 0.14,
        ease: "power3.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 72%", once: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, [reduced]);

  const openBrief = () => {
    if (reduced || !ctaBlockRef.current) {
      setOpen(true);
      ScrollTrigger.refresh();
      return;
    }
    gsap.to(ctaBlockRef.current, {
      autoAlpha: 0,
      y: -12,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        setOpen(true);
        ScrollTrigger.refresh();
      },
    });
  };

  return (
    <section
      id="contact"
      ref={rootRef}
      aria-labelledby="invite-heading"
      className="relative mx-auto flex min-h-[42svh] max-w-4xl flex-col items-center justify-center px-6 py-14 text-center md:py-12"
    >
      <p
        data-invite-stagger
        className="text-xs font-medium tracking-[0.28em] text-mist uppercase"
      >
        The Invitation
      </p>
      <h2
        id="invite-heading"
        data-invite-stagger
        className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink md:text-6xl"
      >
        Ready to build with Creative Code Logic?
      </h2>
      <p data-invite-stagger className="mt-8 max-w-xl leading-relaxed text-mist">
        Tell us what you&rsquo;re trying to make. Three questions, two minutes
        — and we&rsquo;ll come back with thinking, not a sales call.
      </p>

      {/* swap area — reserved height keeps the footer still across all states */}
      <div
        data-invite-stagger
        data-brief-swap
        className="mt-10 flex w-full min-h-[22rem] items-center justify-center md:min-h-[19rem]"
      >
        {open ? (
          <BriefForm />
        ) : (
          <div ref={ctaBlockRef}>
            <button
              ref={ctaRef}
              type="button"
              data-brief-open
              onClick={openBrief}
              className="cta-pulse inline-block rounded-full border border-accent bg-accent/10 px-8 py-4 font-display text-base font-medium text-accent transition-colors duration-300 hover:bg-accent hover:text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              Start your brief
            </button>
          </div>
        )}
      </div>

      <a
        data-invite-stagger
        href={CONTACT_HREF}
        className="mt-8 text-sm text-mist transition-colors duration-300 hover:text-ink"
      >
        Or just say hello →
      </a>
    </section>
  );
}
