import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * Magnetic hover: the element leans toward the cursor when it comes within
 * `radius` px (up to `strength` px of travel) and eases back on leave.
 * Self-contained rAF loop — no tweens per pointer event, no layout writes
 * outside the frame. Disabled for reduced motion and touch devices.
 */
export function useMagnetic<T extends HTMLElement>(strength = 6, radius = 60) {
  const ref = useRef<T | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (
      reduced ||
      !el ||
      !window.matchMedia("(hover: hover)").matches
    ) {
      return;
    }

    let raf = 0;
    let running = false;
    let inside = false;
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    const tick = () => {
      if (!inside) {
        targetX = 0;
        targetY = 0;
      }
      curX += (targetX - curX) * 0.16;
      curY += (targetY - curY) * 0.16;
      el.style.transform = `translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, 0)`;
      if (inside || Math.abs(curX) > 0.1 || Math.abs(curY) > 0.1) {
        raf = requestAnimationFrame(tick);
      } else {
        el.style.transform = "";
        running = false;
      }
    };

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const range = radius + Math.max(rect.width, rect.height) / 2;
      const dist = Math.hypot(dx, dy);
      inside = dist < range;
      if (inside) {
        const pull = 1 - dist / range;
        targetX = Math.max(-strength, Math.min(strength, dx * pull * 0.4));
        targetY = Math.max(-strength, Math.min(strength, dy * pull * 0.4));
      }
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const onLeaveWindow = () => {
      inside = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeaveWindow);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeaveWindow);
      el.style.transform = "";
    };
  }, [reduced, strength, radius]);

  return ref;
}
