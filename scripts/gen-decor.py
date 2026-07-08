"""
KINDA — DECOR IMAGE GENERATOR  (replaces the UI's decorative emojis)
====================================================================
Generates the app's decorative art — the things that used to be emojis in the
background and UI chrome (stars, clouds, balloons, a home, a gift, a heart…) —
as transparent PNGs in the same soft 3D-Pixar look as the Character3D mascot,
so the whole app feels like one illustrated set.

100% FREE, no API key: Pollinations AI for the image + rembg for the cut-out.
Same pipeline as scripts/gen-3d-character.py, but each item is a single small
object CENTERED on the canvas (decor floats; it doesn't stand on the ground).

USE:  pip install rembg pillow numpy onnxruntime
      python scripts/gen-decor.py
OUT:  public/images/decor/{name}.png
Safe to re-run — existing files are skipped. NO rainbows (house style rule).
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

OUT_DIR = os.path.join("public", "images", "decor")
CANVAS = 512
MARGIN = 24  # transparent padding kept around the object

STYLE = (
    "3D Pixar-style render, glossy, smooth, cute, wholesome, kawaii, "
    "plain solid pure white background, centered, single object, soft studio "
    "lighting, high detail, no text"
)

# name → (subject prompt, seed). Colours are stated explicitly and NO rainbows
# are used, matching the app's style rules.
ITEMS = {
    # ── background floats ──
    # Celestial props are plain objects — NO faces / eyes / mouths (house rule).
    "star":      ("a single glossy golden five-pointed star, plain smooth surface, no face no eyes no mouth", 202),
    "cloud":     ("a single fluffy soft white cartoon cloud, plain smooth, no face no eyes no mouth", 303),
    "balloon":   ("a single shiny red party balloon with a curly string", 13),
    "kite":      ("a single cute diamond kite, red and teal, with a ribbon tail", 14),
    "sparkle":   ("a single glowing warm-yellow four-point sparkle star", 15),
    "butterfly": ("a single cute butterfly with sky-blue and orange wings", 16),
    "moon":      ("a single plain glossy crescent moon, pale gold, smooth surface, no face no eyes no mouth", 101),
    "sun":       ("a single glossy golden cartoon sun with simple rounded rays, plain, no face no eyes no mouth", 101),
    # ── UI chrome ──
    "home":      ("a single cozy cute little cartoon house with a red roof", 21),
    "apple":     ("a single shiny red apple with a green leaf", 22),
    "party":     ("a cheerful bunch of three party balloons tied together, red blue and yellow, celebration", 63),
    "music":     ("a single glossy teal musical note", 24),
    "backpack":  ("a single cute child's school backpack, blue", 25),
    "lock":      ("a single shiny golden padlock, closed", 26),
    "gift":      ("a single wrapped gift box with a red ribbon bow", 27),
    "bow":       ("a single cute glossy pink ribbon bow", 28),
    "heart":     ("a single glossy red love heart", 29),
    "controller":("a single cute video game controller, rounded, blue", 30),
    "bucket":    ("a single cute little pail bucket, red", 31),
    "star_badge":("a single shiny gold star medal award badge", 32),
    # ── icon replacements (retires the app's last raw emoji/glyph controls) ──
    "sound-on":  ("a single cute glossy teal speaker megaphone shape with three small sound waves coming off it", 40),
    "sound-off": ("a single cute glossy grey speaker megaphone shape with a bold red circle and diagonal red slash line crossing it out, clear mute symbol", 48),
    "repeat":    ("a single pair of curved circular arrows chasing each other forming a refresh loop, teal and white, glossy", 42),
    "pointing-hand": ("a single cute cartoon hand with the index finger pointing, warm skin tone, glossy", 43),
    "eraser":    ("a single cute pink rectangular eraser, glossy", 44),
    "timer":     ("a single cute glossy orange hourglass sand timer", 45),
    "mystery":   ("a single cute wrapped present box with a purple ribbon bow, glossy", 46),
}

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
    """Trim to the object and center it on a fixed transparent canvas so every
    decor image is the same footprint regardless of what Pollinations framed."""
    bbox = rgba.getbbox()
    if not bbox:
        return rgba
    obj = rgba.crop(bbox)
    max_side = CANVAS - 2 * MARGIN
    scale = min(max_side / obj.width, max_side / obj.height)
    w = max(1, round(obj.width * scale))
    h = max(1, round(obj.height * scale))
    obj = obj.resize((w, h), Image.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.paste(obj, ((CANVAS - w) // 2, (CANVAS - h) // 2), obj)
    return canvas


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print("=" * 56)
    print("KINDA — DECOR IMAGE GENERATOR (Pollinations + rembg)")
    print("=" * 56)
    total = len(ITEMS)
    done = skipped = errors = 0
    for i, (name, (subject, seed)) in enumerate(ITEMS.items(), 1):
        out_path = os.path.join(OUT_DIR, f"{name}.png")
        tag = f"[{i}/{total}] {name}"
        if os.path.exists(out_path):
            print(f"{tag}  SKIP")
            skipped += 1
            continue
        print(f"{tag}  generating…")
        try:
            prompt = f"{subject}, {STYLE}"
            url = (
                "https://image.pollinations.ai/prompt/"
                + urllib.parse.quote(prompt)
                + f"?width=512&height=512&nologo=true&seed={seed}"
            )
            raw = fetch(url)
            img = Image.open(io.BytesIO(raw)).convert("RGBA")
            frame = normalize(remove(img))
            frame.save(out_path)
            print(f"    ✓ saved {out_path}")
            done += 1
        except Exception as e:
            print(f"    ✗ FAILED: {e}")
            errors += 1
        time.sleep(1.0)
    print("=" * 56)
    print(f"FINISHED  generated:{done}  skipped:{skipped}  errors:{errors}")
    print("=" * 56)


if __name__ == "__main__":
    main()
