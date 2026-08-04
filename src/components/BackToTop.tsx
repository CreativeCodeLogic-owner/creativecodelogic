import { useEffect, useState } from "react";
import { ScrollTrigger, scrollToTop } from "@/lib/scroll";
import { useMagnetic } from "@/hooks/useMagnetic";

/**
 * A floating "back to top" pill, fixed bottom-right (below the drawer/menu at
 * z-60). Hidden at the top of the page; fades in once scrolled past ~1 viewport.
 * The show/hide is scroll-STATE (not motion): an UNBOUNDED trigger (start 0,
 * end "max") with a manual toggle, so passing the bottom can never strip it —
 * the same lesson as the nav-scrolled class. Click smooth-scrolls to the top
 * (instant under reduced motion). Magnetic hover like the other pills.
 */
export function BackToTop() {
  const btnRef = useMagnetic<HTMLButtonElement>(3, 50);
  const [visible, setVisible] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);

  useEffect(() => {
    const apply = (scroll: number) => setVisible(scroll > window.innerHeight);
    apply(window.scrollY); // correct initial state (may load mid-scroll via #anchor)
    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => apply(self.scroll()),
      onRefresh: (self) => apply(self.scroll()),
    });
    return () => trigger.kill();
  }, []);

  // The inline brief and the consent banner both sit at the bottom (the brief's
  // Send button shares this corner on narrow phones) and are NOT modals — hide
  // the pill whenever either is up so nothing overlaps. Drawer/menu are z-60
  // modals that cover this z-40 pill anyway, so they need no special-casing.
  useEffect(() => {
    const check = () =>
      setBriefOpen(
        !!document.querySelector("[data-brief-form], [data-consent-banner]"),
      );
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  const show = visible && !briefOpen;

  return (
    <button
      ref={btnRef}
      type="button"
      aria-label="Back to top"
      onClick={() => scrollToTop()}
      // Smaller + tighter to the corner on phones so it never lands on the brief's
      // Send row at 320px; full size from sm up. Safe-area insets on both axes.
      className={`fixed z-40 flex h-10 w-10 items-center justify-center rounded-full border border-accent/50 bg-navy/60 text-base text-accent backdrop-blur-sm transition-opacity duration-300 bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] hover:bg-accent hover:text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none sm:h-12 sm:w-12 sm:text-lg sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] sm:right-[calc(1.5rem+env(safe-area-inset-right))] ${
        show ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <span aria-hidden="true">↑</span>
    </button>
  );
}
