import { useLayoutEffect, useRef } from "react";
import { Triquetra } from "@/components/Triquetra";
import { gsap } from "@/lib/scroll";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type Fragment = {
  kind: "label" | "toggle" | "input" | "card" | "slider" | "badge" | "button" | "logo";
  /** final grid position (% of the fragments container) and width */
  x: number;
  y: number;
  w?: string;
  /** centre the fragment horizontally instead of using x */
  cx?: boolean;
  /** extra landing delay in the scrub timeline (the keystone) */
  late?: number;
  /** scattered start: pixel offsets + rotation (deg) */
  sx: number;
  sy: number;
  r: number;
  title?: string;
  value?: string;
  bar?: string;
  text?: string;
};

const FRAGMENTS: Fragment[] = [
  { kind: "label", text: "Weekly report", x: 0, y: 0, sx: -160, sy: -70, r: -8 },
  { kind: "toggle", x: 88, y: 1, sx: 180, sy: -110, r: 11 },
  { kind: "input", text: "ghassan@ccl.dev", x: 0, y: 20, w: "62%", sx: -220, sy: 60, r: 6 },
  { kind: "card", title: "Revenue", value: "+18%", bar: "66%", x: 0, y: 44, w: "44%", sx: -120, sy: 150, r: -12 },
  { kind: "card", title: "Uptime", value: "99.98%", bar: "94%", x: 52, y: 44, w: "44%", sx: 200, sy: 140, r: 9 },
  { kind: "slider", x: 0, y: 70, w: "56%", sx: -180, sy: 220, r: -6 },
  { kind: "badge", text: "Earned ✦", x: 66, y: 71, sx: 140, sy: 60, r: 14 },
  { kind: "button", text: "Save changes", x: 66, y: 88, w: "34%", sx: 220, sy: 200, r: -10 },
  // the keystone: the mark itself, snapping in last at top-centre
  { kind: "logo", x: 0, y: 2, cx: true, late: 0.2, sx: 60, sy: -300, r: 18 },
];

function FragmentBody({ f }: { f: Fragment }) {
  switch (f.kind) {
    case "label":
      return (
        <p className="text-xs font-medium tracking-[0.2em] text-mist uppercase">
          {f.text}
        </p>
      );
    case "toggle":
      return (
        <div className="flex h-7 w-12 items-center rounded-full border border-accent/50 bg-accent/10 px-1">
          <div className="ml-auto h-5 w-5 rounded-full bg-accent" />
        </div>
      );
    case "input":
      return (
        <div className="rounded-md border border-ink/15 px-4 py-2.5 text-sm text-mist">
          {f.text}
        </div>
      );
    case "card":
      return (
        <div className="rounded-lg border border-ink/12 bg-ink/[0.03] p-4">
          <p className="text-xs text-mist">{f.title}</p>
          <p className="mt-1 font-display text-lg font-medium text-ink">
            {f.value}
          </p>
          <div className="mt-3 h-1 rounded bg-ink/10">
            <div
              className="h-1 rounded bg-accent/70"
              style={{ width: f.bar }}
            />
          </div>
        </div>
      );
    case "slider":
      return (
        <div className="relative flex h-6 items-center">
          <div className="h-px w-full bg-ink/20" />
          <div className="absolute left-[35%] h-3.5 w-3.5 rounded-full border-2 border-accent bg-navy" />
        </div>
      );
    case "badge":
      return (
        <span className="inline-flex items-center rounded-full border border-sand/50 px-3 py-1 text-xs text-sand">
          {f.text}
        </span>
      );
    case "button":
      return (
        <div className="rounded-full border border-accent/60 bg-accent/10 px-5 py-2.5 text-center text-sm font-medium text-accent">
          {f.text}
        </div>
      );
    case "logo":
      return (
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-ink/12 bg-ink/[0.03] p-3">
          <Triquetra className="h-full w-full" />
        </div>
      );
  }
}

/**
 * World C — Logic. Generic interface fragments start scattered and rotated;
 * scroll (scrubbed, reversible) fades in a blueprint grid and snaps every
 * fragment into a tidy, aligned mini-interface. Reduced motion: final state.
 */
export function WorldLogic() {
  const reduced = usePrefersReducedMotion();
  const panelRef = useRef<HTMLElement>(null);
  const assembled = useRef(false);

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

      const fragments = gsap.utils.toArray<HTMLElement>(
        "[data-fragment]",
        panelRef.current,
      );

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "[data-fragments]",
          start: "top 78%",
          end: "center 45%",
          scrub: 0.5,
          onUpdate: (self) => {
            // once fully assembled, fragments become draggable
            const on = self.progress >= 0.98;
            if (on !== assembled.current) {
              assembled.current = on;
              fragments.forEach((el) => el.classList.toggle("cursor-grab", on));
            }
          },
        },
      });
      tl.fromTo(
        "[data-blueprint]",
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "none" },
        0,
      );
      fragments.forEach((el, i) => {
        const f = FRAGMENTS[i];
        tl.from(
          el,
          {
            x: f.sx,
            y: f.sy,
            rotation: f.r,
            duration: 0.55,
            ease: "back.out(1.2)",
          },
          0.12 + i * 0.05 + (f.late ?? 0),
        );
      });

      // drag a fragment out of place; it springs back to its slot
      let drag: {
        el: HTMLElement;
        startX: number;
        startY: number;
      } | null = null;

      const onDown = (el: HTMLElement) => (e: PointerEvent) => {
        if (!assembled.current) return;
        gsap.killTweensOf(el);
        drag = { el, startX: e.clientX, startY: e.clientY };
        el.setPointerCapture(e.pointerId);
        el.classList.add("cursor-grabbing");
        e.preventDefault();
      };
      const onMove = (e: PointerEvent) => {
        if (!drag) return;
        gsap.set(drag.el, {
          x: e.clientX - drag.startX,
          y: e.clientY - drag.startY,
        });
      };
      const onUp = () => {
        if (!drag) return;
        drag.el.classList.remove("cursor-grabbing");
        gsap.to(drag.el, {
          x: 0,
          y: 0,
          duration: 0.3,
          ease: "back.out(1.7)",
        });
        drag = null;
      };

      const removers: (() => void)[] = [];
      fragments.forEach((el) => {
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
        data-fragments
        aria-hidden="true"
        className="relative mt-14 h-[380px] w-full select-none md:h-[420px]"
      >
        {/* blueprint grid — fades in with the scrub, static when reduced */}
        <div data-blueprint className="blueprint absolute -inset-4" />
        {FRAGMENTS.map((f, i) => (
          <div
            key={i}
            data-fragment
            className="absolute"
            style={{
              left: f.cx ? "calc(50% - 2rem)" : `${f.x}%`,
              top: `${f.y}%`,
              width: f.w,
            }}
          >
            <FragmentBody f={f} />
          </div>
        ))}
      </div>
    </article>
  );
}
