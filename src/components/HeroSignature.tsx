import { useLayoutEffect, useRef } from "react";
import { TRIQUETRA_LOOPS, TRIQUETRA_VIEWBOX } from "@/data/triquetra";
import { gsap, scrollToId } from "@/lib/scroll";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const HERO_LINES = [
  "Built with unique creativity.",
  "Built with lightweight code.",
  "Built with solid logic.",
];
const HERO_FINAL = "Built with Creative Code Logic*";

/**
 * Chapter 1 — The Mark.
 * The triquetra draws itself loop by loop, settles with a stamp, then the
 * headline rotates through the three "Built with…" ingredients — the loop
 * matching each line glows while it shows — before resolving into the final
 * headline. Plays once on load; reduced motion shows the final state.
 */
export function HeroSignature() {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);

  useLayoutEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      const paths = pathRefs.current.filter(
        (p): p is SVGPathElement => p !== null,
      );
      paths.forEach((p) => {
        const len = p.getTotalLength();
        p.style.strokeDasharray = `${len}`;
        p.style.strokeDashoffset = `${len}`;
      });
      const lineEl = rootRef.current?.querySelector("[data-hero-line]");
      const finalEl = rootRef.current?.querySelector("[data-hero-final]");
      if (finalEl) gsap.set(finalEl, { autoAlpha: 0 });

      const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
      tl.to(paths[0], { strokeDashoffset: 0, duration: 1.2, delay: 0.3 })
        .to(paths[1], { strokeDashoffset: 0, duration: 1.2 }, "-=0.75")
        .to(paths[2], { strokeDashoffset: 0, duration: 1.2 }, "-=0.75")
        // settle: the fill arrives, the drawn stroke retires
        .to(
          paths,
          { attr: { "fill-opacity": 1 }, duration: 0.6, ease: "power2.out" },
          "-=0.2",
        )
        .to(paths, { strokeOpacity: 0, duration: 0.6 }, "<")
        // the stamp
        .fromTo(
          markRef.current,
          { scale: 1.07, rotate: -1.5 },
          { scale: 1, rotate: 0, duration: 0.55, ease: "back.out(2.4)" },
          "<",
        );

      // One rotation cycle. State model: the final headline is opacity 0
      // (but keeps its layout space) for the ENTIRE rotation — it crossfades
      // out as muted line 1 arrives and crossfades back in only at resolve,
      // so the final line never flashes between muted lines.
      const cycle = () => {
        const c = gsap.timeline();
        if (!lineEl || !finalEl) return c;
        HERO_LINES.forEach((line, i) => {
          const last = i === HERO_LINES.length - 1;
          c.call(() => {
            lineEl.textContent = line;
          });
          if (i === 0) {
            // replay boundary: final crossfades out as muted line 1 arrives
            c.to(
              finalEl,
              { autoAlpha: 0, duration: 0.4, ease: "power2.in" },
              "<",
            );
          }
          c.to(
            paths,
            { opacity: (j: number) => (j === i ? 1 : 0.2), duration: 0.4 },
            "<",
          ).fromTo(
            lineEl,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.5, ease: "power2.out" },
          );
          if (last) {
            // resolve: one simultaneous opacity crossfade, muted line 3 → final
            c.to(
              lineEl,
              { autoAlpha: 0, duration: 0.5, ease: "power2.inOut" },
              "+=1.2",
            )
              .to(
                finalEl,
                { autoAlpha: 1, duration: 0.5, ease: "power2.inOut" },
                "<",
              )
              .to(paths, { opacity: 1, duration: 0.5 }, "<");
          } else {
            c.to(
              lineEl,
              { autoAlpha: 0, duration: 0.5, ease: "power2.in" },
              "+=1.2",
            );
          }
        });
        return c;
      };

      // intro cycle (final already hidden), then reveal sub + CTAs
      tl.add(cycle());
      tl.from(
        "[data-hero-stagger]",
        {
          y: 28,
          autoAlpha: 0,
          duration: 0.85,
          stagger: 0.13,
          ease: "power3.out",
        },
        "-=0.2",
      );

      // then loop forever, holding the resolved state 4.5s between cycles
      const loopTl = gsap.timeline({ repeat: -1, repeatDelay: 4.5 });
      loopTl.add(cycle());
      tl.add(loopTl, "+=4.5");
    }, rootRef);
    return () => ctx.revert();
  }, [reduced]);

  const go = (hash: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    scrollToId(hash);
  };

  return (
    <section
      id="signature"
      ref={rootRef}
      aria-labelledby="hero-heading"
      className="relative flex min-h-svh flex-col items-center justify-center px-6 pt-20 pb-16 text-center"
    >
      <div
        ref={markRef}
        className="w-[min(62vw,290px)] md:w-[min(36vw,360px)]"
      >
        <svg
          viewBox={TRIQUETRA_VIEWBOX}
          role="img"
          aria-label="The Creative Code Logic triquetra, drawing itself"
          className="h-auto w-full overflow-visible"
        >
          {TRIQUETRA_LOOPS.map((d, i) => (
            <path
              key={i}
              ref={(el) => {
                pathRefs.current[i] = el;
              }}
              d={d}
              fill="#53D2FF"
              fillOpacity={reduced ? 1 : 0}
              stroke={reduced ? "none" : "#53D2FF"}
              strokeWidth={reduced ? 0 : 3}
              strokeLinejoin="round"
            />
          ))}
        </svg>
      </div>

      <h1
        id="hero-heading"
        className="relative mt-5 font-display text-5xl leading-[1.15] font-semibold tracking-tight text-ink md:mt-7 md:text-7xl"
      >
        {/* invisible sizer: the longest line sets the fixed stage height */}
        <span aria-hidden="true" className="invisible block">
          {HERO_FINAL}
        </span>
        {/* both states share this identical box, centred — no y-shift */}
        <span
          data-hero-final
          className="absolute inset-0 flex items-center justify-center"
        >
          <span>
            Built with Creative Code Logic
            <span className="align-super text-[0.5em] text-accent">*</span>
          </span>
        </span>
        {!reduced && (
          <span
            data-hero-line
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center bg-navy text-mist opacity-0"
          >
            {HERO_LINES[0]}
          </span>
        )}
      </h1>

      <p
        data-hero-stagger
        className="mt-6 max-w-xl text-base leading-relaxed text-mist md:text-lg"
      >
        *Designed to solve. Built to perform.
      </p>

      <div
        data-hero-stagger
        className="mt-10 flex flex-col items-center gap-5 sm:flex-row"
      >
        <a
          href="#process"
          onClick={go("#process")}
          className="rounded-full border border-accent/50 px-6 py-3 text-sm font-medium text-accent transition-colors duration-300 hover:bg-accent hover:text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          See how we build ↓
        </a>
        <a
          href="#contact"
          onClick={go("#contact")}
          className="rounded-md text-sm text-mist transition-colors duration-300 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          Start a project
        </a>
      </div>
    </section>
  );
}
