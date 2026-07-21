import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

let lenis: Lenis | null = null;

/**
 * Wire Lenis smooth scrolling into the GSAP ticker so ScrollTrigger and
 * Lenis stay in sync. No-op (and no Lenis) under prefers-reduced-motion.
 */
export function initSmoothScroll(): () => void {
  if (prefersReducedMotion()) return () => {};

  lenis = new Lenis({ lerp: 0.11 });
  lenis.on("scroll", ScrollTrigger.update);

  const raf = (time: number) => {
    lenis?.raf(time * 1000);
  };
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  // Layout shifts once webfonts arrive; recalculate trigger positions.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  return () => {
    gsap.ticker.remove(raf);
    lenis?.destroy();
    lenis = null;
  };
}

/** Smooth-scroll to a section. Falls back to native scroll without Lenis. */
export function scrollToId(hash: string): void {
  const el = document.querySelector(hash);
  if (!(el instanceof HTMLElement)) return;
  if (lenis) {
    lenis.scrollTo(el, { offset: -64, duration: 1.4 });
  } else {
    el.scrollIntoView({ block: "start" });
  }
}

export { gsap, ScrollTrigger };
