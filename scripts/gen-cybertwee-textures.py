"""
Generate seamless tiling pixel-art textures for a cybertwee 3D scroll engine.
All textures are small (16x16 or 32x32) and designed to tile seamlessly.
"""

from PIL import Image, ImageDraw
import random
import math
import os

OUT = "/Users/violetforest/Documents/dev/violetforest/public/cybertwee/textures"
os.makedirs(OUT, exist_ok=True)

random.seed(42)  # reproducible

# ── Palette ──────────────────────────────────────────────
DARK_PURPLE   = (42, 26, 58)
MID_PURPLE    = (58, 36, 74)
DEEP_PLUM     = (48, 20, 60)
SOFT_LILAC    = (180, 160, 210)
LAVENDER      = (200, 180, 230)
PINK          = (255, 182, 193)
HOT_PINK      = (255, 105, 180)
DEEP_PINK     = (255, 20, 147)
BLUSH         = (255, 228, 240)
PLUM          = (221, 160, 221)
BABY_BLUE     = (180, 210, 240)
SOFT_CYAN     = (170, 220, 230)
WHITE_GLOW    = (255, 240, 250)
CREAM         = (255, 245, 248)
WARM_WHITE    = (250, 235, 245)
DARK_FLOOR    = (35, 20, 48)
GRID_LINE     = (70, 45, 90)
GRID_GLOW     = (255, 130, 200, 120)
STAR_WHITE    = (255, 255, 255)
STAR_PINK     = (255, 200, 220)


def lerp_color(c1, c2, t):
    """Linearly interpolate between two RGB colors."""
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FLOOR — dark techy grid with pink glow lines
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def make_floor(size=32):
    img = Image.new("RGB", (size, size), DARK_FLOOR)
    draw = ImageDraw.Draw(img)

    # subtle noise base
    for y in range(size):
        for x in range(size):
            noise = random.randint(-8, 8)
            r, g, b = DARK_FLOOR
            img.putpixel((x, y), (
                max(0, min(255, r + noise)),
                max(0, min(255, g + noise - 2)),
                max(0, min(255, b + noise + 3)),
            ))

    # grid lines
    for i in range(0, size, 8):
        for j in range(size):
            # horizontal
            base = img.getpixel((j, i % size))
            img.putpixel((j, i % size), lerp_color(base, GRID_LINE, 0.7))
            # vertical
            base = img.getpixel((i % size, j))
            img.putpixel((i % size, j), lerp_color(base, GRID_LINE, 0.7))

    # glow at intersections
    for gx in range(0, size, 8):
        for gy in range(0, size, 8):
            for dx in range(-1, 2):
                for dy in range(-1, 2):
                    px, py = (gx + dx) % size, (gy + dy) % size
                    dist = abs(dx) + abs(dy)
                    intensity = 0.5 if dist == 0 else 0.2
                    base = img.getpixel((px, py))
                    glow = HOT_PINK
                    img.putpixel((px, py), lerp_color(base, glow, intensity))

    # occasional pink accent dots
    for _ in range(6):
        x, y = random.randint(0, size - 1), random.randint(0, size - 1)
        img.putpixel((x, y), lerp_color(DARK_FLOOR, PINK, 0.3))

    img.save(os.path.join(OUT, "floor.png"))
    print("  floor.png")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CEILING — dark sky with tiny stars and sparkles
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def make_ceiling(size=32):
    img = Image.new("RGB", (size, size))

    # gradient-ish dark base with subtle variation
    for y in range(size):
        for x in range(size):
            t = y / size
            base = lerp_color((20, 10, 35), (35, 15, 50), t)
            noise = random.randint(-5, 5)
            img.putpixel((x, y), (
                max(0, min(255, base[0] + noise)),
                max(0, min(255, base[1] + noise)),
                max(0, min(255, base[2] + noise + 2)),
            ))

    # stars — white and pink dots
    star_positions = [(5, 3), (12, 7), (25, 2), (18, 22), (3, 19),
                      (28, 14), (8, 28), (22, 10), (15, 30), (30, 26),
                      (1, 12), (20, 5)]
    for i, (sx, sy) in enumerate(star_positions):
        sx, sy = sx % size, sy % size
        color = STAR_WHITE if i % 3 != 0 else STAR_PINK
        brightness = random.uniform(0.5, 1.0)
        img.putpixel((sx, sy), lerp_color(img.getpixel((sx, sy)), color, brightness))

    # a few slightly larger "sparkle" crosses
    sparkles = [(10, 15), (26, 8), (4, 25)]
    for sx, sy in sparkles:
        sx, sy = sx % size, sy % size
        color = PLUM
        img.putpixel((sx, sy), lerp_color(img.getpixel((sx, sy)), WHITE_GLOW, 0.9))
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = (sx + dx) % size, (sy + dy) % size
            img.putpixel((nx, ny), lerp_color(img.getpixel((nx, ny)), color, 0.4))

    img.save(os.path.join(OUT, "ceiling.png"))
    print("  ceiling.png")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# WALL 1 — soft pink/purple brick-like panels with glowing seams
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def make_wall1(size=32):
    img = Image.new("RGB", (size, size))
    draw = ImageDraw.Draw(img)

    # panel pattern: rows of 8px tall bricks, offset every other row
    brick_h = 8
    brick_w = 16

    for y in range(size):
        row = y // brick_h
        offset = (brick_w // 2) if row % 2 == 1 else 0
        for x in range(size):
            # which brick are we in?
            bx = ((x + offset) % size) // brick_w
            by = row

            # seam detection
            is_h_seam = (y % brick_h == 0)
            is_v_seam = ((x + offset) % brick_w == 0)

            if is_h_seam or is_v_seam:
                # glowing seam
                img.putpixel((x, y), lerp_color(DEEP_PLUM, HOT_PINK, 0.35))
            else:
                # brick face with subtle variation
                seed = (bx * 7 + by * 13) % 5
                base_colors = [MID_PURPLE, DEEP_PLUM, (55, 30, 70), (50, 28, 65), (45, 25, 62)]
                base = base_colors[seed]
                noise = random.randint(-6, 6)
                img.putpixel((x, y), (
                    max(0, min(255, base[0] + noise)),
                    max(0, min(255, base[1] + noise)),
                    max(0, min(255, base[2] + noise + 2)),
                ))

    # add a few pink accent pixels scattered on bricks
    for _ in range(12):
        x, y = random.randint(0, size - 1), random.randint(0, size - 1)
        if y % brick_h != 0:
            img.putpixel((x, y), lerp_color(img.getpixel((x, y)), PINK, 0.25))

    img.save(os.path.join(OUT, "wall1.png"))
    print("  wall1.png")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# WALL 2 — circuit-trace / tech panel with softer colors
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def make_wall2(size=32):
    img = Image.new("RGB", (size, size))

    # dark base
    for y in range(size):
        for x in range(size):
            noise = random.randint(-4, 4)
            r, g, b = (30, 18, 42)
            img.putpixel((x, y), (
                max(0, min(255, r + noise)),
                max(0, min(255, g + noise)),
                max(0, min(255, b + noise + 2)),
            ))

    # horizontal "circuit traces"
    traces_h = [4, 12, 20, 28]
    for ty in traces_h:
        ty = ty % size
        for x in range(size):
            # traces aren't continuous — they have gaps
            segment = (x // 6) % 3
            if segment != 2:  # gap every 3rd segment
                img.putpixel((x, ty), lerp_color(img.getpixel((x, ty)), SOFT_LILAC, 0.5))

    # vertical traces
    traces_v = [8, 24]
    for tx in traces_v:
        tx = tx % size
        for y in range(size):
            segment = (y // 8) % 3
            if segment != 0:
                img.putpixel((tx, y), lerp_color(img.getpixel((tx, y)), BABY_BLUE, 0.45))

    # nodes at intersections
    for ty in traces_h:
        for tx in traces_v:
            ty, tx = ty % size, tx % size
            img.putpixel((tx, ty), lerp_color(img.getpixel((tx, ty)), PINK, 0.8))
            # glow around node
            for dx in range(-1, 2):
                for dy in range(-1, 2):
                    if dx == 0 and dy == 0:
                        continue
                    nx, ny = (tx + dx) % size, (ty + dy) % size
                    img.putpixel((nx, ny), lerp_color(img.getpixel((nx, ny)), HOT_PINK, 0.25))

    # tiny dot accents
    for _ in range(8):
        x, y = random.randint(0, size - 1), random.randint(0, size - 1)
        img.putpixel((x, y), lerp_color(img.getpixel((x, y)), PLUM, 0.35))

    img.save(os.path.join(OUT, "wall2.png"))
    print("  wall2.png")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# WALL 3 — decorative / accent wall with heart/diamond motif
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def make_wall3(size=32):
    img = Image.new("RGB", (size, size))

    # base: slightly warmer purple
    for y in range(size):
        for x in range(size):
            t = (math.sin(x * 0.3) * math.sin(y * 0.3) + 1) / 2
            base = lerp_color((40, 22, 55), (52, 30, 68), t)
            noise = random.randint(-4, 4)
            img.putpixel((x, y), (
                max(0, min(255, base[0] + noise)),
                max(0, min(255, base[1] + noise)),
                max(0, min(255, base[2] + noise)),
            ))

    # diamond/lozenge pattern
    diamond_size = 8
    for cy in range(diamond_size, size, diamond_size * 2):
        for cx in range(diamond_size, size, diamond_size * 2):
            for d in range(diamond_size):
                for dx in range(-d, d + 1):
                    # top half
                    px = (cx + dx) % size
                    py = (cy - diamond_size + d) % size
                    if abs(dx) == d:  # outline only
                        img.putpixel((px, py), lerp_color(img.getpixel((px, py)), PINK, 0.45))
                    # bottom half
                    py2 = (cy + diamond_size - d) % size
                    if abs(dx) == d:
                        img.putpixel((px, py2), lerp_color(img.getpixel((px, py2)), PINK, 0.45))

    # center dots of each diamond
    for cy in range(diamond_size, size, diamond_size * 2):
        for cx in range(diamond_size, size, diamond_size * 2):
            img.putpixel((cx % size, cy % size),
                        lerp_color(img.getpixel((cx % size, cy % size)), WHITE_GLOW, 0.7))

    img.save(os.path.join(OUT, "wall3.png"))
    print("  wall3.png")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ENTITY SPRITES — small animated-looking sprites
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def make_crystal(size=32):
    """A floating crystal/gem sprite."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cx, cy = size // 2, size // 2

    # diamond shape
    points = [
        (cx, cy - 12),      # top
        (cx + 7, cy - 2),   # right
        (cx, cy + 12),      # bottom
        (cx - 7, cy - 2),   # left
    ]

    # fill the diamond
    for y in range(size):
        for x in range(size):
            # point-in-diamond test using cross products
            inside = True
            for i in range(4):
                x1, y1 = points[i]
                x2, y2 = points[(i + 1) % 4]
                cross = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)
                if cross < 0:
                    inside = False
                    break

            if inside:
                # gradient from top to bottom
                t = (y - (cy - 12)) / 24
                t = max(0, min(1, t))

                # left-right shading
                lr = abs(x - cx) / 7
                lr = max(0, min(1, lr))

                if t < 0.4:
                    color = lerp_color(WHITE_GLOW, PINK, t * 2)
                else:
                    color = lerp_color(PINK, HOT_PINK, (t - 0.4) * 1.5)

                # edge highlight
                color = lerp_color(color, DEEP_PINK, lr * 0.3)

                img.putpixel((x, y), (*color, 255))

    # bright highlight spot
    for dx in range(-1, 2):
        for dy in range(-1, 2):
            px, py = cx - 2 + dx, cy - 6 + dy
            if 0 <= px < size and 0 <= py < size:
                a = img.getpixel((px, py))[3]
                if a > 0:
                    intensity = 0.8 if (dx == 0 and dy == 0) else 0.4
                    old = img.getpixel((px, py))[:3]
                    new = lerp_color(old, STAR_WHITE, intensity)
                    img.putpixel((px, py), (*new, 255))

    # glow pixels around edges
    glow_img = img.copy()
    for y in range(1, size - 1):
        for x in range(1, size - 1):
            if img.getpixel((x, y))[3] == 0:
                # check neighbors
                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    if img.getpixel((x + dx, y + dy))[3] > 0:
                        glow_img.putpixel((x, y), (*HOT_PINK, 80))
                        break

    glow_img.save(os.path.join(OUT, "crystal.png"))
    print("  crystal.png")


def make_heart(size=32):
    """A pixel-art heart sprite."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    # classic pixel heart pattern (16x14 centered in 32x32)
    heart = [
        "  ##  ##  ",
        " ########",
        "##########",
        "##########",
        "##########",
        " ######## ",
        "  ######  ",
        "   ####   ",
        "    ##    ",
    ]

    ox, oy = 11, 10  # offset to center

    for row_i, row in enumerate(heart):
        for col_i, ch in enumerate(row):
            if ch == '#':
                x, y = ox + col_i, oy + row_i
                if 0 <= x < size and 0 <= y < size:
                    # gradient: lighter at top
                    t = row_i / len(heart)
                    color = lerp_color(PINK, DEEP_PINK, t)
                    img.putpixel((x, y), (*color, 255))
                    # double up pixels for chunkier look
                    if x + 1 < size:
                        img.putpixel((x + 1, y), (*color, 255))

    # highlight on upper left
    for pos in [(12, 11), (13, 11), (12, 12)]:
        if img.getpixel(pos)[3] > 0:
            img.putpixel(pos, (*WHITE_GLOW, 255))

    img.save(os.path.join(OUT, "heart.png"))
    print("  heart.png")


def make_star_sprite(size=32):
    """A sparkle/star collectible sprite."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cx, cy = size // 2, size // 2

    # 4-pointed star
    # vertical line
    for d in range(-8, 9):
        y = cy + d
        if 0 <= y < size:
            intensity = 1.0 - abs(d) / 8.0
            color = lerp_color(PLUM, WHITE_GLOW, intensity)
            width = max(1, int(3 * (1 - abs(d) / 8)))
            for w in range(-width // 2, width // 2 + 1):
                x = cx + w
                if 0 <= x < size:
                    img.putpixel((x, y), (*color, int(255 * max(0.3, intensity))))

    # horizontal line
    for d in range(-8, 9):
        x = cx + d
        if 0 <= x < size:
            intensity = 1.0 - abs(d) / 8.0
            color = lerp_color(BABY_BLUE, WHITE_GLOW, intensity)
            width = max(1, int(3 * (1 - abs(d) / 8)))
            for w in range(-width // 2, width // 2 + 1):
                y = cy + w
                if 0 <= y < size:
                    existing = img.getpixel((x, y))
                    if existing[3] > 0:
                        old = existing[:3]
                        new = lerp_color(old, color, 0.5)
                        img.putpixel((x, y), (*new, min(255, existing[3] + int(100 * intensity))))
                    else:
                        img.putpixel((x, y), (*color, int(255 * max(0.3, intensity))))

    # diagonal accents (shorter)
    for d in range(-4, 5):
        intensity = 1.0 - abs(d) / 4.0
        color = lerp_color(PLUM, PINK, intensity)
        alpha = int(180 * max(0.2, intensity))
        for dx, dy in [(d, d), (d, -d)]:
            x, y = cx + dx, cy + dy
            if 0 <= x < size and 0 <= y < size:
                existing = img.getpixel((x, y))
                if existing[3] > 0:
                    old = existing[:3]
                    new = lerp_color(old, color, 0.3)
                    img.putpixel((x, y), (*new, min(255, existing[3] + alpha // 2)))
                else:
                    img.putpixel((x, y), (*color, alpha))

    # bright center
    for dx in range(-1, 2):
        for dy in range(-1, 2):
            img.putpixel((cx + dx, cy + dy), (*STAR_WHITE, 255))

    img.save(os.path.join(OUT, "sparkle.png"))
    print("  sparkle.png")


def make_flower(size=32):
    """A kawaii flower sprite."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cx, cy = size // 2, size // 2

    # 5 petals around center
    petal_r = 5
    center_r = 3
    petal_dist = 6

    angles = [i * 2 * math.pi / 5 - math.pi / 2 for i in range(5)]

    for angle in angles:
        pcx = cx + int(petal_dist * math.cos(angle))
        pcy = cy + int(petal_dist * math.sin(angle))
        for dy in range(-petal_r, petal_r + 1):
            for dx in range(-petal_r, petal_r + 1):
                dist = math.sqrt(dx * dx + dy * dy)
                if dist <= petal_r:
                    x, y = pcx + dx, pcy + dy
                    if 0 <= x < size and 0 <= y < size:
                        t = dist / petal_r
                        color = lerp_color(BLUSH, PINK, t)
                        alpha = int(255 * (1 - t * 0.3))
                        existing = img.getpixel((x, y))
                        if existing[3] > alpha:
                            continue
                        img.putpixel((x, y), (*color, alpha))

    # center
    for dy in range(-center_r, center_r + 1):
        for dx in range(-center_r, center_r + 1):
            dist = math.sqrt(dx * dx + dy * dy)
            if dist <= center_r:
                x, y = cx + dx, cy + dy
                if 0 <= x < size and 0 <= y < size:
                    t = dist / center_r
                    color = lerp_color((255, 255, 200), (255, 230, 150), t)
                    img.putpixel((x, y), (*color, 255))

    # eyes (kawaii)
    for ex in [-1, 1]:
        img.putpixel((cx + ex, cy - 1), (40, 20, 40, 255))

    # tiny smile
    img.putpixel((cx, cy + 1), (40, 20, 40, 200))

    img.save(os.path.join(OUT, "flower.png"))
    print("  flower.png")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# EXPLOSION replacement — sparkle burst (for "kill" animation)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def make_collect_spritesheet(frame_count=6, frame_size=32):
    """Sprite sheet for a 'collect' animation — expanding sparkle ring."""
    sheet = Image.new("RGBA", (frame_size * frame_count, frame_size), (0, 0, 0, 0))
    cx, cy = frame_size // 2, frame_size // 2

    for f in range(frame_count):
        t = f / (frame_count - 1)  # 0 to 1
        radius = int(3 + t * 12)
        alpha = int(255 * (1 - t * 0.8))

        for angle_i in range(8):
            angle = angle_i * math.pi / 4
            for r in range(max(0, radius - 2), radius + 1):
                x = int(cx + r * math.cos(angle)) + f * frame_size
                y = int(cy + r * math.sin(angle))
                if 0 <= x < sheet.width and 0 <= y < sheet.height:
                    inner_t = (r - (radius - 2)) / 3
                    color = lerp_color(WHITE_GLOW, HOT_PINK, inner_t)
                    sheet.putpixel((x, y), (*color, alpha))

        # center flash (fades out)
        center_alpha = int(255 * (1 - t))
        for dx in range(-1, 2):
            for dy in range(-1, 2):
                px = cx + dx + f * frame_size
                py = cy + dy
                if 0 <= px < sheet.width:
                    sheet.putpixel((px, py), (*STAR_WHITE, center_alpha))

    sheet.save(os.path.join(OUT, "collect-burst.png"))
    print("  collect-burst.png")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RUN
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if __name__ == "__main__":
    print("Generating cybertwee textures...")
    make_floor()
    make_ceiling()
    make_wall1()
    make_wall2()
    make_wall3()
    make_crystal()
    make_heart()
    make_star_sprite()
    make_flower()
    make_collect_spritesheet()
    print(f"\nDone! {len(os.listdir(OUT))} files in {OUT}")
