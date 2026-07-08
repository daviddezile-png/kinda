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

# Keep in sync with data/animals.ts ANIMALS (slug -> spoken word). The spoken
# word can differ from the slug (e.g. "vervet-monkey" image, "monkey" slug and
# speech) — here slug and speech happen to always match.
ANIMALS = [
    "ant", "bear", "bee", "bird", "butterfly", "cat", "cow", "crocodile",
    "dog", "dolphin", "donkey", "duck", "eagle", "elephant", "fish",
    "flamingo", "fox", "frog", "giraffe", "goat", "goose", "gorilla", "hen",
    "hippopotamus", "horse", "hyena", "iguana", "jaguar", "jellyfish",
    "kangaroo", "koala", "lamb", "leopard", "lion", "lizard", "monkey",
    "mouse", "octopus", "ostrich", "owl", "parrot", "penguin", "rabbit",
    "rat", "rhinoceros", "rooster", "sheep", "snail", "snake", "spider",
    "tiger", "turkey", "turtle", "vulture", "warthog", "wasp", "whale",
    "wolf", "yak", "zebra",
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
        result = gen(alone_text(animal), f"{animal}-alone.mp3")
        counts[result] += 1
        print(f"{result:5} {animal}-alone.mp3")

    print(f"\ndone: {counts['OK']} written, {counts['SKIP']} skipped, {counts['FAIL']} failed")


if __name__ == "__main__":
    main()
