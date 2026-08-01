import { useLayoutEffect, useRef, useState } from "react";

// All styled triquetra variants, bundled + hashed by the build (guaranteed to
// exist; no runtime path guessing). query:"?url" → each import is the asset URL.
const MODULES = import.meta.glob("../assets/triquetra-variants/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});
const VARIANT_URLS = Object.values(MODULES) as string[];

const SLOTS = 8; // the bar is divided into this many slots; a subset gets a mark
const OPACITY_MIN = 0.06;
const OPACITY_MAX = 0.18;
const OPACITY_TEXT_CAP = 0.1; // marks sitting behind nav text never exceed this

type Mark = {
  url: string;
  leftPct: number; // horizontal centre, % of bar width
  size: number; // px
  rot: number; // deg
  opacity: number;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Slot-based scatter: pick `count` of SLOTS slots, jitter each mark within its
 * slot (±20% slot width), and never let two x-adjacent slots share a variant.
 * Guarantees spread while every reload differs. Random is fine — decorative
 * texture, not verify-critical geometry.
 */
function buildFrieze(count: number): Mark[] {
  const slotW = 100 / SLOTS;
  const slots = shuffle([...Array(SLOTS).keys()]).slice(0, count).sort((a, b) => a - b);
  const marks: Mark[] = [];
  let prevUrl = "";
  for (const slot of slots) {
    const pool = VARIANT_URLS.filter((u) => u !== prevUrl);
    const url = pool[Math.floor(Math.random() * pool.length)] ?? VARIANT_URLS[0];
    prevUrl = url;
    const jitter = (Math.random() * 2 - 1) * 0.2 * slotW;
    marks.push({
      url,
      leftPct: slot * slotW + slotW / 2 + jitter,
      size: rand(40, 110),
      rot: rand(-30, 30),
      opacity: rand(OPACITY_MIN, OPACITY_MAX),
    });
  }
  return marks;
}

/**
 * Static decorative frieze behind the nav bar — a fresh scatter of triquetra
 * variants each page load. Absolutely positioned, aria-hidden, pointer-events
 * none, below the nav content. Larger marks bleed past the 64px bar and are
 * clipped by the header's overflow-hidden. No animation, no scroll behaviour.
 */
export function NavFrieze() {
  const ref = useRef<HTMLDivElement>(null);
  const [marks] = useState<Mark[]>(() =>
    buildFrieze(typeof window !== "undefined" && window.innerWidth < 768 ? 3 : 5),
  );

  // any mark overlapping interactive nav text is capped so the text never fights
  // the texture (measured against the real laid-out link/CTA/hamburger rects)
  useLayoutEffect(() => {
    const root = ref.current;
    const header = root?.closest("header");
    if (!root || !header) return;
    const rects = [...header.querySelectorAll('[data-nav-content] a, [data-nav-content] button')].map(
      (el) => el.getBoundingClientRect(),
    );
    root.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
      const r = img.getBoundingClientRect();
      const overText = rects.some(
        (t) => !(r.right < t.left || r.left > t.right || r.bottom < t.top || r.top > t.bottom),
      );
      if (overText && parseFloat(img.style.opacity || "1") > OPACITY_TEXT_CAP) {
        img.style.opacity = String(OPACITY_TEXT_CAP);
      }
    });
  }, [marks]);

  return (
    <div
      ref={ref}
      data-frieze
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {marks.map((m, i) => (
        <img
          key={i}
          src={m.url}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2"
          style={{
            left: `${m.leftPct}%`,
            width: `${m.size}px`,
            height: `${m.size}px`,
            opacity: m.opacity,
            transform: `translate(-50%, -50%) rotate(${m.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
}
