import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/scroll";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useMagnetic } from "@/hooks/useMagnetic";

// Placeholder destination until the brief-builder ships.
const CONTACT_HREF = "mailto:hello@creativecodelogic.com";

/**
 * Chapter 5 — The Invitation.
 * Large-type closer with the pulsing brief CTA.
 */
export function Invitation() {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const ctaRef = useMagnetic<HTMLAnchorElement>(6, 60);

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
      <p
        data-invite-stagger
        className="mt-8 max-w-xl leading-relaxed text-mist"
      >
        Tell us what you&rsquo;re trying to make. Three questions, two minutes
        — and we&rsquo;ll come back with thinking, not a sales call.
      </p>
      <div data-invite-stagger className="mt-12">
        <a
          ref={ctaRef}
          href={CONTACT_HREF}
          className="cta-pulse inline-block rounded-full border border-accent bg-accent/10 px-8 py-4 font-display text-base font-medium text-accent transition-colors duration-300 hover:bg-accent hover:text-navy"
        >
          Start your brief
        </a>
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
