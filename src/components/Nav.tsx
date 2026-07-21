import { useLayoutEffect, useRef } from "react";
import { Triquetra } from "@/components/Triquetra";
import { ScrollTrigger, scrollToId } from "@/lib/scroll";
import { SHOW_WORK } from "@/lib/flags";
import { useMagnetic } from "@/hooks/useMagnetic";

const LINKS = [
  { label: "The Mark", hash: "#signature" },
  { label: "Work", hash: "#work" },
  { label: "Process", hash: "#process" },
  { label: "Contact", hash: "#contact" },
].filter((link) => SHOW_WORK || link.hash !== "#work");

export function Nav() {
  const barRef = useRef<HTMLElement>(null);
  const ctaRef = useMagnetic<HTMLAnchorElement>(3, 60);

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
      className="fixed inset-x-0 top-0 z-50 transition-colors duration-300"
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-10"
      >
        <a
          href="#signature"
          onClick={go("#signature")}
          className="flex items-center gap-3"
          aria-label="Creative Code Logic — back to top"
        >
          <Triquetra className="h-7 w-7" />
          <span className="font-display text-sm font-semibold tracking-[0.22em] text-ink">
            CCL
          </span>
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <li key={link.hash}>
              <a
                href={link.hash}
                onClick={go(link.hash)}
                className="text-sm text-mist transition-colors duration-300 hover:text-ink"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          ref={ctaRef}
          href="#contact"
          onClick={go("#contact")}
          className="rounded-full border border-accent/50 px-4 py-2 text-sm font-medium text-accent transition-colors duration-300 hover:bg-accent hover:text-navy"
        >
          Start a project
        </a>
      </nav>
    </header>
  );
}
