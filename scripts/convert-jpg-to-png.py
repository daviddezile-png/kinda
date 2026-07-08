"""
One-off: convert every leftover .jpg (and the malformed "sun .jpg") under
public/images/{things,actions} to .png, deleting the source file, and fix the
two things/ files that were missing entirely (sun.png, window.png didn't exist
even though lib/wordImages.ts already pointed at them).

Run from the repo root: python scripts/convert-jpg-to-png.py
"""

import os
from PIL import Image

BASE = os.path.join("public", "images")

# (source relative path, destination relative path)
CONVERSIONS = [
    # things/ — fixes lib/wordImages.ts IMAGES["window"] / IMAGES["sun"] +
    # ALTERNATES["sun"], which pointed at files that didn't exist.
    ("things/window.jpg", "things/window.png"),
    ("things/sun .jpg", "things/sun-2.png"),
    # actions/ — 17 photos that were still .jpg
    ("actions/bird-sit-on-tree.jpg", "actions/bird-sit-on-tree.png"),
    ("actions/child-plant-flower.jpg", "actions/child-plant-flower.png"),
    ("actions/child-weared-shoes.jpg", "actions/child-weared-shoes.png"),
    ("actions/docter-puppy-x-ray.jpg", "actions/docter-puppy-x-ray.png"),
    ("actions/duck-swim.jpg", "actions/duck-swim.png"),
    ("actions/father-drive-car.jpg", "actions/father-drive-car.png"),
    ("actions/girl-open-door.jpg", "actions/girl-open-door.png"),
    ("actions/glass-receive-milk.jpg", "actions/glass-receive-milk.png"),
    ("actions/hen-eat-worm.jpg", "actions/hen-eat-worm.png"),
    ("actions/men-fishing-net.jpg", "actions/men-fishing-net.png"),
    ("actions/monkey-eat-banana.jpg", "actions/monkey-eat-banana.png"),
    ("actions/owl-fly.jpg", "actions/owl-fly.png"),
    ("actions/passanger-airplane.jpg", "actions/passanger-airplane.png"),
    ("actions/playing-ball.jpg", "actions/playing-ball.png"),
    ("actions/rabbit-eat.jpg", "actions/rabbit-eat.png"),
    ("actions/spoon-carry-icecream.jpg", "actions/spoon-carry-icecream.png"),
    ("actions/yolk-fry.jpg", "actions/yolk-fry.png"),
]

# things/sun1.png already exists and is already a PNG — it just needs the
# canonical name lib/wordImages.ts expects (IMAGES["sun"] -> sun.png).
RENAMES = [
    ("things/sun1.png", "things/sun.png"),
]


def convert(src_rel, dst_rel):
    src = os.path.join(BASE, src_rel)
    dst = os.path.join(BASE, dst_rel)
    if not os.path.exists(src):
        print(f"SKIP (missing source): {src_rel}")
        return
    if os.path.exists(dst):
        print(f"SKIP (dest exists): {dst_rel}")
        return
    img = Image.open(src).convert("RGBA")
    img.save(dst, "PNG")
    os.remove(src)
    print(f"OK  {src_rel} -> {dst_rel}")


def rename(src_rel, dst_rel):
    src = os.path.join(BASE, src_rel)
    dst = os.path.join(BASE, dst_rel)
    if not os.path.exists(src):
        print(f"SKIP (missing source): {src_rel}")
        return
    if os.path.exists(dst):
        print(f"SKIP (dest exists): {dst_rel}")
        return
    os.rename(src, dst)
    print(f"OK  {src_rel} -> {dst_rel}")


def main():
    for src, dst in CONVERSIONS:
        convert(src, dst)
    for src, dst in RENAMES:
        rename(src, dst)


if __name__ == "__main__":
    main()
