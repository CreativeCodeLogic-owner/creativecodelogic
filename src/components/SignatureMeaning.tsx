import { useLayoutEffect, useRef, useState } from "react";
import { Triquetra } from "@/components/Triquetra";
import { WorldCreative } from "@/components/worlds/WorldCreative";
import { WorldCode } from "@/components/worlds/WorldCode";
import { WorldLogic } from "@/components/worlds/WorldLogic";
import { gsap, ScrollTrigger } from "@/lib/scroll";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * Chapter 2 — What goes into the build.
 * Three full-viewport worlds (Creative / Code / Logic), each with its own
 * ambient mechanic. The triquetra stays pinned on the left through all
 * three; the loop of the active world glows cyan, the others dim to 20%.
 */
export function SignatureMeaning() {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const [activeLoop, setActiveLoop] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-chapter-intro]", {
        y: 28,
        autoAlpha: 0,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 78%", once: true },
      });
      gsap.utils
        .toArray<HTMLElement>("[data-world]", rootRef.current)
        .forEach((el, i) => {
          ScrollTrigger.create({
            trigger: el,
            start: "top 60%",
            end: "bottom 40%",
            onToggle: (self) => {
              if (self.isActive) setActiveLoop(i);
            },
          });
        });
    }, rootRef);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={rootRef}
      aria-labelledby="meaning-heading"
      className="relative mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-10"
    >
      <div data-chapter-intro className="max-w-2xl">
        <p className="text-xs font-medium tracking-[0.28em] text-mist uppercase">
          What goes into the build
        </p>
        <h2
          id="meaning-heading"
          className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink md:text-5xl"
        >
          Three disciplines.
          <br />
          One standard.
        </h2>
        <p className="mt-6 leading-relaxed text-mist">
          Everything we ship is shaped by the same three forces. They are in
          our name because they are in our process.
        </p>
      </div>

      <div className="mt-8 grid gap-12 md:mt-8 md:grid-cols-[120px_minmax(0,1fr)] md:gap-16">
        <div>
          <div className="md:sticky md:top-40">
            <Triquetra
              activeLoop={activeLoop}
              tone="ink"
              className="h-auto w-20 md:w-28"
            />
          </div>
        </div>

        <div className="flex flex-col gap-8 md:gap-0">
          <WorldCreative />
          <WorldCode />
          <WorldLogic />
        </div>
      </div>
    </section>
  );
}
