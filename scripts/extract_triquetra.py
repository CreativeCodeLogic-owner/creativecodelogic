"""Trace the CCL triquetra PNG into three SVG stroke paths (one per loop/blade).

Pure-PIL pipeline: threshold cyan -> connected components -> Moore-Neighbor
boundary tracing -> Ramer-Douglas-Peucker simplify -> Catmull-Rom to cubic
bezier -> emit src/data/triquetra.ts plus a preview PNG for visual check.
"""

from PIL import Image, ImageDraw
import math
import os

SRC = ".brief/branding/Triquetra_Fill.png"
OUT_TS = "src/data/triquetra.ts"
OUT_PREVIEW = "scripts/triquetra_preview.png"
RDP_EPSILON = 2.2

img = Image.open(SRC).convert("RGB")
W, H = img.size
px = img.load()

# --- 1. cyan mask -----------------------------------------------------------
mask = bytearray(W * H)
for y in range(H):
    for x in range(W):
        r, g, b = px[x, y]
        if b > 160 and g > 120 and b > r + 60:
            mask[y * W + x] = 1

# --- 2. connected components (BFS, 4-connectivity) --------------------------
labels = [-1] * (W * H)
components: list[list[int]] = []
for i in range(W * H):
    if mask[i] and labels[i] == -1:
        cid = len(components)
        stack = [i]
        labels[i] = cid
        comp = []
        while stack:
            p = stack.pop()
            comp.append(p)
            x, y = p % W, p // W
            for nx, ny in ((x+1, y), (x-1, y), (x, y+1), (x, y-1)):
                if 0 <= nx < W and 0 <= ny < H:
                    q = ny * W + nx
                    if mask[q] and labels[q] == -1:
                        labels[q] = cid
                        stack.append(q)
        components.append(comp)

components = [c for c in components if len(c) > 1000]
print(f"components: {[len(c) for c in components]}")
assert len(components) == 3, f"expected 3 loops, got {len(components)}"

comp_masks = []
for comp in components:
    m = set(comp)
    comp_masks.append(m)

# --- 3. Moore-Neighbor boundary tracing -------------------------------------
def trace_boundary(comp_set):
    # start: topmost-then-leftmost pixel of the component
    start = min(comp_set, key=lambda p: (p // W, p % W))

    def neighbors(p):
        x, y = p % W, p // W
        # 8-connected clockwise starting from (x+1, y-1) etc.
        for dx, dy in ((1, 0), (1, 1), (0, 1), (-1, 1),
                       (-1, 0), (-1, -1), (0, -1), (1, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < W and 0 <= ny < H:
                yield ny * W + nx

    contour = [start]
    prev = None
    cur = start
    # Moore tracing with Jacob's stopping criterion
    start_backtrack = None
    for _ in range(10_000_000):
        ns = list(neighbors(cur))
        # find index to start scanning: just after the pixel we came from
        if prev is None:
            scan_from = 0
        else:
            try:
                scan_from = (ns.index(prev) + 1) % 8
            except ValueError:
                scan_from = 0
        nxt = None
        for k in range(8):
            cand = ns[(scan_from + k) % 8]
            if cand in comp_set:
                nxt = cand
                # backtrack pixel = the one just before the hit
                back = ns[(scan_from + k - 1) % 8]
                break
        if nxt is None:
            break  # isolated pixel
        if cur == start and prev is not None:
            # Jacob's criterion: entering start from the same backtrack
            if start_backtrack is not None and back == start_backtrack:
                break
        if prev is None:
            start_backtrack = back
        contour.append(nxt)
        prev, cur = cur, nxt
        if len(contour) > 200000:
            raise RuntimeError("tracing runaway")
    return [(p % W, p // W) for p in contour]

# --- 4. Ramer-Douglas-Peucker -----------------------------------------------
def rdp(points, eps):
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = points[a]
        bx, by = points[b]
        dx, dy = bx - ax, by - ay
        seg_len = math.hypot(dx, dy) or 1e-9
        dmax, idx = -1.0, -1
        for i in range(a + 1, b):
            px_, py_ = points[i]
            d = abs(dy * px_ - dx * py_ + bx * ay - by * ax) / seg_len
            if d > dmax:
                dmax, idx = d, i
        if dmax > eps:
            keep[idx] = True
            stack.append((a, idx))
            stack.append((idx, b))
    return [p for p, k in zip(points, keep) if k]

def rdp_closed(points, eps):
    """RDP for a closed contour: split at the point farthest from the
    start, simplify each arc, then stitch (both split points kept)."""
    x0, y0 = points[0]
    k = max(range(len(points)),
            key=lambda i: (points[i][0] - x0) ** 2 + (points[i][1] - y0) ** 2)
    arc1 = rdp(points[:k + 1], eps)
    arc2 = rdp(points[k:], eps)
    return arc1[:-1] + arc2

# --- 5. Catmull-Rom -> cubic bezier (closed) --------------------------------
def smooth_path(points):
    pts = points[:]
    # drop duplicate closing point if present
    if len(pts) > 1 and pts[0] == pts[-1]:
        pts.pop()
    n = len(pts)
    f = lambda v: f"{v:.1f}".rstrip("0").rstrip(".")
    d = [f"M {f(pts[0][0])} {f(pts[0][1])}"]
    for i in range(n):
        p0 = pts[(i - 1) % n]
        p1 = pts[i]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6.0, p1[1] + (p2[1] - p0[1]) / 6.0)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6.0, p2[1] - (p3[1] - p1[1]) / 6.0)
        d.append(f"C {f(c1[0])} {f(c1[1])}, {f(c2[0])} {f(c2[1])}, {f(p2[0])} {f(p2[1])}")
    d.append("Z")
    return " ".join(d)

loops = []
for comp_set in comp_masks:
    contour = trace_boundary(comp_set)
    simplified = rdp_closed(contour, RDP_EPSILON)
    loops.append((simplified, comp_set))
    print(f"contour pts: {len(contour)} -> simplified: {len(simplified)}")

# order loops clockwise starting from the top loop
def centroid(comp_set):
    xs = [p % W for p in comp_set]
    ys = [p // W for p in comp_set]
    return sum(xs) / len(xs), sum(ys) / len(ys)

def angle_of(comp_set):
    cx, cy = centroid(comp_set)
    return math.atan2(cy - H / 2, cx - W / 2)

loops.sort(key=lambda t: angle_of(t[1]))
# rotate so the top loop (angle closest to -90deg) is first
def ang_dist(a, target):
    d = abs(a - target) % (2 * math.pi)
    return min(d, 2 * math.pi - d)

top_idx = min(range(3), key=lambda i: ang_dist(angle_of(loops[i][1]), -math.pi / 2))
loops = loops[top_idx:] + loops[:top_idx]
# ensure clockwise order after top: next should be bottom-right (angle ~30deg)
if ang_dist(angle_of(loops[1][1]), math.radians(30)) > ang_dist(angle_of(loops[2][1]), math.radians(30)):
    loops = [loops[0], loops[2], loops[1]]

paths = [smooth_path(pts) for pts, _ in loops]

# --- 6. emit TS + preview ---------------------------------------------------
os.makedirs(os.path.dirname(OUT_TS), exist_ok=True)
with open(OUT_TS, "w") as fh:
    fh.write("/**\n")
    fh.write(" * Triquetra loop paths traced from .brief/branding/Triquetra_Fill.png\n")
    fh.write(" * by scripts/extract_triquetra.py. One closed path per loop,\n")
    fh.write(" * ordered clockwise starting from the top loop. viewBox: 0 0 %d %d.\n" % (W, H))
    fh.write(" */\n")
    fh.write(f"export const TRIQUETRA_VIEWBOX = \"0 0 {W} {H}\";\n\n")
    fh.write("export const TRIQUETRA_LOOPS: string[] = [\n")
    for p in paths:
        fh.write(f"  \"{p}\",\n")
    fh.write("];\n")
print(f"wrote {OUT_TS}")

prev = Image.new("RGB", (W, H), (9, 18, 32))
dr = ImageDraw.Draw(prev)
for pts, _ in loops:
    dr.polygon(pts, outline=(246, 243, 237))
    dr.line(pts + [pts[0]], fill=(87, 211, 254), width=1)
prev.save(OUT_PREVIEW)
print(f"wrote {OUT_PREVIEW}")
