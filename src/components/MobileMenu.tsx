import { useLayoutEffect, useRef } from "react";
import { Triquetra } from "@/components/Triquetra";
import { gsap, ScrollTrigger, startScroll, stopScroll } from "@/lib/scroll";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type Link = { label: string; hash: string };

type Props = {
  id: string;
  links: Link[];
  /** Close with focus returned to the hamburger. */
  onClose: () => void;
  /** Close, then scroll to the target (scroll must restart before scrolling). */
  onNavigate: (hash: string) => void;
};

/**
 * Full-screen mobile navigation. role=dialog, focus trapped with sentinels
 * (works across any embedded iframe/widget — none here, but consistent with
 * the hello drawer), Esc closes, scroll locked, focus returns to the hamburger.
 * Reduced motion: instant show/hide. Uses opacity (never autoAlpha) so links
 * stay focusable during the reveal.
 */
export function MobileMenu({ id, links, onClose, onNavigate }: Props) {
  const reduced = usePrefersReducedMotion();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const closing = useRef(false);

  useLayoutEffect(() => {
    stopScroll();
    const ctx = gsap.context(() => {
      if (!reduced && overlayRef.current) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" });
        gsap.from("[data-menu-item]", {
          y: 18,
          opacity: 0,
          duration: 0.4,
          stagger: 0.06,
          ease: "power3.out",
          delay: 0.05,
        });
      }
    }, overlayRef);
    firstLinkRef.current?.focus();
    return () => {
      ctx.revert();
      startScroll();
      requestAnimationFrame(() => ScrollTrigger.update());
    };
  }, [reduced]);

  const handleClose = (after: () => void) => {
    if (closing.current) return;
    closing.current = true;
    if (reduced || !overlayRef.current) {
      after();
      return;
    }
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.25, ease: "power2.in", onComplete: after });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleClose(onClose);
    }
  };

  // focus sentinels — bounce focus back so it never leaves the panel
  const realFocusables = () =>
    Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled])',
      ) ?? [],
    ).filter((el) => !el.hasAttribute("data-sentinel") && el.tabIndex !== -1 && el.offsetParent !== null);
  const focusFirst = () => realFocusables()[0]?.focus();
  const focusLast = () => {
    const els = realFocusables();
    els[els.length - 1]?.focus();
  };

  const navigate = (hash: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    handleClose(() => onNavigate(hash));
  };

  return (
    <div
      ref={overlayRef}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-[60] bg-navy"
    >
      {/* decorative mark, faint in the background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]"
      >
        <Triquetra className="h-[min(80vw,420px)] w-[min(80vw,420px)]" tone="ink" />
      </div>

      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="relative flex h-full flex-col px-6 py-4"
      >
        <div data-sentinel tabIndex={0} aria-hidden="true" onFocus={focusLast} />

        <div className="flex justify-end">
          <button
            type="button"
            data-menu-close
            onClick={() => handleClose(onClose)}
            aria-label="Close menu"
            className="relative flex h-11 w-11 items-center justify-center text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <span className="absolute h-[1.5px] w-6 rotate-45 bg-ink" />
            <span className="absolute h-[1.5px] w-6 -rotate-45 bg-ink" />
          </button>
        </div>

        <nav
          aria-label="Mobile"
          className="flex flex-1 flex-col items-start justify-center gap-6 pb-16"
        >
          {links.map((link, i) => {
            // the "#signature" link is the CCL wordmark — ink + tracked, set
            // apart from the mist links (same size)
            const isWordmark = link.hash === "#signature";
            return (
              <a
                key={link.hash}
                ref={i === 0 ? firstLinkRef : undefined}
                data-menu-item
                href={link.hash}
                onClick={navigate(link.hash)}
                aria-label={isWordmark ? "CCL, Creative Code Logic, back to top" : undefined}
                className={
                  isWordmark
                    ? "font-display text-3xl font-semibold tracking-[0.22em] text-ink transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none md:text-4xl"
                    : "font-display text-3xl font-semibold text-mist transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none md:text-4xl"
                }
              >
                {link.label}
              </a>
            );
          })}
          <a
            data-menu-item
            data-menu-cta
            href="#contact"
            onClick={navigate("#contact")}
            className="mt-4 rounded-full border border-accent bg-accent/10 px-7 py-3 font-display text-base font-medium text-accent transition-colors hover:bg-accent hover:text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Start a project
          </a>
        </nav>

        <div data-sentinel tabIndex={0} aria-hidden="true" onFocus={focusFirst} />
      </div>
    </div>
  );
}
