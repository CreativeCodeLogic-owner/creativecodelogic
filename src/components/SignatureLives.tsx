import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/scroll";
import { sealStamp } from "@/lib/seal";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type CaseStudy = {
  name: string;
  image: string;
  problem: string;
  thinking: string;
  craft: string;
  href: string;
};

// Placeholder entries — final names, problems, craft details, and real
// screenshots are open items for copy v2 (see copy/homepage-narrative-v1.md).
const CASES: CaseStudy[] = [
  {
    name: "Product One",
    image: "/products/product-one.jpg",
    problem: "A manual workflow was costing its team hours every day.",
    thinking:
      "We rebuilt it around the rule, not the form. The interface fell out of the logic.",
    craft: "Fast under load. Keyboard-first where it counts.",
    href: "#",
  },
  {
    name: "Product Two",
    image: "/products/product-two.jpg",
    problem: "A good product had no way to reach its customers online.",
    thinking:
      "We designed for the busiest day, not the average one. Launch spikes became a non-event.",
    craft: "Static-first rendering. Zero-downtime releases.",
    href: "#",
  },
];

/**
 * Chapter 3 — Built and live.
 * Two case cards with screenshot slots; the ✦ seal stamps onto each at
 * viewport centre, and the cards answer the pointer with a subtle 3D tilt.
 */
export function SignatureLives() {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-work-intro]", {
        y: 28,
        autoAlpha: 0,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 78%", once: true },
      });

      gsap.utils
        .toArray<HTMLElement>("[data-case-card]", rootRef.current)
        .forEach((card) => {
          gsap.from(card, {
            y: 40,
            autoAlpha: 0,
            duration: 0.9,
            ease: "power3.out",
            clearProps: "transform",
            scrollTrigger: { trigger: card, start: "top 82%", once: true },
          });
          const seal = card.querySelector("[data-seal]");
          if (seal) sealStamp(seal, card);
        });

      gsap.from("[data-meta-case]", {
        y: 24,
        autoAlpha: 0,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: { trigger: "[data-meta-case]", start: "top 88%", once: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, [reduced]);

  const canTilt = !reduced && window.matchMedia("(hover: hover)").matches;

  const onTilt = (event: React.MouseEvent<HTMLElement>) => {
    if (!canTilt) return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    gsap.to(el, {
      rotationY: px * 7,
      rotationX: -py * 7,
      transformPerspective: 900,
      duration: 0.4,
      ease: "power2.out",
    });
  };

  const onTiltEnd = (event: React.MouseEvent<HTMLElement>) => {
    if (!canTilt) return;
    gsap.to(event.currentTarget, {
      rotationX: 0,
      rotationY: 0,
      duration: 0.7,
      ease: "power3.out",
    });
  };

  return (
    <section
      id="work"
      ref={rootRef}
      aria-labelledby="work-heading"
      className="relative mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-20"
    >
      <div data-work-intro className="max-w-2xl">
        <p className="text-xs font-medium tracking-[0.28em] text-mist uppercase">
          Built and live
        </p>
        <h2
          id="work-heading"
          className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink md:text-5xl"
        >
          Built. Shipped. Live.
        </h2>
        <p className="mt-6 leading-relaxed text-mist">
          Two live products carry the mark today. Not mockups. Not concepts.
          Working systems you can open, click, and judge right now.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2 [perspective:1200px]">
        {CASES.map((study) => (
          <article
            key={study.name}
            data-case-card
            aria-labelledby={`case-${study.name.replace(/\s+/g, "-").toLowerCase()}`}
            className="group relative transition-transform duration-300 will-change-transform hover:-translate-y-1"
          >
            <div
              onMouseMove={onTilt}
              onMouseLeave={onTiltEnd}
              className="relative overflow-hidden rounded-2xl border border-ink/8 bg-ink/[0.02] will-change-transform"
            >
              <div className="aspect-video overflow-hidden border-b border-ink/8">
                <img
                  src={study.image}
                  alt={`${study.name} preview`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>

              <span
                data-seal
                aria-hidden="true"
                className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full border border-accent/40 bg-navy/70 text-accent"
              >
                <span
                  data-seal-ring
                  className="absolute inset-0 rounded-full border border-accent/60 opacity-0"
                />
                ✦
              </span>

              <div className="p-8 md:p-10">
                <h3
                  id={`case-${study.name.replace(/\s+/g, "-").toLowerCase()}`}
                  className="font-display text-2xl font-semibold text-ink"
                >
                  {study.name}
                </h3>

                <div className="mt-6 space-y-4 text-sm leading-relaxed text-mist">
                  <p>
                    <strong className="font-medium text-ink">The problem:</strong>{" "}
                    {study.problem}
                  </p>
                  <p>
                    <strong className="font-medium text-ink">The thinking:</strong>{" "}
                    {study.thinking}
                  </p>
                  <p>
                    <strong className="font-medium text-ink">The craft:</strong>{" "}
                    {study.craft}
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                  <a
                    href={study.href}
                    className="text-sm font-medium text-accent transition-colors duration-300 hover:text-ink"
                  >
                    Live product →
                  </a>
                  <p className="text-xs text-mist">
                    Built with Creative Code Logic{" "}
                    <span aria-hidden="true" className="text-accent">
                      ✦
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside
        data-meta-case
        className="mt-12 max-w-2xl border-l-2 border-sand/50 pl-6 text-sm leading-relaxed text-mist"
      >
        <p className="font-medium text-ink">This website is project 001.</p>
        <p className="mt-2">
          Everything we ask you to trust — the design, the engineering, the
          thinking — you&rsquo;re using it right now.{" "}
          <a
            href="#"
            className="text-accent transition-colors duration-300 hover:text-ink"
          >
            How we built it →
          </a>
        </p>
      </aside>
    </section>
  );
}
