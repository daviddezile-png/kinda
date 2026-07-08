"""
Background remover for Kinda game tiles.
=========================================
Uses rembg (U^2-Net) to cut out the subject of each single-object picture so it
sits cleanly on the coloured game surfaces. Scene/action pictures (eat-*, drink-*,
…) are intentionally NOT processed — they need their background for context.

Usage:
    pip install rembg onnxruntime pillow
    python scripts/remove-bg.py            # writes <name>-cutout.png next to each
    python scripts/remove-bg.py --force    # re-cut even if the cutout exists

Non-destructive: originals are never modified; a new transparent PNG is written.
The first run downloads the ~176 MB U^2-Net model once (needs internet).
"""

import io
import os
import sys

from PIL import Image
from rembg import new_session, remove

IMG_DIR = "public/images/image"

# Single-object tiles that appear as small game pieces — these benefit from a
# transparent background. (Names are current filenames in IMG_DIR.)
OBJECTS = [
    "airplane.png", "ant.png", "avocado.png", "ball.png", "bird.jpg", "car.jpg",
    "cat.png", "coconut.jpg", "dog.png", "door.jpg", "egg.png", "fish.png",
    "flower.png", "gate.jpg", "goat.png", "guava.jpg", "hat.jpg", "hen.png",
    "house.png", "juice.png", "key.jpg", "kite.jpg", "lollpop.jpg", "mango.jpg",
    "milk.jpg", "net.jpg", "orange.jpg", "papaya.jpg", "pen.png", "pig.jpg",
    "pinapple.jpg", "queen.png", "rice.jpg", "salt.png", "shoe.jpg", "spoon.jpg",
    "sun.png", "table.png", "tea.jpg", "tomato.jpg", "toothbrush.png", "tree.jpg",
    "umbrella.jpg", "van.jpg", "water.jpg", "watermelon.jpg", "window.jpg",
    "x-ray.png", "yolk.png", "zebra.jpg", "zip.jpg",
]


def coverage(img: Image.Image) -> float:
    """Fraction of pixels that are (mostly) opaque after cutout."""
    a = img.convert("RGBA").getchannel("A")
    hist = a.histogram()
    opaque = sum(hist[200:])  # alpha >= 200
    total = sum(hist)
    return opaque / total if total else 0.0


def main() -> None:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    force = "--force" in sys.argv
    session = new_session("u2net")

    good, flagged, skipped = [], [], []
    for name in OBJECTS:
        src = os.path.join(IMG_DIR, name)
        if not os.path.exists(src):
            print(f"  [missing] {name}")
            continue
        stem = os.path.splitext(name)[0]
        out = os.path.join(IMG_DIR, f"{stem}-cutout.png")
        if os.path.exists(out) and not force:
            skipped.append(name)
            continue

        with open(src, "rb") as fh:
            cut = remove(fh.read(), session=session)
        img = Image.open(io.BytesIO(cut)).convert("RGBA")
        img.save(out)

        cov = coverage(img)
        tag = f"{stem}-cutout.png  ({cov*100:4.1f}% subject)"
        # A healthy cutout keeps a sensible chunk of the image but not all of it.
        if 0.04 <= cov <= 0.95:
            good.append(tag)
            print(f"  ok   {tag}")
        else:
            flagged.append(tag)
            print(f"  !!   {tag}  <- REVIEW (subject may be erased or bg not removed)")

    print("\n" + "=" * 50)
    print(f"cut cleanly : {len(good)}")
    print(f"review      : {len(flagged)}")
    for t in flagged:
        print(f"    - {t}")
    print(f"skipped(had cutout): {len(skipped)}")


if __name__ == "__main__":
    main()
