"""
"See & Know" ALL-tour voice lines (gTTS, same voice as generate_voices_free.py):
one "This is a/an X." line per word in data/letterImages.ts WORDS_BY_LETTER, and
an additional "The X is Ying." action line for every word that has a real
action image (lib/wordImages.ts ACTIONS) — resolved at runtime by
lib/discoverPhrases.ts. Safe to re-run: existing files (e.g. apple-alone.mp3,
already recorded for the Step 0 per-letter flow) are left untouched.

Run from the repo root: python scripts/gen-discover-tour-audio.py
"""

import os
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

OUTPUT_BASE = "./public/audio/discover"

# Every word toured by the ALL-tour (data/letterImages.ts WORDS_BY_LETTER),
# exactly as it appears there.
WORDS = [
    "Airplane", "Ant", "Apple", "Ball", "Banana", "Bed", "Bird",
    "Bread", "Car", "Cat", "Chicken", "Chocolate", "Coconut",
    "Dog", "Door", "Duck", "Egg", "Elephant", "Fish", "Flower", "Frog", "Gate",
    "Glass", "Goat", "Guava", "Hat", "Hen", "House", "Ice cream", "Jacket",
    "Juice", "Key", "Kite", "Lion", "Lollipop", "Mango", "Milk", "Net",
    "Orange", "Owl", "Papaya", "Pen", "Pineapple", "Queen", "Rabbit", "Rice",
    "Shoe", "Spoon", "Sun", "Table", "Tea", "Tomato", "Toothbrush",
    "Tree", "Umbrella", "Van", "Water", "Watermelon", "Window", "X-ray",
    "Yam", "Yolk", "Zebra", "Zip",
]

# Words with a real action image (lib/wordImages.ts ACTIONS), and the line to
# say over it. Kept in sync with that dict by hand — see its keys.
ACTION_TEXT = {
    "airplane": "The airplane is carrying its passengers.",
    "ant": "The ants are working together.",
    "apple": "The child is eating an apple.",
    "ball": "The child is playing with the ball.",
    "banana": "The monkey is eating a banana.",
    "bed": "The child is lying on the bed.",
    "bird": "The bird is sitting on a tree.",
    "bread": "The child is eating bread.",
    "car": "The father is driving the car.",
    "cat": "The cat is drinking milk.",
    "chicken": "The mother is cooking a chicken.",
    "chocolate": "The child is eating chocolate.",
    "coconut": "The father is cutting a coconut.",
    "dog": "The dog is barking.",
    "door": "The sister is opening the door.",
    "duck": "The duck is swimming.",
    "egg": "The mother is cracking an egg.",
    "elephant": "The elephant is pulling up a tree.",
    "fish": "The fish is swimming.",
    "flower": "The child is planting a flower.",
    "frog": "The frog is catching a fly.",
    "gate": "The child is opening the gate.",
    "glass": "The glass is filled with milk.",
    "goat": "The goat is eating grass.",
    "guava": "The child is eating a guava.",
    "hat": "The father is wearing a hat.",
    "hen": "The hen is eating a worm.",
    "house": "The brothers are building a house.",
    "icecream": "The child is licking ice cream.",
    "jacket": "The child is wearing a jacket.",
    "juice": "The sister is drinking juice.",
    "key": "The child is opening the door with a key.",
    "kite": "The children are flying a kite.",
    "lion": "The lion is roaring.",
    "lollipop": "The child is eating a lollipop.",
    "mango": "The child is eating a mango.",
    "milk": "The child is drinking milk.",
    "net": "The father is catching fish with a net.",
    "orange": "The child is eating an orange.",
    "owl": "The owl is flying.",
    "papaya": "The mother is preparing papaya.",
    "pen": "The brother is writing with a pen.",
    "pineapple": "The child is eating pineapple.",
    "queen": "The queen is sitting on her throne.",
    "rabbit": "The rabbit is eating.",
    "rice": "The family is eating rice.",
    "shoe": "The child is wearing shoes.",
    "spoon": "The spoon is carrying ice cream.",
    "sun": "The sun is shining.",
    "table": "The father is making a table.",
    "tea": "The child is drinking tea.",
    "tomato": "The mother is cutting tomatoes.",
    "toothbrush": "The child is brushing their teeth.",
    "tree": "A bird and a squirrel are sitting on the tree.",
    "umbrella": "The child is using an umbrella in the rain.",
    "van": "The van is moving.",
    "water": "The child is drinking water.",
    "watermelon": "The child is eating watermelon.",
    "window": "The mother is opening the window.",
    "xray": "The doctor is looking at the x-ray.",
    "yam": "The father is cutting a yam.",
    "yolk": "The mother is frying the yolk.",
    "zebra": "The zebras are playing together.",
    "zip": "The child is closing the zip.",
}

ID_OVERRIDES = {
    "ice cream": "icecream",
    "x-ray": "xray",
}

VOWEL_SOUND = ("a", "e", "i", "o", "u", "x")  # "x-ray" reads as "an x-ray"


def discover_id(word: str) -> str:
    key = word.lower()
    if key in ID_OVERRIDES:
        return ID_OVERRIDES[key]
    return "-".join(w for w in key.replace("-", " ").split(" ") if w)


def alone_text(word: str) -> str:
    article = "an" if word[0].lower() in VOWEL_SOUND else "a"
    return f"This is {article} {word.lower()}."


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

    for word in WORDS:
        wid = discover_id(word)
        result = gen(alone_text(word), f"{wid}-alone.mp3")
        counts[result] += 1
        print(f"{result:5} {wid}-alone.mp3")

        action_text = ACTION_TEXT.get(wid)
        if action_text:
            result = gen(action_text, f"{wid}-action.mp3")
            counts[result] += 1
            print(f"{result:5} {wid}-action.mp3")

    print(f"\ndone: {counts['OK']} written, {counts['SKIP']} skipped, {counts['FAIL']} failed")


if __name__ == "__main__":
    main()
