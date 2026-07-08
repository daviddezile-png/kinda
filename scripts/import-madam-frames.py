"""
KINDA — MADAM FRAME IMPORT (author-supplied poses)
==================================================
The content author generated Madam's poses by hand (public/inage/generated_image
(N).jpg — same woman as madam.jpg in every shot: navy skirt-suit, afro, round
glasses). This imports them as the character flip-book, replacing the
Pollinations-generated frames: each pose is background-removed with rembg, then
normalised exactly like gen-3d-character.py (constant figure height,
bottom-aligned on a 512px canvas) so the flip-book doesn't jump between frames.

    pip install rembg onnxruntime pillow
    python scripts/import-madam-frames.py

Writes public/images/character/3d/{state}-{n}.png + manifest.json, plus
welcome-hero.png cut from public/inage/madam.jpg.
"""

import io
import json
import os
import sys

from PIL import Image
from rembg import new_session, remove

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

SRC_DIR = os.path.join("public", "inage")
OUT_DIR = os.path.join("public", "images", "character", "3d")
CANVAS = 512
FIGURE_H = 470
BOTTOM_PAD = 16

# Which author pose file plays which flip-book frame. Ordered so consecutive
# frames read as one small movement (see Character3D's cross-fade).
STATES = {
    "welcome": ["generated_image (3).jpg", "generated_image (4).jpg", "generated_image (5).jpg"],
    "idle": ["generated_image (6).jpg", "generated_image (8).jpg"],
    "teaching": ["generated_image (9).jpg", "generated_image (10).jpg", "generated_image (11).jpg"],
    "pointing": ["generated_image (13).jpg", "generated_image (14).jpg"],
    "sad": ["generated_image (15).jpg", "generated_image (16).jpg"],
    "happy": ["generated_image (17).jpg", "generated_image (18).jpg"],
    "excited": ["generated_image (19).jpg", "generated_image (20).jpg", "generated_image (21).jpg"],
    "celebrating": ["generated_image (22).jpg", "generated_image (23).jpg", "generated_image (24).jpg"],
    "nom_nom": ["generated_image (25).jpg", "generated_image (26).jpg"],
    "watching": ["generated_image (27).jpg", "generated_image (28).jpg"],
}

# The big blue-background portrait doubles as the static welcome hero.
HERO_SRC = os.path.join(SRC_DIR, "madam.jpg")


def normalize(rgba):
    """Trim to the figure, scale to a constant height, bottom-align — identical
    to gen-3d-character.py so mixed sources still line up."""
    bbox = rgba.getbbox()
    if not bbox:
        return rgba
    fig = rgba.crop(bbox)
    scale = FIGURE_H / fig.height
    w = max(1, round(fig.width * scale))
    h = max(1, round(fig.height * scale))
    if w > CANVAS - 8:
        scale *= (CANVAS - 8) / w
        w = max(1, round(fig.width * scale))
        h = max(1, round(fig.height * scale))
    fig = fig.resize((w, h), Image.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.paste(fig, ((CANVAS - w) // 2, CANVAS - BOTTOM_PAD - h), fig)
    return canvas


def cut(session, src_path):
    with open(src_path, "rb") as fh:
        out = remove(fh.read(), session=session)
    return normalize(Image.open(io.BytesIO(out)).convert("RGBA"))


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    session = new_session("u2net")

    counts, errors = {}, 0
    for state, files in STATES.items():
        counts[state] = len(files)
        for n, name in enumerate(files, 1):
            src = os.path.join(SRC_DIR, name)
            dst = os.path.join(OUT_DIR, f"{state}-{n}.png")
            try:
                cut(session, src).save(dst)
                print(f"  ✓ {state}-{n}.png  <-  {name}")
            except Exception as e:
                errors += 1
                print(f"  ✗ {state}-{n}: {e}")

    with open(os.path.join(OUT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(counts, f, indent=2)

    if os.path.exists(HERO_SRC):
        cut(session, HERO_SRC).save(os.path.join(OUT_DIR, "welcome-hero.png"))
        print("  ✓ welcome-hero.png  <-  madam.jpg")

    print(f"done, errors: {errors}")


if __name__ == "__main__":
    main()
