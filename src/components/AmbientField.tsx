import { useLayoutEffect, useRef } from "react";
import { TRIQUETRA_LOOPS } from "@/data/triquetra";
import { gsap, ScrollTrigger } from "@/lib/scroll";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const ACCENT = "87, 211, 254"; // #57d3fe
const VIEWBOX = 512; // TRIQUETRA_VIEWBOX
const BASE_ALPHA = 0.12; // per-mark stroke alpha (worlds chapter halves it → 0.06)
const STROKE = 1.6; // on-screen stroke width (px)
const EDGE_BAND = 0.16; // marks live in the outer 16% each side (text-clear)
const EDGE_CLEAR = 24; // min clearance from every viewport edge (no cropping)
const FADE = 0.6; // crossfade seconds
const MAX_ANGLE = 0.61; // ±35° the field swings around each chapter's base angle
const DRIFT = 0.00006; // rad per scrolled px — the whole field slowly rotates
const PARALLAX = 0.15; // gentle scroll drift factor (clamped so it never crops)
const ANCHOR_MIN = 150; // exactly one dominant anchor per chapter…
const ANCHOR_MAX = 190;
const SAT_MIN = 48; // …the rest are satellites, clearly smaller
const SAT_MAX = 72;
const SAT_GAP = 120; // satellite-to-satellite min spacing

// `angle` is the field-derived lean (rotation at draw time = angle + scroll drift)
type Mark = { x: number; y: number; size: number; speed: number; angle: number; anchor: boolean };

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

/** A seeded CONSTELLATION per chapter: one dominant anchor plus satellites,
 *  weighted to one side (the side alternates per chapter, so crossfades read as
 *  the composition's weight swinging across the page). Poisson-spaced, every
 *  mark fully inside the viewport (≥EDGE_CLEAR from all edges) and clear of the
 *  central text column; lean (and satellite size) come from the smooth field. */
function makeScatter(
  seed: number,
  vw: number,
  vh: number,
  count: number,
  heavyRight: boolean,
): Mark[] {
  const rng = mulberry32(seed);
  const field = makeField(seed ^ 0x9e3779b9);
  const EDGE_L = EDGE_BAND * vw;
  const EDGE_R = (1 - EDGE_BAND) * vw;
  const PAD = 2; // a hair of slack past every boundary so nothing sits exactly on it
  // largest mark a margin can hold with edge + text-band clearance
  const marginMax = Math.max(20, Math.min(EDGE_L, vw - EDGE_R) - EDGE_CLEAR - 2 * PAD);
  const marks: Mark[] = [];

  const boundsFor = (right: boolean, half: number) => ({
    xlo: right ? EDGE_R + PAD + half : EDGE_CLEAR + PAD + half,
    xhi: right ? vw - EDGE_CLEAR - PAD - half : EDGE_L - PAD - half,
    ylo: EDGE_CLEAR + PAD + half,
    yhi: vh - EDGE_CLEAR - PAD - half,
  });
  // min spacing to an existing mark: anchor pairs are looser (its own scale),
  // satellite-to-satellite is a flat gap
  const anchorSize = Math.min(ANCHOR_MIN + rng() * (ANCHOR_MAX - ANCHOR_MIN), marginMax);
  const required = (m: Mark) => (m.anchor ? 0.75 * anchorSize : SAT_GAP);

  const place = (right: boolean, half: number) => {
    const b = boundsFor(right, half);
    let best: { x: number; y: number } | null = null;
    let bestSlack = -Infinity;
    for (let a = 0; a < 40; a++) {
      // Math.max(0, …): on a degenerate (single-point) band, stay exactly on it
      // rather than overflow the text/edge boundary by up to a pixel
      const x = b.xlo + rng() * Math.max(0, b.xhi - b.xlo);
      const y = b.ylo + rng() * Math.max(0, b.yhi - b.ylo);
      let slack = Infinity;
      for (const m of marks) slack = Math.min(slack, Math.hypot(m.x - x, m.y - y) - required(m));
      if (slack >= 0) return { x, y };
      if (slack > bestSlack) {
        bestSlack = slack; // best-effort — never loops forever
        best = { x, y };
      }
    }
    return best;
  };

  // 1) the anchor, on the heavy side
  {
    const p = place(heavyRight, anchorSize / 2);
    if (p) {
      const fv = field.at(p.x, p.y);
      marks.push({ x: p.x, y: p.y, size: anchorSize, angle: field.base + fv * MAX_ANGLE, speed: 0.9 + rng() * 0.2, anchor: true });
    }
  }

  // 2) satellites — one shares the heavy side (when there's room), the rest sit
  //    on the light side so the weight clearly favours the anchor's side
  const heavySats = count >= 5 ? 1 : 0;
  const satHalf = Math.min(SAT_MAX, marginMax) / 2; // reserve the real footprint (capped on thin margins)
  for (let i = 0; i < count - 1; i++) {
    const right = i < heavySats ? heavyRight : !heavyRight;
    const p = place(right, satHalf);
    if (!p) continue;
    const fv = field.at(p.x, p.y);
    const size = Math.min(SAT_MIN + (fv * 0.5 + 0.5) * (SAT_MAX - SAT_MIN), marginMax);
    marks.push({ x: p.x, y: p.y, size, angle: field.base + fv * MAX_ANGLE, speed: 0.9 + rng() * 0.2, anchor: false });
  }
  return marks;
}

/** Dev-only debug dump (positions/size/lean) so verify can assert spacing,
 *  text-clearance, and rotation coherence. */
function debugJSON(marks: Mark[]): string {
  return JSON.stringify(
    marks.map((m) => ({
      x: +m.x.toFixed(1),
      y: +m.y.toFixed(1),
      size: +m.size.toFixed(1),
      a: +m.angle.toFixed(3),
      anchor: m.anchor,
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
    const count = () => (window.innerWidth < 768 ? 3 : 5);

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
        scatter = makeScatter(1337, vw, vh, count(), true);
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
    let scatters = sections.map((_, i) => makeScatter(1000 + i * 97, vw, vh, count(), i % 2 === 0));
    // the worlds chapter runs at half alpha so it never competes with the
    // worlds' own temperatures (blobs, scanlines, blueprint)
    const target = sections.map((_, i) => (i === worldsIndex ? 0.5 : 1));
    // start hidden; the chapter active at init fades in (see below)
    const state = sections.map(() => ({ alpha: 0 }));
    let activeIdx = -1;

    const draw = () => {
      const sy = window.scrollY;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);
      for (let c = 0; c < scatters.length; c++) {
        const a = state[c].alpha;
        if (a < 0.002) continue;
        for (const m of scatters[c]) {
          const half = m.size / 2;
          // gentle scroll drift, clamped inside the safe zone → never cropped
          const yD = Math.max(
            EDGE_CLEAR + half,
            Math.min(vh - EDGE_CLEAR - half, m.y - sy * (m.speed - 1) * PARALLAX),
          );
          drawMark(m, yD, BASE_ALPHA * a, m.angle + sy * DRIFT);
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
      scatters = sections.map((_, i) => makeScatter(1000 + i * 97, vw, vh, count(), i % 2 === 0));
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
