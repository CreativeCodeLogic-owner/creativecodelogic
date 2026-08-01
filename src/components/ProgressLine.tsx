import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/scroll";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const CAP = 5; // px — tip dot size
const WIDE = 6; // px — track width; the line tapers boldly from this to 1px

/**
 * The journey line — a cyan rule glued to the left edge, drawn by scroll. A
 * fixed square caps the top; a small dot rides the growing tip (an echo of the
 * blueprint plotter head). The line tapers from a bold 6px near the top to 1px
 * as progress approaches 1. Sits above the nav (z-55, below the z-60 modals) so
 * it draws over the header. Reduced motion: static full-height thin line + caps.
 */
export function ProgressLine() {
  const reduced = usePrefersReducedMotion();
  const lineRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (reduced) return;
    const line = lineRef.current;
    const tip = tipRef.current;
    if (!line || !tip) return;
    const ctx = gsap.context(() => {
      // one scrubbed timeline off the whole-page scroll drives all three:
      // the draw (scaleY), the taper (scaleX), and the riding tip (translateY)
      gsap.set(line, { transformOrigin: "top left", scaleY: 0, scaleX: 1 });
      gsap.set(tip, { y: 0 });
      const tl = gsap.timeline({
        scrollTrigger: { start: 0, end: "max", scrub: 0.3, invalidateOnRefresh: true },
      });
      tl.to(line, { scaleY: 1, scaleX: 1 / WIDE, ease: "none" }, 0).to(
        tip,
        { y: () => window.innerHeight - CAP, ease: "none" },
        0,
      );
    });
    return () => ctx.revert();
  }, [reduced]);

  return (
    <div
      data-progress
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[55] h-full w-[6px]"
    >
      {/* the drawn rule — scaleY draws it, scaleX tapers it (origin top-left) */}
      <div
        ref={lineRef}
        data-progress-line
        className="h-full w-full origin-top-left bg-accent/70"
        style={reduced ? { transform: "scaleY(1) scaleX(0.1667)" } : undefined}
      />
      {/* fixed cap at the top of the track — matches the bold start weight */}
      <span
        data-progress-cap
        className="absolute top-0 left-0 h-[6px] w-[6px] bg-accent"
      />
      {/* dot riding the drawn tip; rests at the track bottom at 100% */}
      <span
        ref={tipRef}
        data-progress-tip
        className="absolute top-0 left-0 h-[5px] w-[5px] rounded-full bg-accent shadow-[0_0_6px_rgba(83,210,255,0.7)]"
        style={reduced ? { transform: "translateY(calc(100vh - 5px))" } : undefined}
      />
    </div>
  );
}
