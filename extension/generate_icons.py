"""
PagePal AI — Icon Generator
Generates all 4 required Chrome extension icons (16, 32, 48, 128 px)
using only Python's built-in libraries. No pip installs needed.

Run:  python3 generate_icons.py
Output: icons/icon16.png, icon32.png, icon48.png, icon128.png
"""

import math
import os
import struct
import zlib

# ── Brand colours ──────────────────────────────────────────────────────────
BG_TOP = (108, 99, 255)  # brand-500 purple  (top of gradient)
BG_BOTTOM = (139, 92, 246)  # violet-500        (bottom of gradient)
SHINE = (255, 255, 255)  # white highlight
BRAIN_COL = (255, 255, 255)  # icon glyph colour


# ───────────────────────────────────────────────────────────────────────────
# Minimal pure-Python PNG writer
# ───────────────────────────────────────────────────────────────────────────


def _write_chunk(chunk_type: bytes, data: bytes) -> bytes:
    c = chunk_type + data
    return (
        struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
    )


def encode_png(pixels: list, width: int, height: int) -> bytes:
    """
    pixels: flat list of (R, G, B, A) tuples, row-major order.
    Returns raw PNG bytes.
    """
    raw_rows = b""
    for y in range(height):
        raw_rows += b"\x00"  # filter type None
        for x in range(width):
            r, g, b, a = pixels[y * width + x]
            raw_rows += bytes([r, g, b, a])

    compressed = zlib.compress(raw_rows, 9)

    png = b"\x89PNG\r\n\x1a\n"  # PNG signature
    png += _write_chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
    png += _write_chunk(b"IDAT", compressed)
    png += _write_chunk(b"IEND", b"")
    return png


# ───────────────────────────────────────────────────────────────────────────
# Drawing helpers
# ───────────────────────────────────────────────────────────────────────────


def lerp(a, b, t):
    return a + (b - a) * t


def lerp_colour(c1, c2, t):
    return tuple(int(lerp(a, b, t)) for a, b in zip(c1, c2))


def dist(x1, y1, x2, y2):
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)


def make_canvas(w, h):
    """RGBA pixel buffer, fully transparent."""
    return [(0, 0, 0, 0)] * (w * h)


def put(pixels, w, x, y, colour):
    if 0 <= x < w and 0 <= y < len(pixels) // w:
        pixels[y * w + x] = colour


def blend(dst, src):
    """Alpha-composite src over dst."""
    sr, sg, sb, sa = src
    dr, dg, db, da = dst
    if sa == 0:
        return dst
    if sa == 255:
        return src
    t = sa / 255.0
    return (
        int(dr + (sr - dr) * t),
        int(dg + (sg - dg) * t),
        int(db + (sb - db) * t),
        min(255, da + int((255 - da) * t)),
    )


def aa_circle(pixels, w, cx, cy, r, colour):
    """Draw a filled, anti-aliased circle."""
    for y in range(int(cy - r - 1), int(cy + r + 2)):
        for x in range(int(cx - r - 1), int(cx + r + 2)):
            d = dist(x + 0.5, y + 0.5, cx, cy)
            alpha = max(0.0, min(1.0, r - d + 0.5))
            if alpha > 0:
                cr, cg, cb, _ = colour
                src = (cr, cg, cb, int(alpha * 255))
                idx = y * w + x
                if 0 <= x < w and 0 <= idx < len(pixels):
                    pixels[idx] = blend(pixels[idx], src)


def rounded_rect(pixels, w, h, rx, colour):
    """Fill a rounded rectangle covering the whole canvas."""
    for y in range(h):
        for x in range(w):
            # Compute distance to nearest corner arc
            cx = rx if x < rx else (w - rx - 1 if x > w - rx - 1 else x)
            cy = rx if y < rx else (h - rx - 1 if y > h - rx - 1 else y)
            if dist(x, y, cx, cy) <= rx:
                pixels[y * w + x] = colour


# ───────────────────────────────────────────────────────────────────────────
# Per-size icon painter
# ───────────────────────────────────────────────────────────────────────────


def paint_icon(size: int) -> list:
    """
    Paint a PagePal icon at `size` × `size` pixels.

    Design:
      - Rounded square background with vertical purple gradient
      - White top-right shine dot
      - Simplified brain glyph (two circles + stem) in white
    """
    s = size
    pad = max(1, s // 10)  # inner padding
    rx = s * 0.22  # corner radius

    pixels = make_canvas(s, s)

    # ── 1. Rounded-rect background with vertical gradient ─────────────────
    for y in range(s):
        for x in range(s):
            t = y / (s - 1)
            col = lerp_colour(BG_TOP, BG_BOTTOM, t)
            pixels[y * s + x] = (col[0], col[1], col[2], 255)

    # Knock out corners to make it a rounded rectangle
    ry = rx  # corner radius is symmetric
    for y in range(s):
        for x in range(s):
            cx = rx if x < rx else (s - rx if x > s - rx else x)
            cy = ry if y < ry else (s - ry if y > s - ry else y)
            if dist(x + 0.5, y + 0.5, cx + 0.5, cy + 0.5) > rx:
                pixels[y * s + x] = (0, 0, 0, 0)  # transparent corner

    # ── 2. Subtle shine in top-right ──────────────────────────────────────
    if s >= 32:
        shine_r = s * 0.14
        shine_x = s * 0.72
        shine_y = s * 0.22
        aa_circle(pixels, s, shine_x, shine_y, shine_r, (255, 255, 255, 60))

    # ── 3. Brain glyph (scales with icon size) ────────────────────────────
    #
    #  The glyph is a very simplified brain icon:
    #  Two overlapping circles (left / right hemisphere) with a small
    #  stem connector at the bottom.
    #
    gc = s * 0.50  # glyph centre x
    gy = s * 0.46  # glyph centre y
    hr = s * 0.155  # hemisphere radius
    hoff = s * 0.095  # hemisphere x-offset from centre

    # Left hemisphere
    aa_circle(pixels, s, gc - hoff, gy, hr, (255, 255, 255, 230))
    # Right hemisphere
    aa_circle(pixels, s, gc + hoff, gy, hr, (255, 255, 255, 230))

    if s >= 32:
        # Inner cutouts to give a crinkled look
        inner_r = hr * 0.52
        inner_off = hoff * 0.6
        aa_circle(
            pixels,
            s,
            gc - inner_off,
            gy - s * 0.02,
            inner_r,
            lerp_colour(BG_TOP, BG_BOTTOM, 0.4) + (210,),
        )
        aa_circle(
            pixels,
            s,
            gc + inner_off,
            gy - s * 0.02,
            inner_r,
            lerp_colour(BG_TOP, BG_BOTTOM, 0.4) + (210,),
        )

    # Stem at the bottom
    stem_w = max(1, int(s * 0.08))
    stem_h = max(1, int(s * 0.12))
    stem_x = int(gc - stem_w / 2)
    stem_y = int(gy + hr * 0.6)
    for dy in range(stem_h):
        for dx in range(stem_w):
            sx, sy = stem_x + dx, stem_y + dy
            if 0 <= sx < s and 0 <= sy < s:
                pixels[sy * s + sx] = blend(pixels[sy * s + sx], (255, 255, 255, 200))

    return pixels


# ───────────────────────────────────────────────────────────────────────────
# Entry point
# ───────────────────────────────────────────────────────────────────────────


def main():
    os.makedirs("icons", exist_ok=True)

    sizes = [16, 32, 48, 128]
    for size in sizes:
        pixels = paint_icon(size)
        png = encode_png(pixels, size, size)
        path = f"icons/icon{size}.png"
        with open(path, "wb") as f:
            f.write(png)
        print(f"  ✓ {path}  ({size}×{size}, {len(png):,} bytes)")

    print("\nAll icons generated successfully.")
    print("Reload the extension at chrome://extensions to see the new icon.")


if __name__ == "__main__":
    main()
