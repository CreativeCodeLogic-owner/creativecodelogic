import { useLayoutEffect, useRef } from "react";
import { TRIQUETRA_LOOPS } from "@/data/triquetra";
import { gsap, ScrollTrigger } from "@/lib/scroll";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const ACCENT = "87, 211, 254"; // #57d3fe
const VIEWBOX = 512; // TRIQUETRA_VIEWBOX
const BASE_ALPHA = 0.12; // per-mark stroke alpha (worlds chapter halves it → 0.06)
const STROKE = 1.6; // on-screen stroke width (px)
const MIN_SIZE = 56; // below ~48px the three loops alias into a blob
const MAX_SIZE = 120;
const MARGIN = 130; // vertical wrap margin (≥ MAX_SIZE for clean wrap)
const EDGE_BAND = 0.16; // marks live in the outer 16% each side (text-clear)
const FADE = 0.6; // crossfade seconds
const MAX_ANGLE = 0.61; // ±35° the field swings around each chapter's base angle
const DRIFT = 0.00006; // rad per scrolled px — the whole field slowly rotates
const POISSON_MIN = 1.2 * MAX_SIZE; // min centre-to-centre spacing → no clumps

// `angle` is the field-derived lean (rotation at draw time = angle + scroll drift)
type Mark = { x: number; y: number; size: number; speed: number; angle: number };

/** Deterministic PRNG so a chapter's scatter is identical across reloads. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A smooth continuous field from summed sines with seeded phases (no noise
 *  library). Nearby positions yield close values, so neighbouring marks lean
 *  and size together — iron filings, not tumbling debris. Value in ~[-1, 1],
 *  plus a per-chapter base angle. */
function makeField(seed: number) {
  const rng = mulberry32(seed);
  // low spatial frequencies: the field varies gently (~half a cycle across the
  // viewport) so neighbours ~POISSON_MIN apart still lean within ~20° of each other
  const terms = Array.from({ length: 3 }, (_, k) => ({
    fx: 0.0008 + rng() * 0.0014,
    fy: 0.0008 + rng() * 0.0014,
    phase: rng() * Math.PI * 2,
    w: 1 / (k + 1),
  }));
  const wsum = terms.reduce((s, t) => s + t.w, 0);
  const base = rng() * Math.PI * 2;
  const at = (x: number, y: number) => {
    let v = 0;
    for (const t of terms) v += t.w * Math.sin(t.fx * x + t.fy * y + t.phase);
    return v / wsum;
  };
  return { base, at };
}

/** A seeded scatter: Poisson-disc placement in the left/right margin bands (no
 *  clumps, and every mark fully clear of the central text column), with each
 *  mark's lean and size read from the smooth field. */
function makeScatter(seed: number, vw: number, vh: number, count: number): Mark[] {
  const rng = mulberry32(seed);
  const field = makeField(seed ^ 0x9e3779b9);
  const half = MAX_SIZE / 2; // clearance from the band's inner edge (max mark)
  const ATTEMPTS = 40;
  const marks: Mark[] = [];
  for (let i = 0; i < count; i++) {
    let best: { x: number; y: number } | null = null;
    let bestD = -1;
    for (let a = 0; a < ATTEMPTS; a++) {
      const left = rng() < 0.5;
      const lo = left ? 8 : (1 - EDGE_BAND) * vw + half;
      const hi = left ? EDGE_BAND * vw - half : vw - 8;
      const x = lo + rng() * Math.max(1, hi - lo);
      const y = rng() * vh;
      let d = Infinity;
      for (const m of marks) d = Math.min(d, Math.hypot(m.x - x, m.y - y));
      if (d >= POISSON_MIN) {
        best = { x, y };
        break;
      }
      if (d > bestD) {
        bestD = d; // best-effort candidate — never loops forever
        best = { x, y };
      }
    }
    if (!best) continue;
    const fv = field.at(best.x, best.y); // [-1, 1]
    marks.push({
      x: best.x,
      y: best.y,
      size: MIN_SIZE + (fv * 0.5 + 0.5) * (MAX_SIZE - MIN_SIZE), // size from the field too
      angle: field.base + fv * MAX_ANGLE,
      speed: 0.9 + rng() * 0.2,
    });
  }
  return marks;
}

/** Dev-only debug dump (positions/size/lean) so verify can assert spacing,
 *  text-clearance, and rotation coherence. */
function debugJSON(marks: Mark[]): string {
  return JSON.stringify(
    marks.map((m) => ({
      x: Math.round(m.x),
      y: Math.round(m.y),
      size: Math.round(m.size),
      a: +m.angle.toFixed(3),
    })),
  );
}

/**
 * Ambient background field — faint, stroke-only triquetra marks scattered in
 * the margins, a different seeded scatter per chapter that crossfades on
 * scroll, with a gentle per-mark parallax. One fixed canvas behind everything;
 * the render loop draws only while a crossfade is active or the scroll moved,
 * and is completely idle otherwise. Reduced motion: one static scatter.
 */
export function AmbientField() {
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Defer all setup to idle time so the field never competes with LCP / the
    // hero animation for the main thread (keeps TBT flat). It is only paper
    // texture — appearing a beat late is imperceptible.
    let cancelled = false;
    let teardown: (() => void) | null = null;
    const hasRIC = typeof window.requestIdleCallback === "function";
    let handle = 0;

    const paths = TRIQUETRA_LOOPS.map((d) => new Path2D(d));
    let vw = 0;
    let vh = 0;
    let dpr = 1;
    let frames = 0;
    const count = () => (window.innerWidth < 768 ? 6 : 10);

    const resizeCanvas = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;
    };

    const drawMark = (m: Mark, yDraw: number, alpha: number, rot: number) => {
      ctx.save();
      ctx.translate(m.x, yDraw);
      ctx.rotate(rot);
      const s = m.size / VIEWBOX;
      ctx.scale(s, s);
      ctx.translate(-VIEWBOX / 2, -VIEWBOX / 2);
      ctx.strokeStyle = `rgba(${ACCENT},${alpha})`;
      ctx.lineWidth = STROKE / s; // ~STROKE px on screen regardless of mark size
      for (const p of paths) ctx.stroke(p);
      ctx.restore();
    };

    const setup = () => {
      if (cancelled) return;

    // ---------- reduced motion: one static scatter, drawn once + on resize ----
    if (reduced) {
      let scatter: Mark[] = [];
      const drawStatic = () => {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, vw, vh);
        for (const m of scatter) drawMark(m, m.y, BASE_ALPHA, m.angle); // field only, no drift
        frames += 1;
        canvas.setAttribute("data-ambient-frames", String(frames));
      };
      const build = () => {
        resizeCanvas();
        scatter = makeScatter(1337, vw, vh, count());
        if (import.meta.env.DEV) canvas.setAttribute("data-ambient-debug", debugJSON(scatter));
        drawStatic();
      };
      build();
      canvas.setAttribute("data-ambient-chapter", "static");
      const ro = new ResizeObserver(build);
      ro.observe(document.documentElement);
      teardown = () => ro.disconnect();
      return;
    }

    // ---------- animated ------------------------------------------------------
    resizeCanvas();
    const sections = Array.from(document.querySelectorAll<HTMLElement>("main > section"));
    const worldsIndex = sections.findIndex((s) => s.querySelector("[data-world]"));
    let scatters = sections.map((_, i) => makeScatter(1000 + i * 97, vw, vh, count()));
    // the worlds chapter runs at half alpha so it never competes with the
    // worlds' own temperatures (blobs, scanlines, blueprint)
    const target = sections.map((_, i) => (i === worldsIndex ? 0.5 : 1));
    // start hidden; the chapter active at init fades in (see below)
    const state = sections.map(() => ({ alpha: 0 }));
    let activeIdx = -1;

    const draw = () => {
      const sy = window.scrollY;
      const period = vh + 2 * MARGIN;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);
      for (let c = 0; c < scatters.length; c++) {
        const a = state[c].alpha;
        if (a < 0.002) continue;
        for (const m of scatters[c]) {
          let yD = (m.y - sy * m.speed) % period;
          if (yD < 0) yD += period;
          drawMark(m, yD - MARGIN, BASE_ALPHA * a, m.angle + sy * DRIFT);
        }
      }
      frames += 1;
      canvas.setAttribute("data-ambient-frames", String(frames));
    };

    // draw only while crossfading (state not at rest) — scroll wakes it for
    // parallax; idle (loop stopped) whenever nothing is changing
    let running = false;
    let raf = 0;
    let lastScroll = -1;
    const settled = () =>
      state.every((st, i) => Math.abs(st.alpha - (i === activeIdx ? target[i] : 0)) < 0.002);
    const tick = () => {
      const moved = window.scrollY !== lastScroll;
      const cross = !settled();
      if (moved || cross) {
        draw();
        lastScroll = window.scrollY;
      }
      if (cross || window.scrollY !== lastScroll) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    };
    const wake = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };
    const onScroll = () => wake();
    window.addEventListener("scroll", onScroll, { passive: true });

    const setChapter = (idx: number) => {
      if (idx === activeIdx) return;
      activeIdx = idx;
      canvas.setAttribute("data-ambient-chapter", String(idx));
      if (import.meta.env.DEV) canvas.setAttribute("data-ambient-debug", debugJSON(scatters[idx]));
      state.forEach((st, i) => {
        gsap.to(st, {
          alpha: i === idx ? target[i] : 0,
          duration: FADE,
          ease: "power2.out",
          overwrite: true,
        });
      });
      wake();
    };

    const triggers = sections.map((sec, i) =>
      ScrollTrigger.create({
        trigger: sec,
        start: "top center",
        end: "bottom center",
        onToggle: (self) => {
          if (self.isActive) setChapter(i);
        },
      }),
    );

    // paint the chapter that is active at init — a fade-in from 0, and it
    // handles a mid-page hard refresh (e.g. loaded at #contact), not just the
    // top of the page. activeIdx starts -1 so this always runs.
    const chapterAtCenter = () => {
      const center = window.scrollY + window.innerHeight / 2;
      for (let i = 0; i < sections.length; i++) {
        const r = sections[i].getBoundingClientRect();
        const top = r.top + window.scrollY;
        if (center >= top && center < top + r.height) return i;
      }
      return 0;
    };
    setChapter(chapterAtCenter());

    const ro = new ResizeObserver(() => {
      resizeCanvas();
      scatters = sections.map((_, i) => makeScatter(1000 + i * 97, vw, vh, count()));
      if (import.meta.env.DEV && activeIdx >= 0) canvas.setAttribute("data-ambient-debug", debugJSON(scatters[activeIdx]));
      wake();
    });
    ro.observe(document.documentElement);

    teardown = () => {
      window.removeEventListener("scroll", onScroll);
      triggers.forEach((t) => t.kill());
      gsap.killTweensOf(state);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
    };

    handle = hasRIC
      ? window.requestIdleCallback(setup, { timeout: 1500 })
      : window.setTimeout(setup, 250);

    return () => {
      cancelled = true;
      if (hasRIC && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(handle);
      else clearTimeout(handle);
      teardown?.();
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      data-ambient
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
