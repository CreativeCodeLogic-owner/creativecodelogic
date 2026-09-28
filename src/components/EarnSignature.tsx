import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/scroll";
import { sealStampTl } from "@/lib/seal";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const ACCENT = "#53D2FF";
const MIST = "#A9A6A7";
const NAV_H = 64; // fixed nav height; the frame pin starts just under it

type PinMode = "frame" | "strip" | "scrub";

type Pillar = { id: "solve" | "last"; label: string; line: string; span: 2 | 3; firstStep: number };

// The two halves of the slogan, each spanning its steps (01–02, 03–05).
const PILLARS: Pillar[] = [
  {
    id: "solve",
    label: "Designed to Solve",
    line: "We start from your problem, not a template. Every screen, feature and line of code has to earn its place.",
    span: 2,
    firstStep: 0,
  },
  {
    id: "last",
    label: "Built to Last",
    line: "Fast, reliable, tested work, documented and ready to grow with you.",
    span: 3,
    firstStep: 2,
  },
];

const STEPS = [
  { name: "Listen", body: "We sit with you to understand your business and what you need." },
  { name: "Think", body: "We research, find the best route and send you a clear, phased proposal." },
  { name: "Build", body: "Brick by brick, phase by phase, with your approval at every step." },
  { name: "Ship", body: "It goes live only when it’s tested, approved and ready." },
  { name: "Care", body: "We watch how it performs and keep tuning it." },
];

// timeline positions: the line runs 0 → 1; dot i fills at i / (n - 1)
const dotAt = (i: number) => i / (STEPS.length - 1);

function PillarBlock({ pillar, reduced, className = "" }: { pillar: Pillar; reduced: boolean; className?: string }) {
  return (
    <div data-pillar={pillar.id} className={className}>
      <p
        data-pillar-label
        className={`text-xs font-medium tracking-[0.28em] uppercase ${reduced ? "text-accent" : "text-mist"}`}
      >
        {pillar.label}
      </p>
      <div aria-hidden="true" className="mt-3 h-px bg-accent/30" />
      <p className="mt-3 max-w-md text-sm leading-relaxed text-mist">{pillar.line}</p>
    </div>
  );
}

/**
 * Chapter 4 — How we build.
 * The client process in five steps (Listen, Think, Build, Ship, Care), grouped
 * under the slogan's two pillars: Designed to Solve (01–02) and Built to Last
 * (03–05). One pinned scrub draws the connector 01 → 05, fills each dot as the
 * line reaches it, brightens each pillar as the line enters its group, stamps
 * the Ship seal (the signature going on at ship), and hands over to a slow
 * breathing pulse on Care ("still watching") while the section is on screen.
 * Reduced motion: every dot filled, both pillars lit, the seal static, no pulse.
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

      gsap.from("[data-step]", {
        y: 28,
        autoAlpha: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: { trigger: "[data-steps]", start: "top 80%", once: true },
      });

      // Three modes (matchMedia rebuilds on breakpoint changes):
      //  - frame (md+, tall enough): the WHOLE chapter pins as one slide-like
      //    frame, its top just under the 64px nav, while the line draws;
      //  - strip (md+, short screens): only the strip pins (the chapter would
      //    not fit under the nav);
      //  - scrub (below md): the vertical strip is taller than a phone, so the
      //    same timeline scrubs as it scrolls through, no pin.
      const mm = gsap.matchMedia(rootRef.current ?? undefined);
      mm.add(
        {
          frame: "(min-width: 768px) and (min-height: 680px)",
          strip: "(min-width: 768px) and (max-height: 679.98px)",
          scrub: "(max-width: 767.98px)",
        },
        (mq) => {
          const root = rootRef.current;
          let mode: PinMode = mq.conditions?.frame ? "frame" : mq.conditions?.strip ? "strip" : "scrub";
          // guard: the frame must fit under the nav with room to spare
          if (mode === "frame" && root && root.offsetHeight > window.innerHeight - NAV_H - 24) mode = "strip";
          if (root) root.dataset.pinMode = mode;
          buildTimeline(mode);
          return () => {
            if (root) delete root.dataset.pinMode;
          };
        },
      );
    }, rootRef);
    return () => ctx.revert();

    function buildTimeline(mode: PinMode) {
      // Care's breathing pulse: runs only once the line has reached 05 AND the
      // section is on screen, so nothing animates off-screen.
      const pulse = gsap.to("[data-care-pulse]", {
        keyframes: { opacity: [0, 0.35, 0], scale: [1, 1.7, 2.2] },
        duration: 2.4,
        ease: "sine.inOut",
        repeat: -1,
        paused: true,
      });
      let reachedEnd = false;
      let onScreen = false;
      const syncPulse = () => {
        if (reachedEnd && onScreen) pulse.play();
        else pulse.pause(0);
      };

      // one timeline drives both connector orientations, so only one trigger
      // exists (and on md+ only one pins the strip: pillars + steps)
      const drawTl = gsap.timeline({
        scrollTrigger:
          mode === "frame"
            ? {
                trigger: rootRef.current,
                start: `top ${NAV_H}px`,
                end: "+=100%",
                pin: true,
                scrub: 0.4,
              }
            : mode === "strip"
              ? {
                  trigger: "[data-process-strip]",
                  start: "center center",
                  end: "+=100%",
                  pin: true,
                  scrub: 0.4,
                }
              : {
                  trigger: "[data-steps]",
                  start: "top 75%",
                  end: "bottom 55%",
                  scrub: 0.4,
                },
        onUpdate: () => {
          const atEnd = drawTl.time() >= 0.999;
          if (atEnd !== reachedEnd) {
            reachedEnd = atEnd;
            syncPulse();
          }
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
      gsap.utils.toArray<HTMLElement>("[data-step-dot]", rootRef.current).forEach((dot, i) => {
        drawTl.fromTo(
          dot,
          { backgroundColor: "#091220" },
          { backgroundColor: ACCENT, duration: 0.1, ease: "none" },
          dotAt(i),
        );
      });
      // each pillar brightens as the line enters its group (Designed at 0)
      for (const p of PILLARS) {
        drawTl.fromTo(
          `[data-pillar="${p.id}"] [data-pillar-label]`,
          { color: MIST },
          { color: ACCENT, duration: 0.1, ease: "none" },
          dotAt(p.firstStep),
        );
      }
      // the Ship step stamps its seal right after its dot fills
      const seal = rootRef.current?.querySelector("[data-step] [data-seal]");
      const shipIndex = STEPS.findIndex((s) => s.name === "Ship");
      if (seal) drawTl.add(sealStampTl(seal), dotAt(shipIndex) + 0.03);

      // "on screen" = the chapter's footprint in the flow. When the whole
      // chapter pins (frame mode) that footprint is its .pin-spacer, which also
      // covers the pinned distance; the section's own box would end mid-pin.
      const section = rootRef.current;
      const spacer = section?.parentElement;
      ScrollTrigger.create({
        trigger: spacer?.classList.contains("pin-spacer") ? spacer : section,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          onScreen = self.isActive;
          syncPulse();
        },
      });
    }
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
          From first conversation to long after launch.
        </h2>
      </div>

      <div data-process-strip className="mt-10 md:mt-12">
        {/* pillars — desktop: one row on the same 5-column grid as the steps,
            so each label and rule spans exactly its columns */}
        <div className="hidden md:grid md:grid-cols-5 md:gap-8">
          {PILLARS.map((p) => (
            <PillarBlock
              key={p.id}
              pillar={p}
              reduced={reduced}
              className={p.span === 2 ? "md:col-span-2" : "md:col-span-3"}
            />
          ))}
        </div>
        {/* mobile: the first pillar heads the timeline (the second sits in
            step 03); indented to the step text so the connector stays clear */}
        <PillarBlock pillar={PILLARS[0]} reduced={reduced} className="mb-8 pl-[35px] md:hidden" />

        <div data-steps className="relative md:mt-10">
          {/* connectors — vertical on mobile, horizontal on md+ */}
          <div
            data-connector-y
            aria-hidden="true"
            className="absolute top-2 bottom-4 left-[7px] w-px bg-accent/50 md:hidden"
          />
          {/* spans dot 01 centre to dot 05 centre: dots sit at column left
              edges +7px; each of 5 columns is calc(20% - 25.6px) with gap-8,
              so the right offset is that width minus 7px */}
          <div
            data-connector-x
            aria-hidden="true"
            className="absolute top-[7px] left-[7px] right-[calc(20%_-_32.6px)] hidden h-px bg-accent/50 md:block"
          />

          <ol className="relative grid gap-10 md:grid-cols-5 md:gap-8">
            {STEPS.map((step, i) => {
              const mobilePillar = PILLARS.find((p) => p.firstStep === i && i > 0);
              return (
                <li key={step.name} data-step>
                  {mobilePillar && (
                    <PillarBlock
                      pillar={mobilePillar}
                      reduced={reduced}
                      className="mb-8 pl-[35px] md:hidden"
                    />
                  )}
                  <div className="flex gap-5 md:block">
                    <div className="flex flex-col items-center md:block">
                      <span className="relative block h-[15px] w-[15px] shrink-0">
                        {step.name === "Care" && !reduced && (
                          <span
                            data-care-pulse
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 rounded-full bg-accent opacity-0"
                          />
                        )}
                        <span
                          data-step-dot
                          aria-hidden="true"
                          className={`relative z-10 block h-[15px] w-[15px] rounded-full border border-accent ${reduced ? "bg-accent" : "bg-navy"}`}
                        />
                      </span>
                    </div>
                    <div className="md:mt-6">
                      <p className="text-xs font-medium tracking-[0.28em] text-sand uppercase">
                        {String(i + 1).padStart(2, "0")}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <h3 className="font-display text-xl font-semibold text-ink">{step.name}</h3>
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
                      <p className="mt-2 text-sm leading-relaxed text-mist">{step.body}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
