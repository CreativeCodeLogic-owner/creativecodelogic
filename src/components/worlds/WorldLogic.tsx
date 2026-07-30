import { useLayoutEffect, useMemo, useRef } from "react";
import { TRIQUETRA_LOOPS, TRIQUETRA_VIEWBOX, VB_W, VB_H } from "@/data/triquetra";
import { TRIQUETRA_BUILD_CIRCLES, BUILD_CENTER } from "@/data/triquetraBuild";
import { gsap } from "@/lib/scroll";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

// The mark reads as a technical drawing: faint construction geometry that the
// three loops trace over, then a low fill so it stays a "drawing", not a solid.
const GUIDE_DRAW_OPACITY = 0.35;
const GUIDE_RESOLVED_OPACITY = 0.14; // ~40% of the draw opacity
const LOOP_FILL_OPACITY = 0.12;
const TICK_OPACITY = 0.3;
const REG_OPACITY = 0.25;
const DRAG_CLAMP = 40; // px, any direction
const PLOTTER_COLOR = "#D2F2FF"; // same bright tint as the comet head

// trace-phase schedule (timeline units): loop i draws over [start, start+dur]
const LOOP_START = 0.42;
const LOOP_GAP = 0.12;
const LOOP_DUR = 0.2;
const loopStart = (i: number) => LOOP_START + i * LOOP_GAP;

type Guide = { cx: number; cy: number; r: number };
type Line = { x1: number; y1: number; x2: number; y2: number };
type Label = { x: number; y: number; text: string; anchor?: "start" | "middle" | "end"; micro?: boolean };

/**
 * Built once at mount — pure geometry, no data:
 *  - guides: the REAL construction circles from the designer's build sheet
 *    (src/data/triquetraBuild.ts), already aligned to the mark's coordinates.
 *  - center: the composition centre (the build sheet's centre circle).
 *  - loop centroids (sampled) only pick which real circle each loop's R/C label
 *    and lock-pulse attach to; the mark bbox drives the dimension lines.
 *  - ticks / dimLines / leaders / arcPath / labels: drafting notation.
 */
function buildGeometry() {
  const sampler = document.createElementNS("http://www.w3.org/2000/svg", "path");
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // sample each loop for its centroid + accumulate the mark's real bbox
  const loopCentroids = TRIQUETRA_LOOPS.map((d) => {
    sampler.setAttribute("d", d);
    const len = sampler.getTotalLength();
    const steps = Math.max(64, Math.round(len / 6));
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (let i = 0; i <= steps; i++) {
      const p = sampler.getPointAtLength((i / steps) * len);
      sx += p.x;
      sy += p.y;
      n++;
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    return { x: sx / n, y: sy / n };
  });

  const guides: Guide[] = TRIQUETRA_BUILD_CIRCLES;
  const center = { x: BUILD_CENTER.x, y: BUILD_CENTER.y };

  // pick the real circle (of a given radius class) nearest each loop centroid —
  // these carry the R-leaders, C-legends, and lock pulses
  const nearestOfRadius = (c: { x: number; y: number }, r: number) => {
    let best = -1;
    let bd = Infinity;
    guides.forEach((g, i) => {
      if (Math.abs(g.r - r) > 1) return;
      const d = Math.hypot(g.cx - c.x, g.cy - c.y);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  };
  const lockCircleIdx = loopCentroids.map((c) => nearestOfRadius(c, 106.17)); // large
  const mediumIdx = loopCentroids.map((c) => nearestOfRadius(c, 63.39)); // medium

  // --- true axes: ticks every 48 units along both centre lines to the edges
  const ticks: Line[] = [];
  const STEP = 48;
  for (let x = center.x % STEP; x <= VB_W; x += STEP) {
    ticks.push({ x1: x, y1: center.y - 5, x2: x, y2: center.y + 5 });
  }
  for (let y = center.y % STEP; y <= VB_H; y += STEP) {
    ticks.push({ x1: center.x - 5, y1: y, x2: center.x + 5, y2: y });
  }

  // --- dimension lines (drafting style: line + short perpendicular end ticks)
  const PAD = 26;
  const hY = maxY + PAD; // horizontal dim line, under the mark
  const vX = minX - PAD; // vertical dim line, left of the mark
  const dimLines: Line[] = [
    { x1: minX, y1: hY, x2: maxX, y2: hY },
    { x1: minX, y1: hY - 5, x2: minX, y2: hY + 5 },
    { x1: maxX, y1: hY - 5, x2: maxX, y2: hY + 5 },
    { x1: vX, y1: minY, x2: vX, y2: maxY },
    { x1: vX - 5, y1: minY, x2: vX + 5, y2: minY },
    { x1: vX - 5, y1: maxY, x2: vX + 5, y2: maxY },
  ];

  // --- radius leaders on the loop-primary large circles, radially outward from
  // the composition centre so labels land clear of the mark
  const angleOut = (g: Guide) => Math.atan2(g.cy - center.y, g.cx - center.x);
  const leaders = lockCircleIdx.map<Line>((idx) => {
    const g = guides[idx];
    const a = angleOut(g);
    return { x1: g.cx, y1: g.cy, x2: g.cx + g.r * Math.cos(a), y2: g.cy + g.r * Math.sin(a) };
  });

  // --- 120° arc between loop axes, near the centre
  const ar = 34;
  const a1 = -Math.PI / 2;
  const a2 = a1 + (2 * Math.PI) / 3;
  const arcPath = `M ${center.x + ar * Math.cos(a1)} ${center.y + ar * Math.sin(a1)} A ${ar} ${ar} 0 0 1 ${center.x + ar * Math.cos(a2)} ${center.y + ar * Math.sin(a2)}`;
  const am = (a1 + a2) / 2;

  // --- labels: real sheet dimensions (truthful, replaces "1:1"), the 120° note,
  // R1–R3 radius leaders (large circles) and C1–C3 circle legends (medium circles)
  const labels: Label[] = [
    { x: (minX + maxX) / 2, y: hY + 14, text: `${Math.floor(VB_W)} × ${Math.floor(VB_H)}`, anchor: "middle" },
    { x: center.x + (ar + 30) * Math.cos(am), y: center.y + (ar + 30) * Math.sin(am), text: "120°", anchor: "middle" },
  ];
  lockCircleIdx.forEach((idx, i) => {
    const g = guides[idx];
    const a = angleOut(g);
    labels.push({
      x: g.cx + (g.r + 26) * Math.cos(a),
      y: g.cy + (g.r + 26) * Math.sin(a),
      text: `R${i + 1}`,
      anchor: Math.cos(a) < -0.3 ? "end" : "start",
    });
  });
  mediumIdx.forEach((idx, i) => {
    const g = guides[idx];
    const a = angleOut(g);
    labels.push({
      x: g.cx + (g.r + 12) * Math.cos(a),
      y: g.cy + (g.r + 12) * Math.sin(a),
      text: `C${i + 1}`,
      anchor: Math.cos(a) < -0.3 ? "end" : "start",
      micro: true,
    });
  });

  // --- registration marks: just inside the sheet corners
  const REG = 16;
  const regmarks = [
    { x: REG, y: REG },
    { x: VB_W - REG, y: REG },
    { x: REG, y: VB_H - REG },
    { x: VB_W - REG, y: VB_H - REG },
  ];

  return { guides, center, ticks, dimLines, leaders, arcPath, labels, regmarks, lockCircleIdx };
}

/**
 * World C — Logic: "The Blueprint". A blueprint grid + registration marks fade
 * in, dashed construction guides draw over them, the three triquetra loops
 * trace in sequence (a plotter head riding each tip), each loop "locks" with a
 * guide-circle pulse as it completes, then the mark fills low while a drafting
 * dimension/annotation layer resolves. Scrubbed and reversible. Once assembled,
 * each loop can be dragged and springs back. Reduced motion: the resolved
 * drawing (dims, labels, regmarks included), statically — no plotter, no pulses.
 */
export function WorldLogic() {
  const reduced = usePrefersReducedMotion();
  const panelRef = useRef<HTMLElement>(null);
  const assembled = useRef(false);
  const geo = useMemo(buildGeometry, []);
  const { guides, center, ticks, dimLines, leaders, arcPath, labels, regmarks, lockCircleIdx } = geo;

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

      const root = panelRef.current;
      const guideEls = gsap.utils.toArray<SVGGeometryElement>("[data-guide]", root);
      const guideCircles = gsap.utils.toArray<SVGCircleElement>("circle[data-guide]", root);
      const guideLines = gsap.utils.toArray<SVGLineElement>("line[data-guide]", root);
      const loopEls = gsap.utils.toArray<SVGPathElement>("[data-loop]", root);
      const plotterEl = root?.querySelector<SVGGElement>("[data-plotter]") ?? null;
      const loopLens = loopEls.map((el) => el.getTotalLength());

      // hidden start state (useLayoutEffect → set before paint, no flash)
      gsap.set("[data-blueprint]", { opacity: 0 });
      gsap.set("[data-regmark]", { opacity: 0 });
      gsap.set("[data-tick]", { opacity: 0 });
      gsap.set("[data-dim]", { autoAlpha: 0 });
      if (plotterEl) gsap.set(plotterEl, { autoAlpha: 0 });
      guideEls.forEach((el) => gsap.set(el, { strokeDashoffset: 18, strokeOpacity: 0 }));
      loopEls.forEach((el, i) => {
        el.style.strokeDasharray = `${loopLens[i]}`;
        gsap.set(el, { strokeDashoffset: loopLens[i], attr: { "fill-opacity": 0 } });
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
            // plotter head rides the tip of whichever loop is drawing
            if (!plotterEl) return;
            const t = self.animation?.time() ?? 0;
            let active = -1;
            for (let i = loopEls.length - 1; i >= 0; i--) {
              const s = loopStart(i);
              if (t >= s && t < s + LOOP_DUR) {
                active = i;
                break;
              }
            }
            if (active >= 0) {
              const frac = Math.min(1, Math.max(0, (t - loopStart(active)) / LOOP_DUR));
              const p = loopEls[active].getPointAtLength(frac * loopLens[active]);
              gsap.set(plotterEl, { x: p.x, y: p.y, autoAlpha: 1 });
            } else {
              gsap.set(plotterEl, { autoAlpha: 0 });
            }
          },
        },
      });

      // 1. blueprint grid + registration marks frame the sheet
      tl.to("[data-blueprint]", { opacity: 1, duration: 0.15, ease: "none" }, 0);
      tl.to("[data-regmark]", { opacity: 1, duration: 0.15, ease: "none", stagger: 0.02 }, 0);
      // 2. construction guides draw in, staggered — more circles now (the real
      //    build set), so a tighter step keeps it a layered draw, not a pile
      guideEls.forEach((el, i) => {
        tl.to(
          el,
          {
            strokeDashoffset: 0,
            strokeOpacity: GUIDE_DRAW_OPACITY,
            duration: 0.22,
            ease: "power1.out",
          },
          0.06 + i * 0.022,
        );
      });
      // 3. loops trace over the guides (linear, so the plotter tracks the tip),
      //    each locking with a guide-circle pulse the moment it completes
      loopEls.forEach((el, i) => {
        tl.to(el, { strokeDashoffset: 0, duration: LOOP_DUR, ease: "none" }, loopStart(i));
      });
      // each loop locks with a pulse on ITS primary construction circle (the real
      // large circle nearest that loop), not an arbitrary index
      lockCircleIdx.forEach((ci, i) => {
        const c = guideCircles[ci];
        if (!c) return;
        tl.to(
          c,
          {
            keyframes: [
              { strokeOpacity: 0.8, strokeWidth: 2.2, duration: 0.1, ease: "power2.out" },
              {
                strokeOpacity: GUIDE_RESOLVED_OPACITY,
                strokeWidth: 1.2,
                duration: 0.15,
                ease: "power2.in",
              },
            ],
          },
          loopStart(i) + LOOP_DUR,
        );
      });
      // 4. resolve: fills whisper in, guide lines fade back, ticks + dims appear
      loopEls.forEach((el) => {
        tl.to(
          el,
          { attr: { "fill-opacity": LOOP_FILL_OPACITY }, duration: 0.2, ease: "power2.out" },
          0.8,
        );
      });
      guideLines.forEach((el) => {
        tl.to(el, { strokeOpacity: GUIDE_RESOLVED_OPACITY, duration: 0.2, ease: "power2.out" }, 0.82);
      });
      tl.to("[data-tick]", { opacity: TICK_OPACITY, duration: 0.2, ease: "power2.out" }, 0.84);
      tl.to("[data-dim]", { autoAlpha: 1, duration: 0.15, ease: "power2.out", stagger: 0.02 }, 0.9);

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
          {/* registration marks — frame the sheet */}
          {regmarks.map((m, i) => (
            <g key={`r${i}`} data-regmark style={{ opacity: reduced ? 1 : 0 }}>
              <circle
                cx={m.x}
                cy={m.y}
                r={5}
                fill="none"
                stroke="#53D2FF"
                strokeWidth={1.2}
                strokeOpacity={REG_OPACITY}
              />
              <line x1={m.x - 9} y1={m.y} x2={m.x + 9} y2={m.y} stroke="#53D2FF" strokeWidth={1.2} strokeOpacity={REG_OPACITY} />
              <line x1={m.x} y1={m.y - 9} x2={m.x} y2={m.y + 9} stroke="#53D2FF" strokeWidth={1.2} strokeOpacity={REG_OPACITY} />
            </g>
          ))}

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
                stroke="#53D2FF"
                strokeWidth={1.2}
                strokeDasharray="5 5"
                strokeOpacity={reduced ? GUIDE_RESOLVED_OPACITY : 0}
              />
            ))}
            <line
              data-guide
              x1={0}
              y1={center.y}
              x2={VB_W}
              y2={center.y}
              stroke="#53D2FF"
              strokeWidth={1.2}
              strokeDasharray="5 5"
              strokeOpacity={reduced ? GUIDE_RESOLVED_OPACITY : 0}
            />
            <line
              data-guide
              x1={center.x}
              y1={0}
              x2={center.x}
              y2={VB_H}
              stroke="#53D2FF"
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
                stroke="#53D2FF"
                strokeWidth={1}
                strokeOpacity={0.9}
                opacity={reduced ? TICK_OPACITY : 0}
              />
            ))}
          </g>

          {/* dimension / annotation layer — resolves late in the scrub */}
          <g>
            {dimLines.map((l, i) => (
              <line
                key={`d${i}`}
                data-dim
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
                stroke="#53D2FF"
                strokeWidth={1}
                strokeOpacity={0.32}
                style={reduced ? undefined : { visibility: "hidden" }}
              />
            ))}
            {leaders.map((l, i) => (
              <line
                key={`ld${i}`}
                data-dim
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
                stroke="#53D2FF"
                strokeWidth={1}
                strokeOpacity={0.3}
                style={reduced ? undefined : { visibility: "hidden" }}
              />
            ))}
            <path
              data-dim
              d={arcPath}
              fill="none"
              stroke="#53D2FF"
              strokeWidth={1}
              strokeOpacity={0.3}
              style={reduced ? undefined : { visibility: "hidden" }}
            />
            {labels.map((l, i) => (
              <text
                key={`lb${i}`}
                data-dim
                x={l.x}
                y={l.y}
                textAnchor={l.anchor ?? "start"}
                dominantBaseline="middle"
                className="font-mono"
                fontSize={l.micro ? 9 : 12}
                fill="#a9a6a7"
                fillOpacity={0.5}
                style={reduced ? undefined : { visibility: "hidden" }}
              >
                {l.text}
              </text>
            ))}
          </g>

          {/* the mark: three loops trace over the guides, then fill low */}
          {TRIQUETRA_LOOPS.map((d, i) => (
            <path
              key={`l${i}`}
              data-loop
              d={d}
              fill="#53D2FF"
              fillOpacity={reduced ? LOOP_FILL_OPACITY : 0}
              stroke="#53D2FF"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          ))}

          {/* plotter head — rides the drawing tip; never shown under reduced motion */}
          <g data-plotter style={{ opacity: 0 }}>
            <circle cx={0} cy={0} r={6} fill={PLOTTER_COLOR} fillOpacity={0.22} />
            <line x1={-7} y1={0} x2={7} y2={0} stroke={PLOTTER_COLOR} strokeWidth={1} />
            <line x1={0} y1={-7} x2={0} y2={7} stroke={PLOTTER_COLOR} strokeWidth={1} />
            <circle cx={0} cy={0} r={1.6} fill={PLOTTER_COLOR} />
          </g>
        </svg>
      </div>
    </article>
  );
}
