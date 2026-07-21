import { TRIQUETRA_LOOPS, TRIQUETRA_VIEWBOX } from "@/data/triquetra";

type TriquetraProps = {
  className?: string;
  /**
   * Index of the loop that glows cyan — 0 top, 1 lower-right, 2 lower-left
   * (Creative / Code / Logic). `null` renders all loops in the neutral tone.
   */
  activeLoop?: number | null;
  /** Neutral loop colour. */
  tone?: "ink" | "accent";
  /** Access to the loop path elements (e.g. to tilt one toward the cursor). */
  loopRefs?: (el: SVGPathElement | null, i: number) => void;
};

const TONE_COLOR: Record<NonNullable<TriquetraProps["tone"]>, string> = {
  ink: "#F6F3ED",
  accent: "#57D3FE",
};

/** The CCL mark as inline SVG — three loops traced from the brand asset. */
export function Triquetra({
  className,
  activeLoop = null,
  tone = "accent",
  loopRefs,
}: TriquetraProps) {
  return (
    <svg
      viewBox={TRIQUETRA_VIEWBOX}
      className={className}
      role="img"
      aria-label="CCL triquetra mark"
    >
      {TRIQUETRA_LOOPS.map((d, i) => {
        const neutral = activeLoop === null;
        const active = activeLoop === i;
        return (
          <path
            key={i}
            ref={loopRefs ? (el) => loopRefs(el, i) : undefined}
            d={d}
            fill={active ? "#57D3FE" : TONE_COLOR[tone]}
            opacity={neutral || active ? 1 : 0.2}
            style={{
              transition:
                "fill 500ms ease, opacity 500ms ease, filter 500ms ease, transform 350ms ease-out",
              transformBox: "fill-box",
              transformOrigin: "center",
              filter: active
                ? "drop-shadow(0 0 18px rgba(87, 211, 254, 0.45))"
                : "none",
            }}
          />
        );
      })}
    </svg>
  );
}
