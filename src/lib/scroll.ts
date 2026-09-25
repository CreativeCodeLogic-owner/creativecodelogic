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

/** Smooth-scroll to a section. Falls back to native scroll without Lenis.
 *  `immediate` jumps with no animation, clearing the 64px nav (initial load). */
export function scrollToId(hash: string, { immediate = false } = {}): void {
  const el = document.querySelector(hash);
  if (!(el instanceof HTMLElement)) return;
  if (immediate) {
    const top = el.getBoundingClientRect().top + window.scrollY - 64;
    if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
    else window.scrollTo({ top, behavior: "instant" });
    return;
  }
  if (lenis) {
    lenis.scrollTo(el, { offset: -64, duration: 1.4 });
  } else {
    el.scrollIntoView({ block: "start" });
  }
}

/**
 * Honour a deep link on first load. The app renders client-side, after the
 * browser's own fragment scroll has already given up, so jump once the first
 * ScrollTrigger.refresh() has laid out pins, and again after webfonts settle
 * (they shift layout) unless the visitor has scrolled in between. Only the
 * given section hashes are honoured; anything else is ignored.
 */
export function scrollToInitialHash(allowed: readonly string[]): void {
  const hash = window.location.hash;
  if (!hash || !allowed.includes(hash) || !document.querySelector(hash)) return;
  scrollToId(hash, { immediate: true });
  const landed = window.scrollY;
  document.fonts?.ready.then(() =>
    requestAnimationFrame(() => {
      if (Math.abs(window.scrollY - landed) > 2) return; // visitor moved on
      ScrollTrigger.refresh();
      scrollToId(hash, { immediate: true });
    }),
  );
}

/** Smooth-scroll to the top of the page. Instant without Lenis (reduced motion). */
export function scrollToTop(): void {
  if (lenis) {
    lenis.scrollTo(0, { duration: 1.2 });
  } else {
    window.scrollTo({ top: 0 });
  }
}

/** Lock page scroll (Lenis + native) while a modal/drawer is open. */
export function stopScroll(): void {
  lenis?.stop();
  document.documentElement.style.overflow = "hidden";
}

/** Release the scroll lock. */
export function startScroll(): void {
  lenis?.start();
  document.documentElement.style.overflow = "";
}

export { gsap, ScrollTrigger };
