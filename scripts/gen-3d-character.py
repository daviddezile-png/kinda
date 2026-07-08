"""
KINDA — 3D CHARACTER FRAME GENERATOR  (replaces the Lottie rig)
================================================================
Generates the app's mascot "Madam" — a warm 3D African female teacher modelled
on public/images/character/madam.jpg (kept as madam.jpg at the repo root) — as a
set of transparent PNG frames per character state. The <Character3D> component
flips through a state's frames like a flip-book, so a few still poses read as one
figure moving (welcoming, pointing, celebrating, looking sad, chewing...).

100% FREE, no API key:
  • Images    : Pollinations AI  (https://image.pollinations.ai)  — free text→image
  • Cut-out   : rembg            — removes the background to a clean alpha matte

HOW TO USE
  1. pip install rembg pillow numpy onnxruntime
  2. python scripts/gen-3d-character.py
  3. Frames land in  public/images/character/3d/{state}-{n}.png
     plus a manifest  public/images/character/3d/manifest.json

Safe to re-run: existing frames are skipped. Delete a frame (or the whole 3d/
folder) to regenerate it.

WHY THE FRAMES LINE UP
  Pollinations is not temporally consistent, so two raw generations of "the same
  guy" jump around in size and position. Two things keep the flip-book steady:
    1. An identical IDENTITY prompt + a single fixed SEED for every frame, so the
       character keeps the same face / clothes / style; only the POSE clause moves.
    2. After cut-out each frame is trimmed to the figure, scaled to a constant
       height and bottom-aligned on a fixed canvas — so the teacher stays the same
       size and stands on the same ground line from frame to frame.
"""

import io
import json
import os
import sys
import time
import urllib.parse
import urllib.request

import numpy as np
from PIL import Image
from rembg import remove

# Windows consoles default to cp1252 and choke on the ✓ / ✗ progress glyphs.
# Force UTF-8 so a plain `python scripts/gen-3d-character.py` never crashes.
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

# ── Output ───────────────────────────────────────────────────────────────────
OUT_DIR = os.path.join("public", "images", "character", "3d")
CANVAS = 512          # square frame the component draws into
FIGURE_H = 470        # the character is scaled to this height on every frame …
BOTTOM_PAD = 16       # … and its feet sit this many px above the bottom edge
SEED = 88             # one fixed seed for the whole character (identity anchor)

# ── Identity lock ────────────────────────────────────────────────────────────
# Kept WORD-FOR-WORD identical on every frame so the character does not change
# between poses. Only the per-frame pose clause below is swapped in. This
# describes "Madam" — the teacher in madam.jpg — as tightly as possible so every
# generated pose reads as the same woman: warm African female teacher, natural
# afro, round glasses, navy skirt-suit over a white blouse.
IDENTITY = (
    "3D Pixar-style animated character, a warm friendly African woman teacher, "
    "rich dark brown skin, short black curly natural afro hair, round dark "
    "navy-rimmed glasses, gentle warm smile, navy blue suit blazer over a crisp "
    "white collared blouse, matching navy blue knee-length pencil skirt, dark "
    "flat shoes, full body from head to shoes, standing"
)
STYLE = (
    "solid plain pure white background, centered, front view, soft studio "
    "lighting, high detail, cute, wholesome, character render"
)

# ── Per-state pose flip-books ────────────────────────────────────────────────
# Each state is a short loop of poses. Keep poses close together so consecutive
# frames read as a small movement rather than a scene change.
STATES = {
    # She greets the child first (used on the discovery welcome screen), so keep
    # this warm and unmistakably a "hello, come in" gesture.
    "welcome": [
        "both arms open wide in a warm welcoming gesture, big happy smile, greeting",
        "one hand raised waving hello, other arm open, warm welcoming smile",
        "both hands held to her heart then opening outward in welcome, joyful smile",
    ],
    "idle": [
        "arms resting at her sides, relaxed and calm",
        "arms at her sides, weight shifted slightly, gently swaying",
    ],
    "teaching": [
        "one index finger raised pointing upward, mouth open explaining a lesson",
        "one open hand extended to the side presenting, mouth open talking",
        "both hands raised mid-gesture explaining, mouth open talking",
    ],
    "pointing": [
        "one arm extended pointing downward, encouraging smile",
        "one arm extended pointing downward, leaning forward slightly, encouraging smile",
    ],
    "sad": [
        "shoulders slumped, both hands clasped low in front of her, gentle sad "
        "expression with a downturned mouth",
        "one hand resting on her cheek, looking down sadly, slight frown",
    ],
    "happy": [
        "both hands giving a big thumbs up, joyful smile",
        "clapping her two hands together in front of her, joyful smile",
    ],
    "excited": [
        "jumping up with both arms raised high, thrilled open-mouth smile",
        "both fists raised up cheering, thrilled open-mouth smile",
        "arms thrown up in the air, jumping with excitement, huge smile",
    ],
    "celebrating": [
        "both arms raised high in celebration, huge happy laugh",
        "arms stretched wide open celebrating, joyful laugh",
        "one fist punching the air in celebration, huge happy laugh",
    ],
    "nom_nom": [
        "holding a piece of food up to her mouth about to take a bite, happy",
        "chewing food with one hand near her mouth, cheeks full, content smile",
    ],
    "watching": [
        "one hand resting on her chin watching attentively, curious smile",
        "looking to the side attentively with a hand near her face, curious smile",
    ],
}

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Kinda/1.0"}


def fetch(url, tries=7):
    """GET with exponential backoff — Pollinations rate-limits anonymous callers."""
    delay = 8
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            return urllib.request.urlopen(req, timeout=180).read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 403, 500, 502, 503, 520) and i < tries - 1:
                print(f"    {e.code} — backing off {delay}s")
                time.sleep(delay)
                delay = min(delay * 2, 120)
            else:
                raise
        except Exception as e:  # transient network / timeout
            if i < tries - 1:
                print(f"    {e} — retrying in {delay}s")
                time.sleep(delay)
                delay = min(delay * 2, 120)
            else:
                raise
    raise RuntimeError("exhausted retries")


def normalize(rgba):
    """Trim to the figure, scale to a constant height, bottom-align on a fixed
    square canvas so every frame of a state lines up when flipped through."""
    bbox = rgba.getbbox()
    if not bbox:
        return rgba
    fig = rgba.crop(bbox)
    scale = FIGURE_H / fig.height
    w = max(1, round(fig.width * scale))
    h = max(1, round(fig.height * scale))
    # Never let a wide pose (arms out) spill past the canvas.
    if w > CANVAS - 8:
        scale *= (CANVAS - 8) / w
        w = max(1, round(fig.width * scale))
        h = max(1, round(fig.height * scale))
    fig = fig.resize((w, h), Image.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    x = (CANVAS - w) // 2
    y = CANVAS - BOTTOM_PAD - h
    canvas.paste(fig, (x, y), fig)
    return canvas


def build_prompt(pose):
    return f"{IDENTITY}, {pose}, {STYLE}"


def write_manifest(counts):
    with open(os.path.join(OUT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(counts, f, indent=2)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print("=" * 56)
    print("KINDA — 3D CHARACTER FRAME GENERATOR")
    print("Pollinations (free) + rembg cut-out")
    print("=" * 56)

    total = sum(len(v) for v in STATES.values())
    counts = {}
    done = skipped = errors = 0
    i = 0
    for state, poses in STATES.items():
        counts[state] = len(poses)
        for n, pose in enumerate(poses, 1):
            i += 1
            out_path = os.path.join(OUT_DIR, f"{state}-{n}.png")
            tag = f"[{i}/{total}] {state}-{n}"
            if os.path.exists(out_path):
                print(f"{tag}  SKIP (exists)")
                skipped += 1
                continue
            print(f"{tag}  generating…")
            try:
                url = (
                    "https://image.pollinations.ai/prompt/"
                    + urllib.parse.quote(build_prompt(pose))
                    + f"?width=512&height=512&nologo=true&seed={SEED}"
                )
                raw = fetch(url)
                img = Image.open(io.BytesIO(raw)).convert("RGBA")
                cut = remove(img)              # background → transparent
                frame = normalize(cut)         # align size + ground line
                frame.save(out_path)
                print(f"    ✓ saved {out_path}")
                done += 1
            except Exception as e:
                print(f"    ✗ FAILED: {e}")
                errors += 1
            # keep the manifest truthful as we go, so the app can use whatever
            # has been generated so far even if a later frame fails.
            write_manifest(counts)
            time.sleep(1.0)  # be polite to the free endpoint

    write_manifest(counts)
    print("=" * 56)
    print(f"FINISHED  generated:{done}  skipped:{skipped}  errors:{errors}")
    print(f"Frames + manifest in {OUT_DIR}")
    print("=" * 56)


if __name__ == "__main__":
    main()
