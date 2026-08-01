import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, ScrollTrigger } from "@/lib/scroll";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useMagnetic } from "@/hooks/useMagnetic";
import { BriefForm, EMPTY_BRIEF, type BriefData } from "@/components/BriefForm";
import { HelloDrawer } from "@/components/HelloDrawer";

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
  const briefWrapRef = useRef<HTMLDivElement>(null);
  const helloTriggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [helloOpen, setHelloOpen] = useState(false);
  // the brief's data lives here so it survives close/reopen (see BriefForm)
  const [brief, setBrief] = useState<BriefData>(EMPTY_BRIEF);

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

  // close the brief; state is preserved unless reset (from the success state).
  const justClosedRef = useRef(false);
  const closeBrief = ({ reset }: { reset: boolean }) => {
    const finish = () => {
      justClosedRef.current = true;
      setOpen(false);
      if (reset) setBrief(EMPTY_BRIEF);
    };
    if (reduced || !briefWrapRef.current) {
      finish();
      return;
    }
    gsap.to(briefWrapRef.current, {
      autoAlpha: 0,
      y: -12,
      duration: 0.3,
      ease: "power2.in",
      onComplete: finish,
    });
  };

  // after the brief closes: fade the CTA back in + return focus to it. Runs
  // post-commit so the freshly-mounted CTA node/ref actually exists.
  useLayoutEffect(() => {
    if (open || !justClosedRef.current) return;
    justClosedRef.current = false;
    if (!reduced && ctaBlockRef.current) {
      // opacity, NOT autoAlpha — autoAlpha's visibility:hidden from-state would
      // make the focus() below no-op (same trap as the brief step reveal)
      gsap.fromTo(
        ctaBlockRef.current,
        { opacity: 0, y: -12 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
      );
    }
    ctaBlockRef.current?.querySelector<HTMLButtonElement>("[data-brief-open]")?.focus();
    ScrollTrigger.refresh();
  }, [open, reduced]);

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
        Ready to build with
        <br />
        Creative Code Logic
        <span className="align-super text-[0.5em] text-accent">*</span>?
      </h2>
      <p data-invite-stagger className="mt-8 max-w-xl leading-relaxed text-mist">
        Tell us what you&rsquo;re trying to make. Three questions, two minutes
        &ndash; and we&rsquo;ll come back with thinking, not a sales call.
      </p>

      {/* swap area — reserved height keeps the footer still across all states */}
      <div
        data-invite-stagger
        data-brief-swap
        className="mt-10 flex w-full min-h-[22rem] items-center justify-center md:min-h-[19rem]"
      >
        {open ? (
          // distinct key from the CTA div below: same-position <div>s would be
          // reused by React, and the CTA's fade-out gsap styles (autoAlpha 0)
          // would carry over and leave the brief invisible/unclickable
          <div key="brief" ref={briefWrapRef} className="w-full">
            <BriefForm
              data={brief}
              onData={(patch) => setBrief((b) => ({ ...b, ...patch }))}
              onClose={closeBrief}
            />
          </div>
        ) : (
          <div key="cta" ref={ctaBlockRef}>
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

      <button
        ref={helloTriggerRef}
        type="button"
        data-hello-open
        data-invite-stagger
        onClick={() => setHelloOpen(true)}
        className="mt-8 text-sm text-mist transition-colors duration-300 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        Or just say hello →
      </button>

      {helloOpen &&
        createPortal(
          <HelloDrawer
            onClose={() => {
              setHelloOpen(false);
              helloTriggerRef.current?.focus();
            }}
          />,
          document.body,
        )}
    </section>
  );
}
