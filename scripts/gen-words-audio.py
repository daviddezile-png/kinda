"""
Words module audio — the word-building world (join letters -> pronounce ->
write -> read). Generates:
  * any missing /audio/words/<word>.mp3 clips for the pilot word sets, and
  * the module's spoken instruction lines (/audio/instructions/words/...).

Letter NAMES and SOUNDS are reused from the existing /audio/letters/* clips, so
this script does not regenerate those.

Voice: gTTS, com.au (the app's teacher voice), matching every other clip.
Run from the repo root:  python scripts/gen-words-audio.py
Safe to re-run — existing files are skipped.
"""

import os
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

OUTPUT_BASE = "./public/audio"
MAIN = "com.au"  # the app's teacher voice

# Keep in sync with data/words.ts WORDS_BY_LETTER (A–Z). Existing clips are
# skipped, so listing all of them is harmless. A few words need a spoken form
# that differs from the slug (e.g. "xray" is said "X ray"); see SAY_AS.
WORDS = [
    "ant", "apple", "avocado", "airplane", "antelope",
    "ball", "banana", "bird", "bed", "bread",
    "cat", "car", "cup", "cow", "candy",
    "dog", "duck", "door", "dolphin", "donkey",
    "egg", "eagle", "elephant",
    "fish", "frog", "fox", "flower", "flamingo",
    "goat", "gate", "glass", "guava", "goose",
    "hat", "hen", "house", "horse", "honey",
    "iguana", "icecream",
    "juice", "jacket", "jaguar", "jellyfish",
    "key", "kite", "koala", "kitten", "kangaroo",
    "lion", "lemon", "lamb", "lizard", "lollipop",
    "mango", "milk", "mouse", "mosquito",
    "net", "newt",
    "owl", "orange", "oil", "octopus", "ostrich",
    "pen", "puppy", "papaya", "parrot", "penguin",
    "queen", "quail", "quacker",
    "rat", "rice", "rabbit", "rooster",
    "sun", "shoe", "snake", "spoon", "spider",
    "tree", "tiger", "table", "tomato", "turtle",
    "urial", "umbrella",
    "van", "vole", "viper", "vulture",
    "water", "wolf", "whale", "wasp", "window",
    "xray",
    "yam", "yak", "yolk", "yogurt",
    "zebra", "zip", "zonkey", "zorro",
]

# Slug -> what the teacher should actually SAY (when it differs from the slug).
SAY_AS = {
    "xray": "X ray",
    "icecream": "ice cream",
}

# rel path -> text
LINES: dict[str, str] = {}


def add(rel: str, text: str) -> None:
    LINES[rel] = text


# ── Module welcome (welcome -> what we'll learn -> how to start) ──────────
add("instructions/words/welcome.mp3",
    "Hello my friend! Welcome to word building!")
add("instructions/words/what-learn.mp3",
    "Today, we are going to make words! We will join letters, say them, "
    "and write them!")
add("instructions/words/how-start.mp3",
    "Tap the picture, and let's begin!")

# ── The map ("Words! tap a letter") ──────────────────────────────────────
add("instructions/words/map-welcome.mp3",
    "Words! Touch a letter to start making words!")

# ── Per-word phase lines (generic, reused for every word) ────────────────
add("instructions/words/lets-make.mp3", "Let's make a word!")
add("instructions/words/listen.mp3", "Listen…")
add("instructions/words/lets-spell.mp3", "Let's spell it together!")
add("instructions/words/now-join.mp3",
    "Now, join the letters to make the word!")
add("instructions/words/next-letter.mp3", "Tap the next letter!")
add("instructions/words/made-word.mp3", "You made the word!")
add("instructions/words/now-write.mp3", "Now, let's write the word!")
add("instructions/words/write-next.mp3", "Now the next letter!")
add("instructions/words/wrote-word.mp3", "You wrote the whole word! Well done!")
add("instructions/words/read-it.mp3", "Can you read it? It says…")
add("instructions/words/next-word.mp3", "Let's make another word!")

# ── Games ────────────────────────────────────────────────────────────────
add("instructions/words/lets-play.mp3", "Now, let's play a word game!")
add("instructions/words/find-picture.mp3",
    "Touch the picture for the word…")
add("instructions/words/missing-letter.mp3",
    "Which letter is missing? Touch it!")
add("instructions/words/listen-pick.mp3",
    "Listen, and touch the word you hear…")

# ── Finale ───────────────────────────────────────────────────────────────
add("instructions/words/all-done.mp3",
    "You made all the words! I am so proud of you!")


def main() -> None:
    try:
        from gtts import gTTS
    except ImportError:
        print("gTTS not installed. Run: pip install gTTS")
        sys.exit(1)

    made = 0
    skipped = 0

    # Word clips
    for word in WORDS:
        rel = f"words/{word}.mp3"
        full = os.path.join(OUTPUT_BASE, rel)
        if os.path.exists(full):
            skipped += 1
            continue
        os.makedirs(os.path.dirname(full), exist_ok=True)
        gTTS(text=SAY_AS.get(word, word), lang="en", slow=False, tld=MAIN).save(full)
        print("  +", rel)
        made += 1

    # Instruction lines
    for rel, text in LINES.items():
        full = os.path.join(OUTPUT_BASE, rel)
        if os.path.exists(full):
            skipped += 1
            continue
        os.makedirs(os.path.dirname(full), exist_ok=True)
        gTTS(text=text, lang="en", slow=False, tld=MAIN).save(full)
        print("  +", rel)
        made += 1

    print(f"\nDone. {made} created, {skipped} already existed.")


if __name__ == "__main__":
    main()
