"""Generate placeholder case-card images (public/products/*.png).

Subtle on-palette gradient blocks with a faint traced triquetra-loop
outline on the right side. Loop outlines re-traced from the brand PNG
(same pipeline as extract_triquetra.py). Replace with real screenshots.
"""

from PIL import Image, ImageDraw, ImageFilter
import math
import os

SRC = ".brief/branding/Triquetra_Fill.png"
OUT_DIR = "public/products"
W_IMG, H_IMG = 1280, 720
NAVY_TOP = (12, 26, 48)
NAVY_BOT = (9, 18, 32)
CYAN = (87, 211, 254)

# --- re-trace the three loops (same as extract_triquetra.py) ----------------
img = Image.open(SRC).convert("RGB")
W, H = img.size
px = img.load()
mask = bytearray(W * H)
for y in range(H):
    for x in range(W):
        r, g, b = px[x, y]
        if b > 160 and g > 120 and b > r + 60:
            mask[y * W + x] = 1

labels = [-1] * (W * H)
components = []
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

def trace_boundary(comp_set):
    start = min(comp_set, key=lambda p: (p // W, p % W))
    def neighbors(p):
        x, y = p % W, p // W
        for dx, dy in ((1,0),(1,1),(0,1),(-1,1),(-1,0),(-1,-1),(0,-1),(1,-1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < W and 0 <= ny < H:
                yield ny * W + nx
    contour, prev, cur = [start], None, start
    start_backtrack = None
    for _ in range(1_000_000):
        ns = list(neighbors(cur))
        scan_from = 0 if prev is None else (ns.index(prev) + 1) % 8 if prev in ns else 0
        nxt, back = None, None
        for k in range(8):
            cand = ns[(scan_from + k) % 8]
            if cand in comp_set:
                nxt = cand
                back = ns[(scan_from + k - 1) % 8]
                break
        if nxt is None:
            break
        if cur == start and prev is not None and start_backtrack is not None and back == start_backtrack:
            break
        if prev is None:
            start_backtrack = back
        contour.append(nxt)
        prev, cur = cur, nxt
    return [(p % W, p // W) for p in contour]

def rdp(points, eps):
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = points[a]; bx, by = points[b]
        dx, dy = bx - ax, by - ay
        seg = math.hypot(dx, dy) or 1e-9
        dmax, idx = -1.0, -1
        for i in range(a + 1, b):
            px_, py_ = points[i]
            d = abs(dy * px_ - dx * py_ + bx * ay - by * ax) / seg
            if d > dmax:
                dmax, idx = d, i
        if dmax > eps:
            keep[idx] = True
            stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(points, keep) if k]

def rdp_closed(points, eps):
    x0, y0 = points[0]
    k = max(range(len(points)), key=lambda i: (points[i][0]-x0)**2 + (points[i][1]-y0)**2)
    return rdp(points[:k+1], eps)[:-1] + rdp(points[k:], eps)

def centroid(comp):
    return (sum(p % W for p in comp) / len(comp), sum(p // W for p in comp) / len(comp))

def angle_of(comp):
    cx, cy = centroid(comp)
    return math.atan2(cy - H/2, cx - W/2)

components.sort(key=angle_of)
def ang_dist(a, t):
    d = abs(a - t) % (2 * math.pi)
    return min(d, 2*math.pi - d)
top_idx = min(range(3), key=lambda i: ang_dist(angle_of(components[i]), -math.pi/2))
components = components[top_idx:] + components[:top_idx]
loops = [rdp_closed(trace_boundary(set(c)), 2.2) for c in components]

# --- render placeholders -----------------------------------------------------
os.makedirs(OUT_DIR, exist_ok=True)

def base_gradient():
    """Per-pixel vertical gradient + smooth radial cyan glow from the
    top-right corner, with dithering to avoid 8-bit banding."""
    import random
    random.seed(7)
    im = Image.new("RGB", (W_IMG, H_IMG))
    px_out = im.load()
    gx, gy = W_IMG * 1.05, -H_IMG * 0.05  # glow centre just off the corner
    max_d = math.hypot(W_IMG * 0.9, H_IMG * 0.9)
    for y in range(H_IMG):
        t = y / H_IMG
        base = [a + (b - a) * t for a, b in zip(NAVY_TOP, NAVY_BOT)]
        for x in range(W_IMG):
            d = math.hypot(x - gx, y - gy) / max_d
            glow = max(0.0, 1.0 - d) ** 2.2 * 0.10  # whisper of cyan
            px_out[x, y] = tuple(
                max(0, min(255, int(c + CYAN[i] * glow + random.uniform(-1, 1))))
                for i, c in enumerate(base)
            )
    return im

def draw_loop(im, pts, scale, cx, cy, alpha_line, alpha_glow):
    # loop source coords live in a 512 box; centre them first
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    ox, oy = (min(xs)+max(xs))/2, (min(ys)+max(ys))/2
    mapped = [((x-ox)*scale + cx, (y-oy)*scale + cy) for x, y in pts]
    glow = Image.new("RGBA", im.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.line(mapped + [mapped[0]], fill=CYAN + (alpha_glow,), width=6, joint="curve")
    glow = glow.filter(ImageFilter.GaussianBlur(10))
    im.paste(Image.alpha_composite(im.convert("RGBA"), glow).convert("RGB"), (0, 0))
    d = ImageDraw.Draw(im, "RGBA")
    d.line(mapped + [mapped[0]], fill=CYAN + (alpha_line,), width=2, joint="curve")

for idx, name in enumerate(["product-one", "product-two"]):
    im = base_gradient()
    draw_loop(im, loops[idx], scale=1.35, cx=W_IMG*0.72, cy=H_IMG*0.52,
              alpha_line=64, alpha_glow=26)
    out = os.path.join(OUT_DIR, f"{name}.jpg")
    im.save(out, quality=84, optimize=True)
    print("wrote", out)
