"""
PWA icons — Madam (welcome pose) centered on the app's pink→amber gradient.
Generates public/icons/{icon-192,icon-512,icon-maskable-512,apple-icon-180}.png
from the existing character art. Pillow only; no network.

Run from the repo root:  python scripts/gen-pwa-icons.py
"""

from PIL import Image

SRC = "./public/images/character/3d/welcome-1.png"
OUT = "./public/icons"

TOP = (255, 107, 157)  # #ff6b9d
BOTTOM = (255, 194, 74)  # #ffc24a


def gradient(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size))
    for y in range(size):
        t = y / max(1, size - 1)
        row = tuple(round(a + (b - a) * t) for a, b in zip(TOP, BOTTOM))
        for x in range(size):
            img.putpixel((x, y), row)
    return img.convert("RGBA")


def make_icon(size: int, subject_ratio: float) -> Image.Image:
    """Character centered, occupying subject_ratio of the icon height.
    Maskable icons keep the subject inside the ~80% safe zone."""
    base = gradient(size)
    char = Image.open(SRC).convert("RGBA")
    target_h = round(size * subject_ratio)
    scale = target_h / char.height
    char = char.resize((round(char.width * scale), target_h), Image.LANCZOS)
    x = (size - char.width) // 2
    y = round((size - char.height) * 0.62)  # slightly low = grounded
    base.alpha_composite(char, (x, y))
    return base


def main() -> None:
    import os

    os.makedirs(OUT, exist_ok=True)
    make_icon(512, 0.86).save(f"{OUT}/icon-512.png")
    make_icon(192, 0.86).save(f"{OUT}/icon-192.png")
    make_icon(512, 0.68).save(f"{OUT}/icon-maskable-512.png")
    make_icon(180, 0.86).save(f"{OUT}/apple-icon-180.png")
    print("icons written to", OUT)


if __name__ == "__main__":
    main()
