import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
// import { NavFrieze } from "@/components/NavFrieze"; // benched per team feedback 2026-08
import { MobileMenu } from "@/components/MobileMenu";
import { ScrollTrigger, scrollToId } from "@/lib/scroll";
import { SHOW_WORK } from "@/lib/flags";
import { useMagnetic } from "@/hooks/useMagnetic";

const MENU_ID = "mobile-menu";

const LINKS = [
  { label: "CCL", hash: "#signature" },
  { label: "Work", hash: "#work" },
  { label: "Process", hash: "#process" },
  { label: "Contact", hash: "#contact" },
].filter((link) => SHOW_WORK || link.hash !== "#work");

// the "#signature" link doubles as the wordmark — it carries the old logo
// treatment (font-display, tracked, ink) to set it apart from the mist links
const WORDMARK_HASH = "#signature";

export function Nav() {
  const barRef = useRef<HTMLElement>(null);
  const ctaRef = useMagnetic<HTMLAnchorElement>(3, 60);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    // Scroll-STATE styling, not motion — applies even under reduced motion.
    // Unbounded (start:0 end:max) with a manual toggle so reaching/passing the
    // bottom can never strip the class the way a bounded toggleClass does when
    // its trigger deactivates past "max".
    const apply = (scroll: number) => bar.classList.toggle("nav-scrolled", scroll > 40);
    apply(window.scrollY); // correct initial state (page may load mid-scroll via #anchor)
    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => apply(self.scroll()),
      onRefresh: (self) => apply(self.scroll()),
    });
    return () => trigger.kill();
  }, []);

  const go = (hash: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    scrollToId(hash);
  };

  return (
    <header
      ref={barRef}
      className="fixed inset-x-0 top-0 z-50 overflow-hidden transition-colors duration-300"
    >
      {/* NavFrieze benched per team feedback 2026-08; revive by re-mounting. */}

      <nav
        aria-label="Primary"
        data-nav-content
        className="relative z-10 mx-auto flex max-w-6xl items-center justify-end px-6 py-4 md:justify-between md:px-10"
      >
        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => {
            const isWordmark = link.hash === WORDMARK_HASH;
            return (
              <li key={link.hash}>
                <a
                  href={link.hash}
                  onClick={go(link.hash)}
                  aria-label={isWordmark ? "CCL, Creative Code Logic, back to top" : undefined}
                  className={
                    isWordmark
                      ? "rounded-md font-display text-sm font-semibold tracking-[0.22em] text-ink transition-colors duration-300 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                      : "rounded-md text-sm text-mist transition-colors duration-300 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  }
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-1">
          <a
            ref={ctaRef}
            href="#contact"
            onClick={go("#contact")}
            className="rounded-full border border-accent/50 px-4 py-2 text-sm font-medium text-accent transition-colors duration-300 hover:bg-accent hover:text-navy focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Start a project
          </a>

          {/* hamburger — mobile only; the full-screen menu carries the × */}
          <button
            ref={hamburgerRef}
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls={MENU_ID}
            onClick={() => setMenuOpen(true)}
            className="relative flex h-11 w-11 items-center justify-center rounded-md text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none md:hidden"
          >
            <span className="absolute h-[1.5px] w-6 -translate-y-1 bg-ink" />
            <span className="absolute h-[1.5px] w-6 translate-y-1 bg-ink" />
          </button>
        </div>
      </nav>

      {menuOpen &&
        createPortal(
          <MobileMenu
            id={MENU_ID}
            links={LINKS}
            onClose={() => {
              setMenuOpen(false);
              hamburgerRef.current?.focus();
            }}
            onNavigate={(hash) => {
              setMenuOpen(false);
              requestAnimationFrame(() => scrollToId(hash));
            }}
          />,
          document.body,
        )}
    </header>
  );
}
