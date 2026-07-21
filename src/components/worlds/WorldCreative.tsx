import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TRIQUETRA_LOOPS } from "@/data/triquetra";
import { gsap } from "@/lib/scroll";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type Pt = { x: number; y: number };

const PALETTE = [
  { name: "cyan", value: "#57D3FE" },
  { name: "off-white", value: "#F6F3ED" },
  { name: "sand gold", value: "#C8AD79" },
  { name: "cool gray", value: "#A9A6A7" },
];

const DOTS_PER_LOOP = 8;
const FILL_ALPHA = 0.15;
// grid -> positions -> comet -> fill -> hold -> fade -> restart
const GRID_S = 1.2;
const TRAVEL_S = 6.5;
const FILL_S = 0.6;
const HOLD_S = 3;
const FADE_S = 0.8;
const STAGGER_MAX = 0.5;

function hexA(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Indices of ~target dots per loop, denser where curvature is higher. */
function pickDots(pts: Pt[], target: number): number[] {
  const n = pts.length;
  const curv = new Array<number>(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    const a1 = Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x);
    const a2 = Math.atan2(pts[i + 1].y - pts[i].y, pts[i + 1].x - pts[i].x);
    let d = Math.abs(a2 - a1);
    if (d > Math.PI) d = 2 * Math.PI - d;
    curv[i] = d;
  }
  const weights = pts.map(
    (_, i) =>
      1 +
      ((curv[Math.max(0, i - 1)] + curv[i] + curv[Math.min(n - 1, i + 1)]) / 3) *
        14,
  );
  const totalW = weights.reduce((a, b) => a + b, 0);
  const step = totalW / target;
  const idxs: number[] = [];
  let acc = 0;
  let next = step * 0.5;
  for (let i = 0; i < n && idxs.length < target; i++) {
    acc += weights[i];
    if (acc >= next) {
      idxs.push(i);
      next += step;
    }
  }
  return idxs;
}

/**
 * World A — Creative: the comet. Ambient and self-running: dots emerge from
 * a uniform square grid, snap to their constellation positions, then a bright
 * point with a short tail travels the triquetra dot-to-dot; each node lights
 * as it is reached, the fill whispers in when the mark completes, then it all
 * fades and begins again. The palette (outline/fill, four brand colours each)
 * is the only interaction. Static full mark under reduced motion.
 */
export function WorldCreative() {
  const reduced = usePrefersReducedMotion();
  const panelRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokeIdx, setStrokeIdx] = useState(0);
  const [fillIdx, setFillIdx] = useState(0);
  const strokeRef = useRef(PALETTE[0].value);
  const fillRef = useRef(PALETTE[0].value);
  const staticRenderRef = useRef<() => void>(() => {});

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
    }, panelRef);
    return () => ctx.revert();
  }, [reduced]);

  useEffect(() => {
    const panel = panelRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!panel || !canvas || !ctx) return;

    // --- geometry: dense sampled loops + curvature-picked dot indices ------
    const sampler = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    const loopsSrc: Pt[][] = TRIQUETRA_LOOPS.map((d) => {
      sampler.setAttribute("d", d);
      const len = sampler.getTotalLength();
      const steps = Math.max(96, Math.round(len / 3));
      const pts: Pt[] = [];
      for (let i = 0; i <= steps; i++) {
        const p = sampler.getPointAtLength((i / steps) * len);
        pts.push({ x: p.x, y: p.y });
      }
      return pts;
    });
    const dotIdx = loopsSrc.map((pts) => pickDots(pts, DOTS_PER_LOOP));
    const loopLens = TRIQUETRA_LOOPS.map((d) => {
      sampler.setAttribute("d", d);
      return sampler.getTotalLength();
    });
    const totalLen = loopLens.reduce((a, b) => a + b, 0);
    const loopStarts: number[] = [];
    loopLens.reduce((acc, l) => {
      loopStarts.push(acc);
      return acc + l;
    }, 0);
    // path-length position of each dot (for glow timing)
    const dotLen = loopsSrc.map((pts, li) =>
      dotIdx[li].map((di) => loopStarts[li] + (di / (pts.length - 1)) * loopLens[li]),
    );

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let homeX: Float32Array[] = [];
    let homeY: Float32Array[] = [];
    let gridX: Float32Array[] = [];
    let gridY: Float32Array[] = [];
    let dotHomeX: Float32Array[] = [];
    let dotHomeY: Float32Array[] = [];
    let visualScale = 1;

    const layout = () => {
      const rect = panel.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      let size: number;
      let cx: number;
      let cy: number;
      const PALETTE_GAP = 20;
      const PALETTE_H = 36;

      if (w >= 768) {
        // Desktop: copy takes the left 40%, game lives in the right 60% column
        const right = w * 0.6;
        size = Math.min(right, h) * 0.82;
        cx = w * 0.7;
        // vertically centre the mark + palette group
        cy = h * 0.5 - (PALETTE_GAP + PALETTE_H) / 2;
      } else {
        // Mobile: mark sits between the heading block and the body block
        const heading = panel.querySelector<HTMLElement>("[data-world-copy]");
        const headingRect = heading?.getBoundingClientRect();
        const headingBottom = headingRect
          ? headingRect.bottom - rect.top
          : h * 0.25;
        size = Math.min(w, 560) * 0.55;
        cx = w * 0.5;
        cy = headingBottom + 32 + size / 2;
        const paletteBottom = cy + size / 2 + PALETTE_GAP + PALETTE_H;
        const bodyTop = paletteBottom + 32;
        panel.style.setProperty(
          "--mobile-body-mt",
          `${Math.max(0, bodyTop - headingBottom)}px`,
        );
      }

      const s = size / 512;
      homeX = loopsSrc.map((pts) => new Float32Array(pts.map((p) => cx! + (p.x - 256) * s)));
      homeY = loopsSrc.map((pts) => new Float32Array(pts.map((p) => cy! + (p.y - 256) * s)));

      // per-dot home positions (aligned with dotIdx)
      dotHomeX = dotIdx.map((idxs, li) => new Float32Array(idxs.map((di) => homeX[li][di])));
      dotHomeY = dotIdx.map((idxs, li) => new Float32Array(idxs.map((di) => homeY[li][di])));

      // uniform square grid covering the mark's area
      const gridSide = size * 0.8;
      const totalDots = dotIdx.reduce((sum, arr) => sum + arr.length, 0);
      const gridCols = Math.ceil(Math.sqrt(totalDots));
      const gridRows = Math.ceil(totalDots / gridCols);
      const cellW = gridSide / gridCols;
      const cellH = gridSide / gridRows;
      const left = (w >= 768 ? w * 0.4 : 0) + (w >= 768 ? w * 0.6 : w) / 2 - gridSide / 2;
      const top = cy! - gridSide / 2;
      gridX = dotIdx.map((arr) => new Float32Array(arr.length));
      gridY = dotIdx.map((arr) => new Float32Array(arr.length));
      let globalDot = 0;
      for (let li = 0; li < dotIdx.length; li++) {
        for (let k = 0; k < dotIdx[li].length; k++) {
          const col = globalDot % gridCols;
          const row = Math.floor(globalDot / gridCols);
          gridX[li][k] = left + (col + 0.5) * cellW;
          gridY[li][k] = top + (row + 0.5) * cellH;
          globalDot++;
        }
      }

      // expose the mark's box so the palette can hug it
      panel.style.setProperty("--gx", `${cx}px`);
      panel.style.setProperty("--gy", `${cy}px`);
      panel.style.setProperty("--gs", `${size}px`);
      visualScale = Math.max(1, size / 400);
    };
    layout();
    const observer = new ResizeObserver(() => {
      layout();
      if (reduced) staticRenderRef.current();
    });
    observer.observe(panel);

    /** Point at `len` along the whole path (loops concatenated). */
    const pointAt = (len: number): { x: number; y: number; loop: number } => {
      for (let i = loopsSrc.length - 1; i >= 0; i--) {
        if (len >= loopStarts[i]) {
          const local = Math.min(1, (len - loopStarts[i]) / loopLens[i]);
          const pts = loopsSrc[i];
          const idx = Math.round(local * (pts.length - 1));
          return { x: homeX[i][idx], y: homeY[i][idx], loop: i };
        }
      }
      return { x: homeX[0][0], y: homeY[0][0], loop: 0 };
    };

    // --- ambient cycle state -------------------------------------------------
    type Phase = "grid" | "travel" | "fill" | "hold" | "fade";
    let phase: Phase = "grid";
    let phaseStart = performance.now();
    let history: { x: number; y: number; loop: number }[] = [];

    const easeOut = (t: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);

    const render = (now: number) => {
      const tPhase = (now - phaseStart) / 1000;
      let headLen = totalLen;
      let fillA = FILL_ALPHA;
      let globalA = 1;
      let showGrid = false;

      if (!reduced) {
        switch (phase) {
          case "grid":
            showGrid = true;
            fillA = 0;
            headLen = 0;
            if (tPhase >= GRID_S) {
              phase = "travel";
              phaseStart = now;
            }
            break;
          case "travel": {
            headLen = totalLen * Math.min(1, tPhase / TRAVEL_S);
            fillA = 0;
            if (tPhase >= TRAVEL_S) {
              phase = "fill";
              phaseStart = now;
            }
            break;
          }
          case "fill":
            headLen = totalLen;
            fillA = FILL_ALPHA * Math.min(1, tPhase / FILL_S);
            if (tPhase >= FILL_S) {
              phase = "hold";
              phaseStart = now;
            }
            break;
          case "hold":
            headLen = totalLen;
            fillA = FILL_ALPHA;
            if (tPhase >= HOLD_S) {
              phase = "fade";
              phaseStart = now;
            }
            break;
          case "fade":
            headLen = totalLen;
            globalA = 1 - Math.min(1, tPhase / FADE_S);
            fillA = FILL_ALPHA * globalA;
            if (tPhase >= FADE_S) {
              phase = "grid";
              phaseStart = now;
              history = [];
            }
            break;
        }
      }

      // comet head + tail history
      let head: { x: number; y: number; loop: number } | null = null;
      if (!reduced && phase === "travel") {
        head = pointAt(headLen);
        const lastH = history[history.length - 1];
        if (!lastH || Math.hypot(head.x - lastH.x, head.y - lastH.y) > 2) {
          history.push(head);
          if (history.length > 26) history.shift();
        }
      }

      ctx.clearRect(0, 0, w, h);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (let li = 0; li < loopsSrc.length; li++) {
        const n = loopsSrc[li].length;
        const local = Math.max(
          0,
          Math.min(1, (headLen - loopStarts[li]) / loopLens[li]),
        );
        const count = Math.max(1, Math.floor(local * (n - 1)) + 1);
        // fill (whole mark, behind the line)
        if (fillA > 0.001) {
          ctx.beginPath();
          for (let i = 0; i < n; i++) {
            if (i === 0) ctx.moveTo(homeX[li][i], homeY[li][i]);
            else ctx.lineTo(homeX[li][i], homeY[li][i]);
          }
          ctx.closePath();
          ctx.fillStyle = hexA(fillRef.current, fillA);
          ctx.fill();
        }
        // revealed outline up to the comet
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
          if (i === 0) ctx.moveTo(homeX[li][i], homeY[li][i]);
          else ctx.lineTo(homeX[li][i], homeY[li][i]);
        }
        ctx.strokeStyle = hexA(strokeRef.current, 0.75 * globalA);
        ctx.lineWidth = 1.5 * visualScale;
        ctx.stroke();

        // nodes: constellation dots
        const totalDots = dotIdx.reduce((sum, arr) => sum + arr.length, 0);
        for (let k = 0; k < dotIdx[li].length; k++) {
          const di = dotIdx[li][k];
          let dx = homeX[li][di];
          let dy = homeY[li][di];
          let lit = 0;

          if (showGrid) {
            const globalIdx = li * DOTS_PER_LOOP + k;
            const delay = (globalIdx / totalDots) * STAGGER_MAX;
            const gridT = easeOut(
              Math.max(0, Math.min(1, (tPhase - delay) / (GRID_S - STAGGER_MAX))),
            );
            dx = gridX[li][k] + (dotHomeX[li][k] - gridX[li][k]) * gridT;
            dy = gridY[li][k] + (dotHomeY[li][k] - gridY[li][k]) * gridT;
            lit = gridT;
          } else {
            lit = Math.max(0, Math.min(1, (headLen - dotLen[li][k]) / 40));
          }

          const bright = (0.55 + 0.45 * lit) * globalA;
          ctx.fillStyle = hexA(strokeRef.current, bright);
          ctx.beginPath();
          ctx.arc(dx, dy, (2.5 + lit) * visualScale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // the comet: fading tail + bright head
      if (head) {
        for (let i = 1; i < history.length; i++) {
          const a = history[i - 1];
          const b = history[i];
          if (a.loop !== b.loop) continue;
          const f = i / history.length;
          ctx.strokeStyle = hexA(strokeRef.current, 0.55 * f * globalA);
          ctx.lineWidth = (1 + f * 3) * visualScale;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        ctx.fillStyle = hexA("#D2F2FF", 0.28 * globalA);
        ctx.beginPath();
        ctx.arc(head.x, head.y, 7 * visualScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = hexA("#D2F2FF", 0.95 * globalA);
        ctx.beginPath();
        ctx.arc(head.x, head.y, 3 * visualScale, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    staticRenderRef.current = () => render(performance.now());

    let raf = 0;
    let running = false;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      render(now);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!running) {
            phase = "grid";
            phaseStart = performance.now();
            history = [];
            running = true;
            raf = requestAnimationFrame(frame);
          }
        } else if (running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0.05 },
    );

    if (reduced) {
      staticRenderRef.current();
    } else {
      io.observe(panel);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const pickStroke = (i: number) => {
    setStrokeIdx(i);
    strokeRef.current = PALETTE[i].value;
    if (reduced) staticRenderRef.current();
  };
  const pickFill = (i: number) => {
    setFillIdx(i);
    fillRef.current = PALETTE[i].value;
    if (reduced) staticRenderRef.current();
  };

  return (
    <article
      ref={panelRef}
      data-world={0}
      aria-labelledby="pillar-creative"
      className="relative min-h-[560px] overflow-hidden py-20 md:flex md:min-h-[60svh] md:flex-col md:justify-center md:py-0"
    >
      {/* chapter temperature: slow-drifting light blobs */}
      <div aria-hidden="true" className="absolute inset-0">
        <div className="blob blob-a top-[12%] left-[8%] h-72 w-72" />
        <div className="blob blob-b top-[38%] right-[4%] h-96 w-96" />
        <div className="blob blob-c bottom-[8%] left-[30%] h-64 w-64" />
      </div>

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
      />

      <div
        data-world-copy
        className="pointer-events-none relative z-10 max-w-lg md:w-[40%] md:max-w-none"
      >
        <p className="text-xs font-medium tracking-[0.28em] text-sand uppercase">
          01
        </p>
        <h3
          id="pillar-creative"
          className="mt-3 font-display text-2xl font-semibold text-ink md:text-4xl"
        >
          Creative
        </h3>
        <p className="mt-2 text-lg text-ink/90 md:text-xl">
          Built with unique creativity.
        </p>
        <p className="mt-4 hidden leading-relaxed text-mist md:block">
          Design, interaction, and storytelling that make technology feel
          alive. Because the best system in the world fails if nobody enjoys
          touching it.
        </p>
      </div>

      <div
        data-world-copy-body
        className="pointer-events-none relative z-10 max-w-lg md:hidden"
        style={{ marginTop: "var(--mobile-body-mt, 280px)" }}
      >
        <p className="leading-relaxed text-mist">
          Design, interaction, and storytelling that make technology feel
          alive. Because the best system in the world fails if nobody enjoys
          touching it.
        </p>
      </div>

      {/* the palette — the only interaction — hugging the mark */}
      <div
        className="absolute z-20 flex -translate-x-1/2 items-start gap-6"
        style={{
          left: "var(--gx, 68%)",
          top: "calc(var(--gy, 46%) + var(--gs, 250px) / 2 + 20px)",
        }}
      >
        {(
          [
            ["outline color", strokeIdx, pickStroke],
            ["fill color", fillIdx, pickFill],
          ] as const
        ).map(([label, selected, pick]) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] tracking-[0.18em] text-mist/60 uppercase">
              {label}
            </span>
            <div role="group" aria-label={label} className="flex justify-center gap-2">
              {PALETTE.map((c, i) => (
                <button
                  key={c.value}
                  type="button"
                  aria-label={`${label}: ${c.name}`}
                  aria-pressed={selected === i}
                  onClick={() => pick(i)}
                  className="group flex h-10 w-10 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  {/* 40px hit area; the visible dot stays 16px */}
                  <span
                    aria-hidden="true"
                    className={`h-4 w-4 rounded-full transition-all duration-200 ${
                      selected === i
                        ? "scale-125 ring-2 ring-ink/70 ring-offset-2 ring-offset-navy"
                        : "opacity-50 group-hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
