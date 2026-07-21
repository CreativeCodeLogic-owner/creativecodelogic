import { gsap, ScrollTrigger } from "@/lib/scroll";

/**
 * The physical seal stamp: scale 1.6 → 1 with a -8deg → 0deg settle and an
 * overshoot ease, plus a one-time cyan ring flash expanding from the seal.
 * Expects the seal to contain a `[data-seal-ring]` child (the flash
 * element). Call inside a gsap.context; skip under prefers-reduced-motion.
 */
export function sealStampTl(seal: Element): gsap.core.Timeline {
  const ring = seal.querySelector("[data-seal-ring]");
  const tl = gsap.timeline();
  tl.fromTo(
    seal,
    { scale: 1.6, rotation: -8, autoAlpha: 0 },
    { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.5, ease: "back.out(2.2)" },
  );
  if (ring) {
    tl.fromTo(
      ring,
      { scale: 1, opacity: 0.7 },
      { scale: 2.4, opacity: 0, duration: 0.7, ease: "power2.out" },
      0.12,
    );
  }
  return tl;
}

/** Fires the stamp once when the trigger reaches viewport centre. */
export function sealStamp(seal: Element, trigger: Element): gsap.core.Timeline {
  const tl = sealStampTl(seal);
  ScrollTrigger.create({
    trigger,
    start: "top center",
    once: true,
    animation: tl,
  });
  return tl;
}
