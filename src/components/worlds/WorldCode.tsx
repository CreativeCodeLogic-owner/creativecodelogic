import { useEffect, useLayoutEffect, useRef } from "react";
import { TRIQUETRA_ASCII, ASCII_COLS, ASCII_HEAD } from "@/data/triquetraAscii";
import { gsap, ScrollTrigger } from "@/lib/scroll";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type LogLine = { text: string; kind: "cmd" | "ok" | "info" };

// Every line here is REAL and measured — the brand's pitch is "judge it now",
// so the terminal must not claim anything untrue.
// Measured 2026-08-04 against the LIVE production deployment (v4.2.0):
//   bun run build && firebase deploy --only hosting
//   CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" \
//     lighthouse https://creativecodelogic.web.app/ --preset=desktop \
//     --output=json --chrome-flags="--headless=new"
// Results (fonts self-hosted): vite 8.1.5 · 61 modules · tsc --noEmit clean
//   · verify6 3/3 viewports 0 console errors · Lighthouse desktop performance 91
//   (90–92 across warm runs; the GA4 gtag now runs in the lab and costs ~220ms
//   TBT, down from 94 pre-GA; cold requests dip lower), LCP 1.0s (accessibility
//   100, best-practices 100, SEO 100).
const BUILD_LOG: LogLine[] = [
  { text: "bun run build", kind: "cmd" },
  { text: "vite v8.1.5 building client environment for production…", kind: "info" },
  { text: "61 modules transformed", kind: "ok" },
  { text: "type-check clean – 0 errors", kind: "ok" },
  { text: "verification 3/3 viewports – 0 console errors", kind: "ok" },
  { text: "lighthouse performance 91", kind: "ok" },
];

const METRICS = [
  { label: "Lighthouse", target: 91, decimals: 0, suffix: "" },
  { label: "LCP", target: 1.0, decimals: 1, suffix: "s" },
  { label: "console errors", target: 0, decimals: 0, suffix: "" },
];

function formatMetric(el: HTMLElement, v: number): string {
  const decimals = Number(el.dataset.decimals ?? 0);
  return v.toFixed(decimals) + (el.dataset.suffix ?? "");
}

/**
 * World B — Code. Ambient terminal loop: the build log streams in, metrics
 * count up, then the log wipes and the triquetra assembles matrix-style —
 * columns of characters falling and locking into the mark, one pass, cyan.
 * Hold, fade, restart. Static final state under reduced motion.
 */
export function WorldCode() {
  const reduced = usePrefersReducedMotion();
  const panelRef = useRef<HTMLElement>(null);

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
    if (!panel) return;

    const q = <T extends HTMLElement>(sel: string) =>
      panel.querySelector<T>(sel)!;
    const qa = <T extends HTMLElement>(sel: string) =>
      Array.from(panel.querySelectorAll<T>(sel));

    const lineEls = qa<HTMLElement>("[data-log-line]");
    const textEls = lineEls.map(
      (el) => el.querySelector<HTMLElement>("[data-log-text]")!,
    );
    const cursor = q<HTMLElement>("[data-cursor]");
    const logBox = q<HTMLElement>("[data-log]");
    const metrics = q<HTMLElement>("[data-metrics]");
    const stage = q<HTMLElement>("[data-ascii-stage]");
    const terminalBody = q<HTMLElement>("[data-terminal-body]");
    const valueEls = qa<HTMLElement>("[data-metric-value]");

    // the matrix assembles the authored ASCII mark (embedded in triquetraAscii.ts)
    const grid = TRIQUETRA_ASCII;
    const cols = ASCII_COLS;

    const timers = new Set<number>();
    const laterReal = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };
    const later = reduced ? (fn: () => void, _ms: number) => fn() : laterReal;
    const stopAll = () => {
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
    };

    const show = (el: HTMLElement | null, visible = true) => {
      if (el) el.style.visibility = visible ? "visible" : "hidden";
    };

    const setPhase = (phase: "log" | "matrix") => {
      terminalBody.setAttribute("data-phase", phase);
    };

    const resetState = () => {
      stopAll();
      lineEls.forEach((el) => show(el, false));
      textEls.forEach((el, i) => {
        el.textContent = BUILD_LOG[i].text;
      });
      show(stage, false);
      metrics.style.opacity = "0";
      valueEls.forEach((el) => {
        el.textContent = formatMetric(el, 0);
      });
      gsap.set(logBox, { opacity: 1 });
    };

    const resetHidden = () => {
      resetState();
      setPhase("log");
    };

    // The body is pinned to a constant height (see lockHeight) so switching
    // phases must never resize the box — just flip the phase; both phases center
    // their content vertically inside the locked box (see index.css).
    const animateToPhase = (
      phase: "log" | "matrix",
      onComplete?: () => void,
    ) => {
      setPhase(phase);
      onComplete?.();
    };

    // Measure both phases once (after fonts settle) and pin the terminal body to
    // the TALLER of the two for the session. The log phase's height is the full
    // build log + metrics; the matrix phase's is the art's real rendered rows.
    // Recomputed only on resize.
    const lockHeight = () => {
      const wasPhase = (terminalBody.getAttribute("data-phase") ?? "log") as
        | "log"
        | "matrix";
      terminalBody.style.height = "auto";
      if (wasPhase !== "log") setPhase("log");
      const logH = terminalBody.offsetHeight;
      const style = window.getComputedStyle(stage);
      const fontSize = parseFloat(style.fontSize);
      const lineHeight = parseFloat(style.lineHeight);
      const lh = isNaN(lineHeight) ? fontSize * 1.15 : lineHeight;
      const bodyPad =
        parseFloat(window.getComputedStyle(terminalBody).paddingTop) * 2;
      const matrixH = grid.length * lh + bodyPad;
      terminalBody.style.height = `${Math.ceil(Math.max(logH, matrixH))}px`;
      if (wasPhase !== "log") setPhase(wasPhase);
    };

    // --- matrix assembly -----------------------------------------------------
    // per column, a head falls at ~0.55 rows/tick (tick = 33ms), columns
    // staggered by 3 ticks; passed cells lock to the final mark
    const runMatrix = (done: () => void) => {
      setPhase("matrix");
      show(stage, true);
      const rows = grid.length;
      const STAGGER = 3;
      const SPEED = 0.55;
      let tick = 0;
      const totalTicks = Math.ceil(cols * STAGGER + rows / SPEED) + 2;
      const stepMatrix = () => {
        const frame: string[] = [];
        for (let y = 0; y < rows; y++) {
          let line = "";
          for (let x = 0; x < cols; x++) {
            const head = (tick - x * STAGGER) * SPEED;
            const finalCh = grid[y][x] ?? " ";
            if (head < 0) {
              line += " ";
            } else if (y < Math.floor(head)) {
              line += finalCh; // locked
            } else if (y === Math.floor(head)) {
              line += finalCh === " " ? ASCII_HEAD : finalCh; // falling head
            } else {
              line += " ";
            }
          }
          frame.push(line.replace(/\s+$/, ""));
        }
        stage.textContent = frame.join("\n");
        tick++;
        if (tick <= totalTicks) later(stepMatrix, 33);
        else {
          stage.textContent = grid.join("\n");
          later(done, 4000); // hold the formed mark
        }
      };
      stepMatrix();
    };

    const countMetrics = () => {
      metrics.style.opacity = "1";
      valueEls.forEach((el) => {
        const target = parseFloat(el.dataset.target ?? "0");
        if (target === 0) {
          el.textContent = formatMetric(el, 0);
          return;
        }
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.4,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = formatMetric(el, obj.v);
          },
        });
      });
    };

    const wipeAndAssemble = () => {
      gsap.to(logBox, {
        opacity: 0,
        duration: reduced ? 0 : 0.25,
        ease: "power1.in",
        onComplete: () => {
          lineEls.forEach((el) => show(el, false));
          show(cursor, false);
          metrics.style.opacity = "0";
          gsap.set(logBox, { opacity: 1 });
          animateToPhase("matrix", () => {
            runMatrix(() => {
              gsap.to(logBox, {
                opacity: 0,
                duration: reduced ? 0 : 0.4,
                onComplete: () => {
                  animateToPhase("log", () => {
                    resetState();
                    started = false;
                    start();
                  });
                },
              });
            });
          });
        },
      });
    };

    const finishLog = () => {
      countMetrics();
      later(wipeAndAssemble, 2000); // hold the completed log
    };

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      let li = 0;
      let ci = 0;
      const step = () => {
        if (li >= BUILD_LOG.length) {
          finishLog();
          return;
        }
        const line = BUILD_LOG[li];
        const lineEl = lineEls[li];
        const textEl = textEls[li];
        if (ci === 0) {
          show(lineEl, true);
          textEl.textContent = "";
          lineEl.appendChild(cursor);
          show(cursor, true);
        }
        ci += line.kind === "cmd" ? 1 : 4;
        textEl.textContent = line.text.slice(0, ci);
        if (ci < line.text.length) {
          later(step, line.kind === "cmd" ? 34 : 12);
        } else {
          li += 1;
          ci = 0;
          later(step, 220);
        }
      };
      later(step, 350);
    };

    let trigger: ScrollTrigger | null = null;
    let io: IntersectionObserver | null = null;
    if (reduced) {
      // static final state: full log, final metrics, the formed mark
      lineEls.forEach((el) => show(el, true));
      show(stage, true);
      stage.textContent = grid.join("\n");
      show(cursor, false);
      metrics.style.opacity = "1";
      valueEls.forEach((el) => {
        el.textContent = formatMetric(el, parseFloat(el.dataset.target ?? "0"));
      });
      setPhase("matrix");
    } else {
      resetHidden();
      trigger = ScrollTrigger.create({
        trigger: panel,
        start: "top 65%",
        onEnter: () => {
          if (!started) start();
        },
      });
      // pause the ambient loop offscreen; restart fresh on re-entry
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            resetHidden();
            started = false;
            start();
          } else {
            stopAll();
          }
        },
        { threshold: 0.05 },
      );
      io.observe(panel);
    }

    // Pin the height once glyph metrics settle; recompute only on resize.
    let disposed = false;
    let resizeRaf = 0;
    const relock = () => {
      if (disposed) return;
      lockHeight();
      ScrollTrigger.refresh();
    };
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(relock);
    };
    if (document.fonts?.ready) document.fonts.ready.then(relock);
    else lockHeight();
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(resizeRaf);
      window.removeEventListener("resize", onResize);
      stopAll();
      trigger?.kill();
      io?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  return (
    <article
      ref={panelRef}
      data-world={1}
      aria-labelledby="pillar-code"
      className="relative overflow-hidden py-20 md:flex md:min-h-[60svh] md:flex-col md:justify-center md:py-0"
    >
      {/* chapter temperature: hairline scanlines */}
      <div aria-hidden="true" className="scanlines absolute inset-0" />

      <div className="relative z-10 grid items-center gap-12 md:grid-cols-2">
        <div data-world-copy className="max-w-lg lg:order-2">
          <p className="text-xs font-medium tracking-[0.28em] text-sand uppercase">
            02
          </p>
          <h3
            id="pillar-code"
            className="mt-3 font-display text-2xl font-semibold text-ink md:text-4xl"
          >
            Code
          </h3>
          <p className="mt-2 text-lg text-ink/90 md:text-xl">
            Built with lightweight code.
          </p>
          <p className="mt-4 leading-relaxed text-mist">
            Engineering that is fast, reliable, and maintainable. No bloat, no
            shortcuts that become your problem later.
          </p>
        </div>

        <div className="rounded-xl border border-ink/10 bg-[#060d18] font-mono text-[13px] leading-6 lg:order-1">
          <div className="border-b border-ink/10 px-5 py-3 text-xs text-mist/80">
            ccl · production build
          </div>
          <div
            data-terminal-body
            className="flex flex-col overflow-hidden p-5 md:p-6"
          >
            <div role="log" aria-label="Build log" data-log className="w-full">
              <div data-log-lines>
                {BUILD_LOG.map((line, i) => (
                  <div key={i} data-log-line className="flex items-baseline">
                    {line.kind === "cmd" && (
                      <span className="text-sand/80">$&nbsp;</span>
                    )}
                    {line.kind === "ok" && (
                      <span className="text-accent">✓&nbsp;</span>
                    )}
                    <span
                      data-log-text
                      className={
                        line.kind === "cmd"
                          ? "text-ink"
                          : line.kind === "ok"
                            ? "text-mist"
                            : "text-mist/50"
                      }
                    >
                      {line.text}
                    </span>
                  </div>
                ))}
                <span
                  data-cursor
                  aria-hidden="true"
                  className="cursor-blink inline-block h-4 w-2.5 translate-y-[2px] bg-accent"
                />
              </div>
              <pre
                data-ascii-stage
                aria-hidden="true"
                className="hidden font-mono font-bold text-[12px] leading-[1.1] whitespace-pre text-accent md:text-[15px]"
              />
            </div>

            <div
              data-metrics
              className="mt-2 grid grid-cols-3 gap-4 border-t border-ink/10 pt-2 transition-opacity duration-500"
            >
              {METRICS.map((m) => (
                <div key={m.label}>
                  <p
                    data-metric-value
                    data-target={m.target}
                    data-decimals={m.decimals}
                    data-suffix={m.suffix}
                    className="font-mono text-xl text-accent md:text-2xl"
                  >
                    {m.target.toFixed(m.decimals)}
                    {m.suffix}
                  </p>
                  <p className="mt-1 text-[11px] tracking-wider text-mist/70 uppercase">
                    {m.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
