import { useLayoutEffect, useRef } from "react";
import { TRIQUETRA_LOOPS } from "@/data/triquetra";
import { gsap, ScrollTrigger } from "@/lib/scroll";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const ACCENT = "87, 211, 254"; // #57d3fe
const VIEWBOX = 512; // TRIQUETRA_VIEWBOX
const BASE_ALPHA = 0.05; // per-mark stroke alpha (paper-faint)
const MARGIN = 90; // vertical wrap margin (≥ max mark size)
const FADE = 0.6; // crossfade seconds

type Mark = { x: number; y: number; size: number; rot: number; speed: number };

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

/** A seeded scatter biased into the left/right margins (away from the middle
 *  50% where the text column lives), so marks never sit behind body copy. */
function makeScatter(seed: number, vw: number, vh: number, count: number): Mark[] {
  const rng = mulberry32(seed);
  const marks: Mark[] = [];
  for (let i = 0; i < count; i++) {
    const left = rng() < 0.5;
    const x = left ? rng() * 0.25 * vw : (0.75 + rng() * 0.25) * vw;
    marks.push({
      x,
      y: rng() * vh,
      size: 24 + rng() * 56,
      rot: rng() * Math.PI * 2,
      speed: 0.9 + rng() * 0.2,
    });
  }
  return marks;
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

    const drawMark = (m: Mark, yDraw: number, alpha: number) => {
      ctx.save();
      ctx.translate(m.x, yDraw);
      ctx.rotate(m.rot);
      const s = m.size / VIEWBOX;
      ctx.scale(s, s);
      ctx.translate(-VIEWBOX / 2, -VIEWBOX / 2);
      ctx.strokeStyle = `rgba(${ACCENT},${alpha})`;
      ctx.lineWidth = 1 / s; // ~1px on screen regardless of mark size
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
        for (const m of scatter) drawMark(m, m.y, BASE_ALPHA);
        frames += 1;
        canvas.setAttribute("data-ambient-frames", String(frames));
      };
      const build = () => {
        resizeCanvas();
        scatter = makeScatter(1337, vw, vh, count());
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
    const state = sections.map((_, i) => ({ alpha: i === 0 ? target[0] : 0 }));
    let activeIdx = 0;
    canvas.setAttribute("data-ambient-chapter", "0");

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
          drawMark(m, yD - MARGIN, BASE_ALPHA * a);
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

    wake(); // initial paint

    const ro = new ResizeObserver(() => {
      resizeCanvas();
      scatters = sections.map((_, i) => makeScatter(1000 + i * 97, vw, vh, count()));
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
