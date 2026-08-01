import { useState } from "react";
import {
  DESKTOP_COMPOSITIONS,
  MOBILE_COMPOSITIONS,
  type FriezeComposition,
} from "@/data/friezeCompositions";

// All styled triquetra variants as pre-rasterized WebP (built by
// scripts/rasterize-frieze.mjs from the .svg sources — cheaper to decode than
// the complex source SVGs). Bundled + hashed; query:"?url" → the asset URL.
const MODULES = import.meta.glob("../assets/triquetra-variants/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});
const VARIANTS = Object.entries(MODULES).map(([path, url]) => ({
  name: path.split("/").pop() ?? "",
  url: url as string,
}));
// the plain fill (03) is too heavy at anchor size — never deal it to the anchor
const FILL_URL = VARIANTS.find((v) => v.name.startsWith("03"))?.url;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Placed = FriezeComposition[number] & { url: string; variant: string };

/** Deal distinct variants onto a composition's positions (no repeats within a
 *  composition), keeping the plain fill off the anchor. */
function dealVariants(comp: FriezeComposition): Placed[] {
  const dealt = shuffle(VARIANTS).slice(0, comp.length);
  const anchorIdx = comp.findIndex((p) => p.role === "anchor");
  if (FILL_URL && dealt[anchorIdx]?.url === FILL_URL) {
    const swap = dealt.findIndex((v, i) => i !== anchorIdx && v.url !== FILL_URL);
    if (swap >= 0) [dealt[anchorIdx], dealt[swap]] = [dealt[swap], dealt[anchorIdx]];
  }
  return comp.map((p, i) => ({ ...p, url: dealt[i].url, variant: dealt[i].name }));
}

/**
 * Static decorative frieze behind the nav bar. Each page load Math.random picks
 * ONE curated composition (desktop or mobile set by width) and a fresh variant
 * assignment. Positions/sizes/rotations/opacities come verbatim from the
 * authored data (src/data/friezeCompositions.ts) — designer-tunable. Marks are
 * aria-hidden, pointer-events-none, below the nav content; big ones bleed past
 * the 64px bar and are clipped by the header's overflow-hidden.
 */
export function NavFrieze() {
  const [{ setName, index, placed }] = useState(() => {
    const mobile = typeof window !== "undefined" && window.innerWidth < 768;
    const set = mobile ? MOBILE_COMPOSITIONS : DESKTOP_COMPOSITIONS;
    const i = Math.floor(Math.random() * set.length);
    // expose the authored sets for verification (dev only, no prod bundle cost)
    if (import.meta.env.DEV) {
      (window as unknown as { __FRIEZE_COMPS?: unknown }).__FRIEZE_COMPS = {
        desktop: DESKTOP_COMPOSITIONS,
        mobile: MOBILE_COMPOSITIONS,
      };
    }
    return { setName: mobile ? "mobile" : "desktop", index: i, placed: dealVariants(set[i]) };
  });

  return (
    <div
      data-frieze
      data-frieze-set={setName}
      data-frieze-index={index}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {placed.map((m, i) => (
        <img
          key={i}
          src={m.url}
          alt=""
          aria-hidden="true"
          decoding="async"
          fetchPriority="low"
          data-role={m.role}
          data-variant={m.variant}
          className="pointer-events-none absolute top-1/2"
          style={{
            left: `${m.x}%`,
            width: `${m.size}px`,
            height: `${m.size}px`,
            opacity: m.opacity,
            transform: `translate(-50%, -50%) rotate(${m.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
