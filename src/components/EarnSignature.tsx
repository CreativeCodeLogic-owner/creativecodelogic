import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/scroll";
import { sealStampTl } from "@/lib/seal";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const STANDARDS = [
  {
    lead: "It solves the real problem.",
    body: "Utility first – not noise, not features for their own sake.",
  },
  {
    lead: "Every detail has a reason.",
    body: "If an element, interaction, or line of code can't justify itself, it goes.",
  },
  {
    lead: "It performs.",
    body: "Speed, reliability, and polish are not finishing touches. They are the product.",
  },
  {
    lead: "It adapts.",
    body: "Built to flex across your brand, your market, and your growth.",
  },
];

const STEPS = [
  { name: "Listen", body: "We start with your problem, not our portfolio." },
  { name: "Think", body: "Structure before pixels; the logic comes first." },
  {
    name: "Build",
    body: "Designed, engineered, and tested to the standard above.",
  },
  { name: "Ship", body: "It goes live only when it earns the mark" },
];

/**
 * Chapter 4 — How we build.
 * Four standards, then the four-step process joined by a line that draws
 * itself as you scroll (horizontal on desktop, vertical on mobile).
 */
export function EarnSignature() {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-process-intro]", {
        y: 28,
        autoAlpha: 0,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 78%", once: true },
      });

      gsap.from("[data-standard]", {
        y: 32,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: "[data-standards]", start: "top 80%", once: true },
      });

      // pin the strip while the connecting line draws from 01 to 04,
      // filling each step's dot as the line reaches it, then release back
      // into the journey (one timeline drives both connector orientations
      // so only one ScrollTrigger pins)
      const drawTl = gsap.timeline({
        scrollTrigger: {
          trigger: "[data-steps]",
          start: "center center",
          end: "+=80%",
          pin: true,
          scrub: 0.4,
        },
      });
      drawTl
        .fromTo(
          "[data-connector-x]",
          { scaleX: 0 },
          { scaleX: 1, ease: "none", transformOrigin: "left center", duration: 1 },
          0,
        )
        .fromTo(
          "[data-connector-y]",
          { scaleY: 0 },
          { scaleY: 1, ease: "none", transformOrigin: "center top", duration: 1 },
          0,
        );
      gsap.utils
        .toArray<HTMLElement>("[data-step-dot]", rootRef.current)
        .forEach((dot, i, all) => {
          drawTl.to(
            dot,
            { backgroundColor: "#53D2FF", duration: 0.1, ease: "none" },
            i / (all.length - 1),
          );
        });
      // the "Ship" step stamps its seal right after its dot fills
      const markStep = gsap.utils.toArray<HTMLElement>("[data-step]").at(-1);
      const seal = markStep?.querySelector("[data-seal]");
      if (seal) drawTl.add(sealStampTl(seal), 1.05);

      gsap.from("[data-step]", {
        y: 28,
        autoAlpha: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: { trigger: "[data-steps]", start: "top 80%", once: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      id="process"
      ref={rootRef}
      aria-labelledby="process-heading"
      className="relative mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-12"
    >
      <div data-process-intro className="max-w-2xl">
        <p className="text-xs font-medium tracking-[0.28em] text-mist uppercase">
          How we build
        </p>
        <h2
          id="process-heading"
          className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink md:text-5xl"
        >
          Nothing ships until it earns the mark.
        </h2>
        <p className="mt-6 leading-relaxed text-mist">
          Every build is held to the standard we built the company on:
        </p>
      </div>

      <ul
        data-standards
        className="mt-6 grid gap-x-12 gap-y-10 md:grid-cols-2"
      >
        {STANDARDS.map((standard) => (
          <li
            key={standard.lead}
            data-standard
            className="border-t border-ink/10 pt-6"
          >
            <p className="font-display text-lg font-medium text-ink">
              {standard.lead}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              {standard.body}
            </p>
          </li>
        ))}
      </ul>

      <div data-steps className="relative mt-5 md:mt-6">
        {/* connectors — vertical on mobile, horizontal on md+ */}
        <div
          data-connector-y
          aria-hidden="true"
          className="absolute top-4 bottom-4 left-[7px] w-px bg-accent/50 md:hidden"
        />
        {/* spans first dot centre to last dot centre: dots sit at column
            left edges +7px; last column width is calc(25% - 24px) with gap-8 */}
        <div
          data-connector-x
          aria-hidden="true"
          className="absolute top-[7px] left-[7px] right-[calc(25%_-_31px)] hidden h-px bg-accent/50 md:block"
        />

        <ol className="relative grid gap-12 md:grid-cols-4 md:gap-8">
          {STEPS.map((step, i) => (
            <li key={step.name} data-step className="flex gap-5 md:block">
              <div className="flex flex-col items-center md:block">
                <span
                  data-step-dot
                  aria-hidden="true"
                  className="relative z-10 block h-[15px] w-[15px] shrink-0 rounded-full border border-accent bg-navy"
                />
              </div>
              <div className="md:mt-6">
                <p className="text-xs font-medium tracking-[0.28em] text-sand uppercase">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <h3 className="font-display text-xl font-semibold text-ink">
                    {step.name}
                  </h3>
                  {step.name === "Ship" && (
                    <span
                      data-seal
                      aria-hidden="true"
                      className="self-start font-display text-2xl leading-none text-accent"
                    >
                      *
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-mist">
                  {step.body}
                  {step.name === "Ship" && <span className="text-accent">*</span>}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
