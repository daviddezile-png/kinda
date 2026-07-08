"""
KINDA — DISCOVER FINALE ART (Pollinations + rembg, same pipeline as
scripts/gen-3d-character.py and scripts/gen-decor.py).

Generates ONE still scene — the teacher and a small group of children
clapping/celebrating together — for the end-of-discovery-tour celebration
screen (replaces the bare "party" balloon icon there). Uses the exact same
IDENTITY clause as gen-3d-character.py so the teacher is recognizably the same
character, plus a group-of-children clause, and is bottom-aligned like the
character frames (a standing scene, not a small centered decor prop).

100% FREE, no API key. USE: pip install rembg pillow onnxruntime
                        python scripts/gen-discover-celebration.py
OUT: public/images/character/3d/discover-celebration.png
Safe to re-run — skipped if the file already exists. Delete it to regenerate.
"""

import io
import os
import sys
import time
import urllib.parse
import urllib.request

from PIL import Image
from rembg import remove

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

OUT_PATH = os.path.join("public", "images", "character", "3d", "discover-celebration.png")
CANVAS = 768
FIGURE_H = 680
BOTTOM_PAD = 20
SEED = 88  # same identity-anchor seed as gen-3d-character.py's teacher

IDENTITY = (
    "3D Pixar-style animated character, a warm friendly African woman teacher, "
    "rich dark brown skin, short black curly natural afro hair, round dark "
    "navy-rimmed glasses, gentle warm smile, navy blue suit blazer over a crisp "
    "white collared blouse, matching navy blue knee-length pencil skirt, dark "
    "flat shoes, full body from head to shoes, standing"
)
SCENE = (
    "clapping and celebrating together with three happy diverse young children "
    "standing beside her, the children are also clapping and smiling with joy, "
    "everyone laughing, festive celebration moment"
)
STYLE = (
    "solid plain pure white background, centered group, front view, soft studio "
    "lighting, high detail, cute, wholesome, character render, no text"
)

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Kinda/1.0"}


def fetch(url, tries=7):
    delay = 8
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            return urllib.request.urlopen(req, timeout=180).read()
        except Exception as e:
            code = getattr(e, "code", None)
            if i < tries - 1:
                print(f"    {code or e} — retry in {delay}s")
                time.sleep(delay)
                delay = min(delay * 2, 120)
            else:
                raise
    raise RuntimeError("exhausted retries")


def normalize(rgba):
    bbox = rgba.getbbox()
    if not bbox:
        return rgba
    fig = rgba.crop(bbox)
    scale = FIGURE_H / fig.height
    w = max(1, round(fig.width * scale))
    h = max(1, round(fig.height * scale))
    if w > CANVAS - 16:
        scale *= (CANVAS - 16) / w
        w = max(1, round(fig.width * scale))
        h = max(1, round(fig.height * scale))
    fig = fig.resize((w, h), Image.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    x = (CANVAS - w) // 2
    y = CANVAS - BOTTOM_PAD - h
    canvas.paste(fig, (x, y), fig)
    return canvas


def main():
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    if os.path.exists(OUT_PATH):
        print(f"SKIP (exists): {OUT_PATH}")
        return
    prompt = f"{IDENTITY}, {SCENE}, {STYLE}"
    url = (
        "https://image.pollinations.ai/prompt/"
        + urllib.parse.quote(prompt)
        + f"?width=768&height=768&nologo=true&seed={SEED}"
    )
    print("Generating discover-celebration.png …")
    raw = fetch(url)
    img = Image.open(io.BytesIO(raw)).convert("RGBA")
    frame = normalize(remove(img))  # transparent cut-out — no background
    frame.save(OUT_PATH)
    print(f"OK  saved {OUT_PATH}")


if __name__ == "__main__":
    main()
