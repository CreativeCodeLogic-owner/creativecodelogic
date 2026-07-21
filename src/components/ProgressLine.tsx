import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/scroll";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * The journey line — a thin cyan rule down the page edge, drawn by scroll.
 * Purely decorative; omitted entirely under prefers-reduced-motion.
 */
export function ProgressLine() {
  const reduced = usePrefersReducedMotion();
  const lineRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (reduced || !lineRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          transformOrigin: "top center",
          scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
        },
      );
    });
    return () => ctx.revert();
  }, [reduced]);

  if (reduced) return null;

  return (
    <div
      ref={lineRef}
      aria-hidden="true"
      className="fixed top-0 left-3 z-40 h-full w-px bg-accent/70 md:left-8"
    />
  );
}
