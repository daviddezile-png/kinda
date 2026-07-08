"""
KINDA — OBJECT/ANIMAL ART IMPORT from public/inage
==================================================
The content author dropped a new, more modern set of object/animal/action
pictures in public/inage (mixed with letter art and character poses, which other
scripts handle). This script:

  1. copies every object picture into public/images/image/ under a clean
     kebab-case name (variants "x (2).jpg" become x-2.jpg),
  2. where the new file REPLACES an old one of a different extension
     (dog.png -> dog.jpg), rewrites every code/data reference and deletes the
     old file,
  3. regenerates the {stem}-cutout.png transparent cutouts (rembg) for every
     replaced/new source that has one, so games keep their clean tiles.

    python scripts/import-inage-objects.py           # steps 1+2, lists cutouts
    python scripts/import-inage-objects.py --cutouts # also re-cut (slow)
"""

import io
import os
import re
import shutil
import sys

SRC = os.path.join("public", "inage")
DST = os.path.join("public", "images", "image")
# Files where /images/image/... paths are referenced.
REF_ROOTS = ["data", "lib", "components", "app"]

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def is_object_file(name: str) -> bool:
    """Everything in inage/ root except letter art and character poses."""
    stem, ext = os.path.splitext(name)
    if ext.lower() not in (".jpg", ".jpeg", ".png"):
        return False
    base = re.sub(r"\s*\(\d+\)$", "", stem)
    if len(base) == 1:  # single-letter art (a.jpg, B.png ...)
        return False
    low = base.lower()
    if low.startswith("generated_image") or "madam" in low or low == "welcoming-sir":
        return False
    return True


def clean_name(name: str) -> str:
    stem, ext = os.path.splitext(name)
    m = re.match(r"^(.*?)\s*\((\d+)\)$", stem)
    suffix = ""
    if m:
        stem, suffix = m.group(1), f"-{m.group(2)}"
    # camelCase -> kebab, spaces -> dashes, lowercase
    stem = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", "-", stem)
    stem = re.sub(r"[^A-Za-z0-9]+", "-", stem).strip("-").lower()
    return f"{stem}{suffix}{ext.lower()}"


def ref_files():
    for root in REF_ROOTS:
        for dirpath, _, files in os.walk(root):
            for f in files:
                if f.endswith((".ts", ".tsx", ".json")):
                    yield os.path.join(dirpath, f)


def rewrite_refs(old_rel: str, new_rel: str) -> int:
    """Point every reference at the replacement file."""
    hits = 0
    for path in ref_files():
        with open(path, "r", encoding="utf-8") as fh:
            text = fh.read()
        if old_rel in text:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(text.replace(old_rel, new_rel))
            hits += 1
    return hits


def main():
    do_cutouts = "--cutouts" in sys.argv
    os.makedirs(DST, exist_ok=True)

    existing = {}  # stem -> [filenames] already in images/image
    for f in os.listdir(DST):
        existing.setdefault(os.path.splitext(f)[0].lower(), []).append(f)

    copied, replaced, retargeted = [], [], []
    new_stems = []
    for name in sorted(os.listdir(SRC)):
        src_path = os.path.join(SRC, name)
        if not os.path.isfile(src_path) or not is_object_file(name):
            continue
        clean = clean_name(name)
        stem = os.path.splitext(clean)[0]
        new_stems.append(stem)
        shutil.copy2(src_path, os.path.join(DST, clean))

        for old in existing.get(stem, []):
            if old == clean:
                replaced.append(clean)
            else:
                # Same object, different extension: rewrite refs, drop old file.
                old_rel = f"/images/image/{old}"
                new_rel = f"/images/image/{clean}"
                n = rewrite_refs(old_rel, new_rel)
                os.remove(os.path.join(DST, old))
                retargeted.append(f"{old} -> {clean} ({n} ref file(s))")
        if stem not in existing:
            copied.append(clean)

    print(f"added new      : {len(copied)}")
    print(f"replaced same  : {len(replaced)} — {', '.join(replaced)}")
    print(f"ext-retargeted : {len(retargeted)}")
    for r in retargeted:
        print(f"   {r}")

    # Which cutouts should be regenerated from the new sources?
    with open(os.path.join("lib", "wordImages.ts"), encoding="utf-8") as fh:
        word_images = fh.read()
    todo = []
    for stem in sorted(set(new_stems)):
        cutname = f"{stem}-cutout.png"
        if cutname in word_images or os.path.exists(os.path.join(DST, cutname)):
            todo.append(stem)
    print(f"cutouts to regenerate ({len(todo)}): {', '.join(todo)}")

    if do_cutouts and todo:
        from PIL import Image
        from rembg import new_session, remove

        session = new_session("u2net")
        for stem in todo:
            # find the freshly copied source for this stem
            src = None
            for ext in (".jpg", ".jpeg", ".png"):
                p = os.path.join(DST, stem + ext)
                if os.path.exists(p):
                    src = p
                    break
            if not src:
                print(f"   ? no source for {stem}")
                continue
            with open(src, "rb") as fh:
                cut = remove(fh.read(), session=session)
            Image.open(io.BytesIO(cut)).convert("RGBA").save(
                os.path.join(DST, f"{stem}-cutout.png")
            )
            print(f"   ✓ {stem}-cutout.png")

    # Sanity: every /images/image/... path referenced in code must exist.
    missing = set()
    for path in ref_files():
        with open(path, encoding="utf-8") as fh:
            for rel in re.findall(r"/images/image/[^\"'`)\s]+", fh.read()):
                if not os.path.exists(os.path.join("public", rel.lstrip("/"))):
                    missing.add(rel)
    if missing:
        print(f"STILL-MISSING refs ({len(missing)}):")
        for m in sorted(missing):
            print(f"   {m}")
    else:
        print("all referenced image paths exist ✓")


if __name__ == "__main__":
    main()
