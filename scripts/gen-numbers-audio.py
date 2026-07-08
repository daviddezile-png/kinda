"""
Numbers & Counting module audio + the per-level welcome intros (write/find/
games levels) + extra multi-accent feedback lines.

Voices: gTTS. The teacher's main voice is the same com.au voice as the rest of
the app; number names are ALSO generated in three more accents (-uk, -us, -in)
so counting taps can echo in different voices (see speakNumberAnyVoice).

Run from the repo root:  python scripts/gen-numbers-audio.py
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
ACCENTS = {"uk": "co.uk", "us": "com", "in": "co.in"}

WORDS = ["zero", "one", "two", "three", "four", "five",
         "six", "seven", "eight", "nine", "ten"]

# Must match data/numbers.ts PRIMARY order (number n counts object n-1).
# Counting content is REAL images only (images/things) — no decor art.
PRIMARY = [
    ("lion", "lions"), ("cat", "cats"), ("duck", "ducks"),
    ("rabbit", "rabbits"), ("apple", "apples"), ("banana", "bananas"),
    ("fish", "fish"), ("flower", "flowers"), ("frog", "frogs"),
    ("bird", "birds"),
]
# Every plural in data/numbers.ts PHOTO_OBJECTS needs a "how many X?" line.
PHOTO_PLURALS = [
    "cats", "dogs", "ducks", "rabbits", "elephants", "lions", "bees",
    "fish", "frogs", "birds", "apples", "bananas", "oranges", "mangoes",
    "eggs", "flowers", "balls", "cars", "cups", "trees",
]


def count_up(n: int) -> str:
    return " ".join(f"{WORDS[k].capitalize()}!" for k in range(1, n + 1))


LINES: dict[str, tuple[str, str]] = {}  # rel path -> (text, tld)


def add(rel: str, text: str, tld: str = MAIN) -> None:
    LINES[rel] = (text, tld)


# ── Level welcome intros (welcome → what we'll learn → how to start) ──────
add("instructions/step2/welcome.mp3",
    "Hello my friend! Welcome back! I am so happy to see you!")
add("instructions/step2/what-learn.mp3",
    "Today, we are going to play, find the picture! I will say a letter, "
    "and you will find the picture that starts with it.")
add("instructions/step2/how-start.mp3",
    "Look at the pictures, listen carefully, and touch the right one. "
    "Are you ready? Let's go!")

add("instructions/step3/welcome.mp3",
    "Hello my dear! Welcome back to school!")
add("instructions/step3/what-learn.mp3",
    "Today, we are going to learn to write! We will write letters, "
    "with our own finger!")
add("instructions/step3/how-start.mp3",
    "Watch the dots, then trace them slowly with your finger. "
    "Are you ready? Let's write!")

add("instructions/games/welcome.mp3",
    "Hello superstar! Welcome to the play room!")
add("instructions/games/what-learn.mp3",
    "Today, we are going to play three fun games with your letter, "
    "to make you a letter master!")
add("instructions/games/how-start.mp3",
    "Listen to me before each game, and touch the screen to play. "
    "Ready? Let's have fun!")

add("instructions/numbers/welcome.mp3",
    "Hello my dear child! Welcome to the world of numbers!")
add("instructions/numbers/what-learn.mp3",
    "Today, we are going to learn a new number, and we will count "
    "many beautiful things together!")
add("instructions/numbers/how-start.mp3",
    "Listen to me, and touch what I ask you to touch. "
    "Are you ready? Let's count!")

# ── Numbers map + lesson chrome ───────────────────────────────────────────
add("instructions/numbers/map-welcome.mp3",
    "Numbers! Touch a number, and let's count together!")
add("instructions/numbers/touch-number.mp3", "Touch the big number!")
add("instructions/numbers/lets-count.mp3",
    "Now, let's count! Touch each one, and count with me!")
add("instructions/numbers/tap-count.mp3",
    "Touch each one, and count with me!")
add("instructions/numbers/choose-number.mp3",
    "How many did you count? Touch the right number!")
add("instructions/numbers/in-order.mp3",
    "Touch the numbers in order! Start at one!")

# Writing the digit (NumberWrite — three rounds, guided by the little hand)
add("instructions/numbers/lets-write.mp3",
    "Now, let's write it! Watch the little hand. Then, trace the number "
    "slowly with your finger!")
add("instructions/numbers/write-again.mp3",
    "Beautiful writing! Now, write it again!")
add("instructions/numbers/write-once-more.mp3",
    "Wonderful! One more time! You can do it!")
add("instructions/numbers/follow-hand.mp3",
    "Follow the little hand with your finger!")
add("instructions/numbers/write-yourself.mp3",
    "Now, write it all by yourself! You can do it!")

# Choosing yourself (the class/profile picker — spoken so no reading needed)
add("ui/touch-your-class.mp3", "Hello! Touch your class!")
add("ui/touch-your-picture.mp3", "Now, touch your picture! Who are you?")

# ── Per-number lines ──────────────────────────────────────────────────────
for n in range(1, 11):
    w = WORDS[n]
    obj_one, obj_many = PRIMARY[n - 1]
    things = f"one {obj_one}" if n == 1 else f"{w} {obj_many}"

    add(f"numbers/names/{n}.mp3", f"{w.capitalize()}!")
    for suffix, tld in ACCENTS.items():
        add(f"numbers/names/{n}-{suffix}.mp3", f"{w.capitalize()}!", tld)
    add(f"numbers/count/{n}.mp3", count_up(n))

    add(f"instructions/numbers/welcome/{n}.mp3",
        f"Hello my friend! Today, we are going to learn the number {w}! "
        "Are you ready? Wonderful!")
    add(f"instructions/numbers/wrote-it/{n}.mp3",
        f"Hooray! You can write the number {w}! Beautiful work!")
    add(f"instructions/numbers/intro/{n}.mp3",
        f"This is the number {w}! {w.capitalize()}!")
    add(f"instructions/numbers/find/{n}.mp3", f"Touch the number {w}!")
    add(f"instructions/numbers/tap-exactly/{n}.mp3",
        f"Give me {things}! Tap them, one by one!")
    add(f"instructions/numbers/match/{n}.mp3",
        f"Touch the card that has {w} things! Count carefully!")
    if n == 1:
        add(f"instructions/numbers/there-are/{n}.mp3",
            f"One! There is one {obj_one}!")
    else:
        add(f"instructions/numbers/there-are/{n}.mp3",
            f"{w.capitalize()}! There are {w} {obj_many}!")
    add(f"instructions/numbers/word/{n}.mp3",
        f"And this is the word, {w}! {w.capitalize()}!")
    add(f"instructions/numbers/learned/{n}.mp3",
        f"Hooray! You know the number {w}! You can count to {w}! "
        "I am so proud of you!")

# ── "How many X?" for every countable object ──────────────────────────────
for plural in PHOTO_PLURALS:
    add(f"instructions/numbers/howmany/{plural}.mp3",
        f"How many {plural} can you see? Count them!")

# ── Extra feedback in other accents (more voices through the whole app) ───
EXTRA_POSITIVE = {
    "amazing-uk": ("Amazing!", "co.uk"),
    "brilliant-us": ("Brilliant!", "com"),
    "wow-uk": ("Wow! Well done!", "co.uk"),
    "super-us": ("Super! You are so clever!", "com"),
    "great-work-in": ("Great work!", "co.in"),
    "high-five-us": ("High five! You did it!", "com"),
    "excellent-uk": ("Excellent!", "co.uk"),
    "clever-in": ("Very clever! Well done!", "co.in"),
}
EXTRA_ENCOURAGING = {
    "try-again-uk": ("Ooh, not quite! Try again!", "co.uk"),
    "almost-us": ("Almost! Have another go!", "com"),
    "keep-going-in": ("Keep going! You can do it!", "co.in"),
    "you-got-this-uk": ("Don't worry! You've got this!", "co.uk"),
}
for name, (text, tld) in EXTRA_POSITIVE.items():
    add(f"feedback/positive/{name}.mp3", text, tld)
for name, (text, tld) in EXTRA_ENCOURAGING.items():
    add(f"feedback/encouraging/{name}.mp3", text, tld)


def main() -> None:
    from gtts import gTTS

    made = skipped = failed = 0
    for rel, (text, tld) in LINES.items():
        full = os.path.join(OUTPUT_BASE, rel)
        if os.path.exists(full):
            skipped += 1
            continue
        os.makedirs(os.path.dirname(full), exist_ok=True)
        try:
            gTTS(text=text, lang="en", slow=False, tld=tld).save(full)
            made += 1
            print(f"OK   {rel}")
        except Exception as e:
            failed += 1
            print(f"FAIL {rel}: {e}")

    print(f"\ndone: {made} written, {skipped} skipped, {failed} failed")


if __name__ == "__main__":
    main()
