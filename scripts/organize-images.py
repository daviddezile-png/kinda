"""
KINDA — IMAGE LIBRARY REORGANISATION
====================================
Retires the flat, mixed public/images/image/ folder (cutout/nobackground/(2)
variants, typos) in favour of a scheme the whole project can lean on:

    public/images/things/   one canonical TRANSPARENT PNG per object/animal
    public/images/actions/  "the thing in action" scenes, PNG (background kept
                            for context — a child needs the scene)

Rules
  • Typos are fixed once, here (crodile→crocodile, lollpop→lollipop, …).
  • For each thing the best available source wins: an existing -cutout.png,
    else a -nobackground/-removebg-preview PNG, else the plain photo is cut
    out with rembg. A coverage check catches bad cutouts (subject erased /
    background kept) and falls back to a plain PNG conversion, flagged.
  • " (2)"-style extra shots become {stem}-2.png variants; plain photos that
    merely duplicate an existing cutout are dropped.
  • EVERY old /images/image/... path referenced in data/, lib/, components/,
    app/ is rewritten to its new home, then the old folder is moved to
    _backup/images-image/ (originals kept — delete by hand when happy).

    python scripts/organize-images.py

Prints which things have a matching /audio/words/{stem}.mp3 voice clip, so the
Level-0 tour only names pictures it can actually speak.
"""

import io
import os
import re
import shutil
import sys

from PIL import Image
from rembg import new_session, remove

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

SRC = os.path.join("public", "images", "image")
THINGS = os.path.join("public", "images", "things")
ACTIONS = os.path.join("public", "images", "actions")
REF_ROOTS = ["data", "lib", "components", "app"]

# Scene pictures ("the thing in action") — keep their backgrounds.
ACTION_STEMS = {
    "banana-monkey-eat", "bird-ontree", "brushing-tooth", "cath-fish-net",
    "child-umbrella", "dog-run", "drink-juice", "drink-juice-2", "drink-milk",
    "drink-water", "eat-apple", "eat-bread", "eat-chocolate", "eat-coconut",
    "eat-guava", "eat-icecream", "eat-lollipop", "eat-lollipop-2", "eat-mango",
    "eat-papaya", "eat-pineapple", "family-eat-rice", "hen-laying-egg",
    "looking-sun", "open-door-key", "open-gate", "swim-fish", "van-move",
    "van-people", "wearing-jacket", "yum",
}

# Filename-level renames applied before anything else (typos + numbered dupes).
RENAMES = {
    "crodile": "crocodile",
    "dolfin": "dolphin",
    "lollpop": "lollipop",
    "lollpop-2": "lollipop-2",
    "pinapple": "pineapple",
    "eat-lollpop": "eat-lollipop",
    "eat-rollpop": "eat-lollipop-2",
    "eat-pinapple": "eat-pineapple",
    "fishingnet": "fishing-net",
    "ball1": "ball-2",
    "flower2": "flower-2",
    "drink-juice1": "drink-juice-2",
}

# Cutout coverage sanity band (same idea as remove-bg.py): outside it, the cut
# likely erased the subject or kept the background.
COVER_MIN, COVER_MAX = 0.03, 0.97


def parse(name):
    """-> (stem, kind) where kind is cutout|nobg|plain, after renames."""
    stem, ext = os.path.splitext(name)
    stem = re.sub(r"\s*\((\d+)\)$", r"-\1", stem)  # "x (2)" -> "x-2"
    kind = "plain"
    for suf, k in (("-cutout", "cutout"), ("-nobackground", "nobg"), ("-removebg-preview", "nobg")):
        if stem.endswith(suf):
            stem, kind = stem[: -len(suf)], k
            break
    stem = RENAMES.get(stem, stem)
    return stem, kind, ext.lower()


def coverage(img):
    hist = img.convert("RGBA").getchannel("A").histogram()
    total = sum(hist)
    return (sum(hist[200:]) / total) if total else 0.0


def main():
    os.makedirs(THINGS, exist_ok=True)
    os.makedirs(ACTIONS, exist_ok=True)
    session = new_session("u2net")

    # Group every source file by its canonical stem.
    groups = {}  # stem -> {kind: [filenames]}
    for f in sorted(os.listdir(SRC)):
        if not f.lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        stem, kind, _ = parse(f)
        groups.setdefault(stem, {}).setdefault(kind, []).append(f)

    mapping = {}   # old filename -> new rel path (for ref rewriting)
    flagged = []

    def save_png(img, out_path):
        img.save(out_path)

    def cut_or_convert(src_path, out_path, label):
        """rembg-cut a photo; fall back to plain conversion on bad coverage."""
        with open(src_path, "rb") as fh:
            data = fh.read()
        try:
            cut = Image.open(io.BytesIO(remove(data, session=session))).convert("RGBA")
            cov = coverage(cut)
            if COVER_MIN <= cov <= COVER_MAX:
                save_png(cut, out_path)
                return "cut"
        except Exception:
            pass
        Image.open(io.BytesIO(data)).convert("RGBA").save(out_path)
        flagged.append(label)
        return "plain"

    n_things = n_actions = 0
    for stem, kinds in sorted(groups.items()):
        if stem in ACTION_STEMS:
            # Action scene: straight PNG conversion, background kept.
            for kind_files in kinds.values():
                for f in kind_files:
                    out_rel = f"/images/actions/{stem}.png"
                    Image.open(os.path.join(SRC, f)).convert("RGB").save(
                        os.path.join(ACTIONS, f"{stem}.png")
                    )
                    mapping[f] = out_rel
                    n_actions += 1
            continue

        out_rel = f"/images/things/{stem}.png"
        out_path = os.path.join(THINGS, f"{stem}.png")
        # Best source wins: cutout > nobg > plain (cut it ourselves).
        if "cutout" in kinds:
            shutil.copy2(os.path.join(SRC, kinds["cutout"][0]), out_path)
        elif "nobg" in kinds:
            img = Image.open(os.path.join(SRC, kinds["nobg"][0])).convert("RGBA")
            save_png(img, out_path)
        else:
            src = kinds["plain"][0]
            how = cut_or_convert(os.path.join(SRC, src), out_path, stem)
            if how == "plain":
                pass  # flagged already
        n_things += 1
        # Every old spelling of this thing points at the canonical file.
        for kind_files in kinds.values():
            for f in kind_files:
                mapping[f] = out_rel

    # Rewrite references. Longest old path first so no prefix collisions.
    rewrites = 0
    pairs = sorted(
        ((f"/images/image/{old}", new) for old, new in mapping.items()),
        key=lambda p: -len(p[0]),
    )
    for root in REF_ROOTS:
        for dirpath, _, files in os.walk(root):
            for f in files:
                if not f.endswith((".ts", ".tsx", ".json")):
                    continue
                path = os.path.join(dirpath, f)
                with open(path, encoding="utf-8") as fh:
                    text = fh.read()
                new_text = text
                for old_rel, new_rel in pairs:
                    new_text = new_text.replace(old_rel, new_rel)
                if new_text != text:
                    with open(path, "w", encoding="utf-8") as fh:
                        fh.write(new_text)
                    rewrites += 1

    os.makedirs("_backup", exist_ok=True)
    shutil.move(SRC, os.path.join("_backup", "images-image"))

    print(f"things  : {n_things} -> {THINGS}")
    print(f"actions : {n_actions} -> {ACTIONS}")
    print(f"ref files rewritten: {rewrites}; old folder moved to _backup/images-image")
    if flagged:
        print(f"kept background (bad cutout) [{len(flagged)}]: {', '.join(flagged)}")

    # Leftover dangling refs?
    dangling = set()
    for root in REF_ROOTS:
        for dirpath, _, files in os.walk(root):
            for f in files:
                if not f.endswith((".ts", ".tsx", ".json")):
                    continue
                with open(os.path.join(dirpath, f), encoding="utf-8") as fh:
                    for rel in re.findall(r"/images/image/[^\"'`)\n]+", fh.read()):
                        dangling.add(rel.strip())
    if dangling:
        print(f"DANGLING refs still pointing at old folder ({len(dangling)}):")
        for d in sorted(dangling):
            print(f"   {d}")
    else:
        print("no refs point at the old folder ✓")

    # Voice coverage: which things can the tour actually name out loud?
    voiced, unvoiced = [], []
    for stem in sorted(s for s in groups if s not in ACTION_STEMS):
        if os.path.exists(os.path.join("public", "audio", "words", f"{stem}.mp3")):
            voiced.append(stem)
        else:
            unvoiced.append(stem)
    print(f"\nthings WITH a voice clip ({len(voiced)}): {', '.join(voiced)}")
    print(f"\nthings WITHOUT a voice clip ({len(unvoiced)}): {', '.join(unvoiced)}")


if __name__ == "__main__":
    main()
