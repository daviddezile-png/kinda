"""
Animal Journey voice lines (gTTS, same voice as generate_voices_free.py /
gen-discover-tour-audio.py): one "This is a/an X." line per animal in
data/animals.ts ANIMALS. Resolved at runtime by data/animals.ts
animalJourneyFrames() -> /audio/discover/animals/{slug}-alone.mp3.

Run from the repo root: python scripts/gen-animal-journey-audio.py
Safe to re-run: existing files are left untouched.
"""

import os
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

OUTPUT_BASE = "./public/audio/discover/animals"

# Keep in sync with data/animals.ts ANIMALS (slug -> spoken word). Most
# animals have slug == spoken word; where the slug (audio filename / the
# `slug` field in data/animals.ts) differs from what's actually said, list a
# (slug, spoken) pair instead of a bare string (e.g. "unicorn-fish" is spoken
# "unicorn fish").
ANIMALS = [
    "ant", "antelope", "bear", "bee", "bird", "butterfly", "cat", "cow",
    "crocodile", "dog", "dolphin", "donkey", "duck", "eagle", "elephant",
    "fish", "flamingo", "fox", "frog", "giraffe", "goat", "goose", "gorilla",
    "hen", "hippopotamus", "horse", "hyena", "iguana", "jaguar", "jellyfish",
    "kangaroo", "kitten", "koala", "lamb", "leopard", "lion", "lizard",
    "monkey", "mosquito", "mouse", "newt", "octopus", "ostrich", "owl",
    "parrot", "penguin", "puppy", "quacker", "quail", "rabbit", "rat",
    "rhinoceros", "rooster", "sheep", "snail", "snake", "spider", "tiger",
    "toad", "turkey", "turtle", ("unicorn-fish", "unicorn fish"), "urial",
    "viper", "vole", "vulture", "warthog", "wasp", "whale", "wolf",
    "xylocopa", "yak", "zebra", "zonkey", "zorro",
]

VOWEL_SOUND = ("a", "e", "i", "o", "u")


def alone_text(word: str) -> str:
    article = "an" if word[0].lower() in VOWEL_SOUND else "a"
    return f"This is {article} {word}."


def gen(text: str, rel_path: str) -> str:
    full = os.path.join(OUTPUT_BASE, rel_path)
    if os.path.exists(full):
        return "SKIP"
    from gtts import gTTS

    os.makedirs(os.path.dirname(full), exist_ok=True)
    try:
        gTTS(text=text, lang="en", slow=False, tld="com.au").save(full)
        return "OK"
    except Exception as e:
        print(f"  ERROR {rel_path}: {e}")
        return "FAIL"


def main():
    counts = {"OK": 0, "SKIP": 0, "FAIL": 0}
    for animal in ANIMALS:
        slug, spoken = animal if isinstance(animal, tuple) else (animal, animal)
        result = gen(alone_text(spoken), f"{slug}-alone.mp3")
        counts[result] += 1
        print(f"{result:5} {slug}-alone.mp3")

    print(f"\ndone: {counts['OK']} written, {counts['SKIP']} skipped, {counts['FAIL']} failed")


if __name__ == "__main__":
    main()
