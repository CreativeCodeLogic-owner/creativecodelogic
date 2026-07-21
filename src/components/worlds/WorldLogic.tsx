import { useLayoutEffect, useMemo, useRef } from "react";
import { TRIQUETRA_LOOPS, TRIQUETRA_VIEWBOX } from "@/data/triquetra";
import { gsap } from "@/lib/scroll";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

// The mark reads as a technical drawing: faint construction geometry that the
// three loops trace over, then a low fill so it stays a "drawing", not a solid.
const GUIDE_DRAW_OPACITY = 0.35;
const GUIDE_RESOLVED_OPACITY = 0.14; // ~40% of the draw opacity
const LOOP_FILL_OPACITY = 0.12;
const TICK_OPACITY = 0.3;
const DRAG_CLAMP = 40; // px, any direction
const VIEW = 512; // TRIQUETRA_VIEWBOX is "0 0 512 512"

type Guide = { cx: number; cy: number; r: number };
type Tick = { x1: number; y1: number; x2: number; y2: number };

/**
 * Approximate each loop's bounding circle from its path (centroid + average
 * radius), the composition centre from the loop centroids, and a few tick
 * marks along the centre lines. Sampled once at mount — pure geometry, no text.
 */
function buildGeometry(): { guides: Guide[]; center: { x: number; y: number }; ticks: Tick[] } {
  const sampler = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const guides = TRIQUETRA_LOOPS.map<Guide>((d) => {
    sampler.setAttribute("d", d);
    const len = sampler.getTotalLength();
    const steps = Math.max(64, Math.round(len / 6));
    let sx = 0;
    let sy = 0;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const p = sampler.getPointAtLength((i / steps) * len);
      pts.push({ x: p.x, y: p.y });
      sx += p.x;
      sy += p.y;
    }
    const cx = sx / pts.length;
    const cy = sy / pts.length;
    let r = 0;
    for (const p of pts) r += Math.hypot(p.x - cx, p.y - cy);
    return { cx, cy, r: r / pts.length };
  });
  const center = {
    x: guides.reduce((a, g) => a + g.cx, 0) / guides.length,
    y: guides.reduce((a, g) => a + g.cy, 0) / guides.length,
  };
  const ticks: Tick[] = [];
  for (const d of [60, 120, 180]) {
    // vertical ticks along the horizontal centre line
    ticks.push({ x1: center.x - d, y1: center.y - 6, x2: center.x - d, y2: center.y + 6 });
    ticks.push({ x1: center.x + d, y1: center.y - 6, x2: center.x + d, y2: center.y + 6 });
    // horizontal ticks along the vertical centre line
    ticks.push({ x1: center.x - 6, y1: center.y - d, x2: center.x + 6, y2: center.y - d });
    ticks.push({ x1: center.x - 6, y1: center.y + d, x2: center.x + 6, y2: center.y + d });
  }
  return { guides, center, ticks };
}

/**
 * World C — Logic: "The Blueprint". A blueprint grid fades in, dashed
 * construction guides (three loop circles + centre crosshair) draw over it,
 * then the three triquetra loops trace in sequence and settle with a low fill
 * as the guides fade back and tick marks appear. Scrubbed and reversible.
 * Once assembled, each loop can be dragged and springs back — the "solid"
 * proof. Reduced motion: the resolved drawing, statically.
 */
export function WorldLogic() {
  const reduced = usePrefersReducedMotion();
  const panelRef = useRef<HTMLElement>(null);
  const assembled = useRef(false);
  const { guides, center, ticks } = useMemo(buildGeometry, []);

  useLayoutEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-world-copy]", {
        y: 36,
        autoAlpha: 0,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: { trigger: panelRef.current, start: "top 78%", once: true },
      });

      const guideEls = gsap.utils.toArray<SVGGeometryElement>(
        "[data-guide]",
        panelRef.current,
      );
      const loopEls = gsap.utils.toArray<SVGPathElement>(
        "[data-loop]",
        panelRef.current,
      );

      // hidden start state (useLayoutEffect → set before paint, no flash)
      gsap.set("[data-blueprint]", { opacity: 0 });
      gsap.set("[data-tick]", { opacity: 0 });
      guideEls.forEach((el) => gsap.set(el, { strokeDashoffset: 18, strokeOpacity: 0 }));
      loopEls.forEach((el) => {
        const len = el.getTotalLength();
        el.style.strokeDasharray = `${len}`;
        gsap.set(el, { strokeDashoffset: len, attr: { "fill-opacity": 0 } });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "[data-stage]",
          start: "top 78%",
          end: "center 45%",
          scrub: 0.5,
          onUpdate: (self) => {
            const on = self.progress >= 0.98;
            if (on !== assembled.current) {
              assembled.current = on;
              loopEls.forEach((el) => el.classList.toggle("cursor-grab", on));
            }
          },
        },
      });

      // 1. blueprint grid
      tl.to("[data-blueprint]", { opacity: 1, duration: 0.15, ease: "none" }, 0);
      // 2. construction guides draw in, staggered
      guideEls.forEach((el, i) => {
        tl.to(
          el,
          {
            strokeDashoffset: 0,
            strokeOpacity: GUIDE_DRAW_OPACITY,
            duration: 0.25,
            ease: "power1.out",
          },
          0.1 + i * 0.04,
        );
      });
      // 3. loops trace over the guides, in sequence, slightly overlapping
      loopEls.forEach((el, i) => {
        tl.to(
          el,
          { strokeDashoffset: 0, duration: 0.2, ease: "power1.inOut" },
          0.42 + i * 0.12,
        );
      });
      // 4. resolve: fills whisper in, guides fade back, ticks appear
      loopEls.forEach((el) => {
        tl.to(
          el,
          { attr: { "fill-opacity": LOOP_FILL_OPACITY }, duration: 0.2, ease: "power2.out" },
          0.8,
        );
      });
      guideEls.forEach((el) => {
        tl.to(
          el,
          { strokeOpacity: GUIDE_RESOLVED_OPACITY, duration: 0.2, ease: "power2.out" },
          0.82,
        );
      });
      tl.to("[data-tick]", { opacity: TICK_OPACITY, duration: 0.2, ease: "power2.out" }, 0.84);

      // interaction: once assembled, drag a loop out of place; it springs back
      let drag: { el: SVGPathElement; startX: number; startY: number } | null = null;
      const clamp = (v: number) => Math.max(-DRAG_CLAMP, Math.min(DRAG_CLAMP, v));

      const onDown = (el: SVGPathElement) => (e: PointerEvent) => {
        if (!assembled.current) return;
        gsap.killTweensOf(el, "x,y"); // stop an in-flight spring, keep timeline tweens
        drag = { el, startX: e.clientX, startY: e.clientY };
        el.setPointerCapture(e.pointerId);
        el.classList.add("cursor-grabbing");
        e.preventDefault();
      };
      const onMove = (e: PointerEvent) => {
        if (!drag) return;
        gsap.set(drag.el, {
          x: clamp(e.clientX - drag.startX),
          y: clamp(e.clientY - drag.startY),
        });
      };
      const onUp = () => {
        if (!drag) return;
        drag.el.classList.remove("cursor-grabbing");
        gsap.to(drag.el, { x: 0, y: 0, duration: 0.4, ease: "back.out(1.7)" });
        drag = null;
      };

      const removers: (() => void)[] = [];
      loopEls.forEach((el) => {
        el.style.touchAction = "pan-y";
        const down = onDown(el);
        el.addEventListener("pointerdown", down);
        removers.push(() => el.removeEventListener("pointerdown", down));
      });
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", onUp);
      removers.push(() => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      });
      return () => removers.forEach((fn) => fn());
    }, panelRef);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <article
      ref={panelRef}
      data-world={2}
      aria-labelledby="pillar-logic"
      className="relative overflow-hidden py-20 md:flex md:min-h-[60svh] md:flex-col md:justify-center md:py-0"
    >
      <div className="relative z-10 max-w-lg" data-world-copy>
        <p className="text-xs font-medium tracking-[0.28em] text-sand uppercase">
          03
        </p>
        <h3
          id="pillar-logic"
          className="mt-3 font-display text-2xl font-semibold text-ink md:text-4xl"
        >
          Logic
        </h3>
        <p className="mt-2 text-lg text-ink/90 md:text-xl">
          Built with solid logic.
        </p>
        <p className="mt-4 leading-relaxed text-mist">
          Structure, usability, and practical thinking. We build what solves
          the problem — not what pads the demo.
        </p>
      </div>

      <div
        data-stage
        aria-hidden="true"
        className="relative mt-14 h-[380px] w-full select-none md:h-[420px]"
      >
        {/* blueprint grid — fades in with the scrub, static when reduced */}
        <div
          data-blueprint
          className="blueprint absolute -inset-4"
          style={{ opacity: reduced ? 1 : 0 }}
        />
        <svg
          viewBox={TRIQUETRA_VIEWBOX}
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          {/* construction guides: loop circles + centre crosshair */}
          <g>
            {guides.map((g, i) => (
              <circle
                key={`c${i}`}
                data-guide
                cx={g.cx}
                cy={g.cy}
                r={g.r}
                fill="none"
                stroke="#57D3FE"
                strokeWidth={1.2}
                strokeDasharray="5 5"
                strokeOpacity={reduced ? GUIDE_RESOLVED_OPACITY : 0}
              />
            ))}
            <line
              data-guide
              x1={0}
              y1={center.y}
              x2={VIEW}
              y2={center.y}
              stroke="#57D3FE"
              strokeWidth={1.2}
              strokeDasharray="5 5"
              strokeOpacity={reduced ? GUIDE_RESOLVED_OPACITY : 0}
            />
            <line
              data-guide
              x1={center.x}
              y1={0}
              x2={center.x}
              y2={VIEW}
              stroke="#57D3FE"
              strokeWidth={1.2}
              strokeDasharray="5 5"
              strokeOpacity={reduced ? GUIDE_RESOLVED_OPACITY : 0}
            />
          </g>

          {/* tick marks along the centre lines */}
          <g>
            {ticks.map((t, i) => (
              <line
                key={`t${i}`}
                data-tick
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke="#57D3FE"
                strokeWidth={1}
                strokeOpacity={0.9}
                opacity={reduced ? TICK_OPACITY : 0}
              />
            ))}
          </g>

          {/* the mark: three loops trace over the guides, then fill low */}
          {TRIQUETRA_LOOPS.map((d, i) => (
            <path
              key={`l${i}`}
              data-loop
              d={d}
              fill="#57D3FE"
              fillOpacity={reduced ? LOOP_FILL_OPACITY : 0}
              stroke="#57D3FE"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          ))}
        </svg>
      </div>
    </article>
  );
}
