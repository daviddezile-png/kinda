"""
ELIMU YANGU — FREE VOICE GENERATOR
=====================================
Uses gTTS (Google Text-to-Speech) — completely FREE, no API key, no limits.

HOW TO USE:
1. Open your terminal/command prompt
2. Install: pip install gtts
3. Run: python generate_voices_free.py
4. All audio files will be saved automatically in /public/audio/

That's it! No account needed, no credit card, no limits.
"""

from gtts import gTTS
import os
import sys
import time

# Windows consoles default to cp1252 and choke on the ✓ progress glyphs below.
# Force UTF-8 so a plain `python generate_voices_free.py` never crashes on output.
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

# Output folder — must match your Next.js project's public folder
OUTPUT_BASE = "./public/audio"

# ─────────────────────────────────────
# ALL AUDIO CONTENT
# ─────────────────────────────────────

AUDIO_FILES = {

    # ── LETTER NAMES ──────────────────────────────────────────
    "letters/names/a.mp3": "A",
    "letters/names/b.mp3": "B",
    "letters/names/c.mp3": "C",
    "letters/names/d.mp3": "D",
    "letters/names/e.mp3": "E",
    "letters/names/f.mp3": "F",
    "letters/names/g.mp3": "G",
    "letters/names/h.mp3": "H",
    "letters/names/i.mp3": "I",
    "letters/names/j.mp3": "J",
    "letters/names/k.mp3": "K",
    "letters/names/l.mp3": "L",
    "letters/names/m.mp3": "M",
    "letters/names/n.mp3": "N",
    "letters/names/o.mp3": "O",
    "letters/names/p.mp3": "P",
    "letters/names/r.mp3": "R",
    "letters/names/s.mp3": "S",
    "letters/names/t.mp3": "T",
    "letters/names/u.mp3": "U",
    "letters/names/v.mp3": "V",
    "letters/names/w.mp3": "W",
    "letters/names/y.mp3": "Y",
    "letters/names/z.mp3": "Z",

    # ── LETTER SOUNDS (Phonics) ────────────────────────────────
    "letters/sounds/a.mp3": "ah",
    "letters/sounds/b.mp3": "buh",
    "letters/sounds/c.mp3": "cuh",
    "letters/sounds/d.mp3": "duh",
    "letters/sounds/e.mp3": "eh",
    "letters/sounds/f.mp3": "fuh",
    "letters/sounds/g.mp3": "guh",
    "letters/sounds/h.mp3": "huh",
    "letters/sounds/i.mp3": "ih",
    "letters/sounds/j.mp3": "juh",
    "letters/sounds/k.mp3": "kuh",
    "letters/sounds/l.mp3": "luh",
    "letters/sounds/m.mp3": "muh",
    "letters/sounds/n.mp3": "nuh",
    "letters/sounds/o.mp3": "oh",
    "letters/sounds/p.mp3": "puh",
    "letters/sounds/r.mp3": "ruh",
    "letters/sounds/s.mp3": "suh",
    "letters/sounds/t.mp3": "tuh",
    "letters/sounds/u.mp3": "uh",
    "letters/sounds/v.mp3": "vuh",
    "letters/sounds/w.mp3": "wuh",
    "letters/sounds/y.mp3": "yuh",
    "letters/sounds/z.mp3": "zuh",

    # ── LETTER CASE NAMES (Step 1 identification) ─────────────
    # Spoken as each form is shown: "Capital letter A", then "Small letter a".
    "letters/capital/a.mp3": "Capital letter A",
    "letters/capital/b.mp3": "Capital letter B",
    "letters/capital/c.mp3": "Capital letter C",
    "letters/capital/d.mp3": "Capital letter D",
    "letters/capital/e.mp3": "Capital letter E",
    "letters/capital/f.mp3": "Capital letter F",
    "letters/capital/g.mp3": "Capital letter G",
    "letters/capital/h.mp3": "Capital letter H",
    "letters/capital/i.mp3": "Capital letter I",
    "letters/capital/j.mp3": "Capital letter J",
    "letters/capital/k.mp3": "Capital letter K",
    "letters/capital/l.mp3": "Capital letter L",
    "letters/capital/m.mp3": "Capital letter M",
    "letters/capital/n.mp3": "Capital letter N",
    "letters/capital/o.mp3": "Capital letter O",
    "letters/capital/p.mp3": "Capital letter P",
    "letters/capital/q.mp3": "Capital letter Q",
    "letters/capital/r.mp3": "Capital letter R",
    "letters/capital/s.mp3": "Capital letter S",
    "letters/capital/t.mp3": "Capital letter T",
    "letters/capital/u.mp3": "Capital letter U",
    "letters/capital/v.mp3": "Capital letter V",
    "letters/capital/w.mp3": "Capital letter W",
    "letters/capital/x.mp3": "Capital letter X",
    "letters/capital/y.mp3": "Capital letter Y",
    "letters/capital/z.mp3": "Capital letter Z",
    "letters/small/a.mp3": "Small letter A",
    "letters/small/b.mp3": "Small letter B",
    "letters/small/c.mp3": "Small letter C",
    "letters/small/d.mp3": "Small letter D",
    "letters/small/e.mp3": "Small letter E",
    "letters/small/f.mp3": "Small letter F",
    "letters/small/g.mp3": "Small letter G",
    "letters/small/h.mp3": "Small letter H",
    "letters/small/i.mp3": "Small letter I",
    "letters/small/j.mp3": "Small letter J",
    "letters/small/k.mp3": "Small letter K",
    "letters/small/l.mp3": "Small letter L",
    "letters/small/m.mp3": "Small letter M",
    "letters/small/n.mp3": "Small letter N",
    "letters/small/o.mp3": "Small letter O",
    "letters/small/p.mp3": "Small letter P",
    "letters/small/q.mp3": "Small letter Q",
    "letters/small/r.mp3": "Small letter R",
    "letters/small/s.mp3": "Small letter S",
    "letters/small/t.mp3": "Small letter T",
    "letters/small/u.mp3": "Small letter U",
    "letters/small/v.mp3": "Small letter V",
    "letters/small/w.mp3": "Small letter W",
    "letters/small/x.mp3": "Small letter X",
    "letters/small/y.mp3": "Small letter Y",
    "letters/small/z.mp3": "Small letter Z",

    # ── WORD NAMES ────────────────────────────────────────────
    "words/apple.mp3": "Apple",
    "words/ant.mp3": "Ant",
    "words/airplane.mp3": "Airplane",
    "words/banana.mp3": "Banana",
    "words/ball.mp3": "Ball",
    "words/bird.mp3": "Bird",
    "words/bed.mp3": "Bed",
    "words/chicken.mp3": "Chicken",
    "words/cat.mp3": "Cat",
    "words/car.mp3": "Car",
    "words/cup.mp3": "Cup",
    "words/dog.mp3": "Dog",
    "words/door.mp3": "Door",
    "words/duck.mp3": "Duck",
    "words/doll.mp3": "Doll",
    "words/egg.mp3": "Egg",
    "words/elephant.mp3": "Elephant",
    "words/fish.mp3": "Fish",
    "words/frog.mp3": "Frog",
    "words/flower.mp3": "Flower",
    "words/fan.mp3": "Fan",
    "words/goat.mp3": "Goat",
    "words/glass.mp3": "Glass",
    "words/girl.mp3": "Girl",
    "words/gate.mp3": "Gate",
    "words/house.mp3": "House",
    "words/hat.mp3": "Hat",
    "words/hen.mp3": "Hen",
    "words/ice-cream.mp3": "Ice cream",
    "words/insect.mp3": "Insect",
    "words/juice.mp3": "Juice",
    "words/jacket.mp3": "Jacket",
    "words/key.mp3": "Key",
    "words/kite.mp3": "Kite",
    "words/lion.mp3": "Lion",
    "words/leaf.mp3": "Leaf",
    "words/lamp.mp3": "Lamp",
    "words/mango.mp3": "Mango",
    "words/milk.mp3": "Milk",
    "words/monkey.mp3": "Monkey",
    "words/moon.mp3": "Moon",
    "words/net.mp3": "Net",
    "words/nest.mp3": "Nest",
    "words/orange.mp3": "Orange",
    "words/owl.mp3": "Owl",
    "words/pineapple.mp3": "Pineapple",
    "words/pig.mp3": "Pig",
    "words/pen.mp3": "Pen",
    "words/rice.mp3": "Rice",
    "words/rain.mp3": "Rain",
    "words/rabbit.mp3": "Rabbit",
    "words/sun.mp3": "Sun",
    "words/shoe.mp3": "Shoe",
    "words/spoon.mp3": "Spoon",
    "words/tree.mp3": "Tree",
    "words/table.mp3": "Table",
    "words/toothbrush.mp3": "Toothbrush",
    "words/umbrella.mp3": "Umbrella",
    "words/van.mp3": "Van",
    "words/water.mp3": "Water",
    "words/window.mp3": "Window",
    "words/yam.mp3": "Yam",
    "words/zebra.mp3": "Zebra",

    # ── WORD NAMES — new artwork added to /public/images ──────
    "words/avocado.mp3": "Avocado",
    "words/candy.mp3": "Candy",
    "words/chocolate.mp3": "Chocolate",
    "words/coconut.mp3": "Coconut",
    "words/guava.mp3": "Guava",
    "words/lollipop.mp3": "Lollipop",
    "words/papaya.mp3": "Papaya",
    "words/queen.mp3": "Queen",
    "words/tea.mp3": "Tea",
    "words/tomato.mp3": "Tomato",
    "words/watermelon.mp3": "Watermelon",
    "words/x-ray.mp3": "X-ray",
    "words/zip.mp3": "Zip",
    "words/bread.mp3": "Bread",
    "words/salt.mp3": "Salt",
    "words/yolk.mp3": "Yolk",

    # ── STEP 0 — DISCOVER (Action sentences) ──────────────────
    "discover/apple-alone.mp3": "This is an apple.",
    "discover/apple-action.mp3": "The child is eating an apple.",
    "discover/banana-alone.mp3": "This is a banana.",
    "discover/banana-action.mp3": "The monkey is eating a banana.",
    "discover/chicken-alone.mp3": "This is a chicken.",
    "discover/chicken-action.mp3": "The chicken is eating rice.",
    "discover/dog-alone.mp3": "This is a dog.",
    "discover/dog-action.mp3": "The dog is running.",
    "discover/egg-alone.mp3": "This is an egg.",
    "discover/egg-action.mp3": "The hen laid an egg.",
    "discover/fish-alone.mp3": "This is a fish.",
    "discover/fish-action.mp3": "The fish is swimming.",
    "discover/goat-alone.mp3": "This is a goat.",
    "discover/goat-action.mp3": "The goat is eating grass.",
    "discover/house-alone.mp3": "This is a house.",
    "discover/house-action.mp3": "The family lives in the house.",
    "discover/icecream-alone.mp3": "This is ice cream.",
    "discover/icecream-action.mp3": "The child is licking ice cream.",
    "discover/juice-alone.mp3": "This is juice.",
    "discover/juice-action.mp3": "The child is drinking juice.",
    "discover/key-alone.mp3": "This is a key.",
    "discover/key-action.mp3": "The child is opening the door with a key.",
    "discover/lion-alone.mp3": "This is a lion.",
    "discover/lion-action.mp3": "The lion is walking.",
    "discover/mango-alone.mp3": "This is a mango.",
    "discover/mango-action.mp3": "The child is eating a mango.",
    "discover/net-alone.mp3": "This is a net.",
    "discover/net-action.mp3": "The fisherman is catching fish with a net.",
    "discover/orange-alone.mp3": "This is an orange.",
    "discover/orange-action.mp3": "The child is peeling an orange.",
    "discover/pineapple-alone.mp3": "This is a pineapple.",
    "discover/pineapple-action.mp3": "The child is eating pineapple.",
    "discover/rice-alone.mp3": "This is rice.",
    "discover/rice-action.mp3": "The family is eating rice.",
    "discover/sun-alone.mp3": "This is the sun.",
    "discover/sun-action.mp3": "The sun is shining.",
    "discover/tree-alone.mp3": "This is a tree.",
    "discover/tree-action.mp3": "The bird is sitting on the tree.",
    "discover/umbrella-alone.mp3": "This is an umbrella.",
    "discover/umbrella-action.mp3": "The child is using an umbrella in the rain.",
    "discover/van-alone.mp3": "This is a van.",
    "discover/van-action.mp3": "The van is carrying people.",
    "discover/water-alone.mp3": "This is water.",
    "discover/water-action.mp3": "The child is drinking water.",
    "discover/yam-alone.mp3": "This is a yam.",
    "discover/yam-action.mp3": "The child is eating yam.",
    "discover/zebra-alone.mp3": "This is a zebra.",
    "discover/zebra-action.mp3": "The zebra is running.",
    "discover/queen-alone.mp3": "This is a queen.",
    "discover/xray-alone.mp3": "This is an x-ray.",
    "discover/lollipop-alone.mp3": "This is a lollipop.",

    # ── STEP 0 INSTRUCTIONS ───────────────────────────────────
    # Stage welcome + "what we are going to do" for Level 0 (the picture tour).
    "instructions/step0/look-pictures.mp3": "Welcome! Now we are going to look at pictures. Let's look at each one carefully!",
    "instructions/step0/lets-learn.mp3": "Let's learn something new!",
    "instructions/step0/look-at-this.mp3": "Look at this!",
    "instructions/step0/watch-carefully.mp3": "Watch carefully!",
    "instructions/step0/quick-game.mp3": "Now let's play a quick game.",
    "instructions/step0/what-did-you-see.mp3": "What did we just see?",
    "instructions/step0/tap-picture.mp3": "Tap the picture you just saw!",
    "instructions/step0/lets-look-again.mp3": "Let's look again!",
    "instructions/step0/now-learn-letter.mp3": "Great job! Now let's learn the letter!",
    "instructions/step0/great-looking.mp3": "You are doing such a wonderful job looking at each picture!",
    # Pause / unpause guidance for the picture journey (see DiscoverGallery).
    "instructions/step0/paused.mp3": "You stopped the pictures. Tap the picture to keep going, or swipe your finger to see the next one!",
    "instructions/step0/paused-tap.mp3": "Tap the picture to keep watching!",
    "instructions/step0/paused-swipe.mp3": "Or swipe your finger to see the next picture!",
    # Start + end guidance for Level 0.
    "instructions/step0/tap-star-start.mp3": "Tap the star to start!",
    "instructions/step0/discover-end.mp3": "That is the end! Tap the blue button to watch the pictures again, or tap the star to keep going!",

    # ── STEP 1 INSTRUCTIONS ───────────────────────────────────
    # Stage announcement — spoken as the child arrives at "learn the letter".
    "instructions/step1/lets-learn-letter.mp3": "Now we are going to learn a letter!",
    "instructions/step1/touch-the-letter.mp3": "Touch the letter!",
    "instructions/step1/touch-again.mp3": "Touch it again!",
    "instructions/step1/one-more-time.mp3": "One more time!",
    "instructions/step1/a-is-for.mp3": "A is for Apple!",
    "instructions/step1/b-is-for.mp3": "B is for Banana!",
    "instructions/step1/c-is-for.mp3": "C is for Chicken!",
    "instructions/step1/d-is-for.mp3": "D is for Dog!",
    "instructions/step1/e-is-for.mp3": "E is for Egg!",
    "instructions/step1/f-is-for.mp3": "F is for Fish!",
    "instructions/step1/g-is-for.mp3": "G is for Goat!",
    "instructions/step1/h-is-for.mp3": "H is for House!",
    "instructions/step1/i-is-for.mp3": "I is for Ice Cream!",
    "instructions/step1/j-is-for.mp3": "J is for Juice!",
    "instructions/step1/k-is-for.mp3": "K is for Key!",
    "instructions/step1/l-is-for.mp3": "L is for Lion!",
    "instructions/step1/m-is-for.mp3": "M is for Mango!",
    "instructions/step1/n-is-for.mp3": "N is for Net!",
    "instructions/step1/o-is-for.mp3": "O is for Orange!",
    "instructions/step1/p-is-for.mp3": "P is for Pineapple!",
    "instructions/step1/r-is-for.mp3": "R is for Rice!",
    "instructions/step1/s-is-for.mp3": "S is for Sun!",
    "instructions/step1/t-is-for.mp3": "T is for Tree!",
    "instructions/step1/u-is-for.mp3": "U is for Umbrella!",
    "instructions/step1/v-is-for.mp3": "V is for Van!",
    "instructions/step1/w-is-for.mp3": "W is for Water!",
    "instructions/step1/y-is-for.mp3": "Y is for Yam!",
    "instructions/step1/z-is-for.mp3": "Z is for Zebra!",
    "instructions/step1/learned-a.mp3": "You learned the letter A!",
    "instructions/step1/learned-b.mp3": "You learned the letter B!",
    "instructions/step1/learned-c.mp3": "You learned the letter C!",
    "instructions/step1/learned-d.mp3": "You learned the letter D!",
    "instructions/step1/learned-e.mp3": "You learned the letter E!",
    "instructions/step1/learned-f.mp3": "You learned the letter F!",
    "instructions/step1/learned-g.mp3": "You learned the letter G!",
    "instructions/step1/learned-h.mp3": "You learned the letter H!",
    "instructions/step1/learned-i.mp3": "You learned the letter I!",
    "instructions/step1/learned-j.mp3": "You learned the letter J!",
    "instructions/step1/learned-k.mp3": "You learned the letter K!",
    "instructions/step1/learned-l.mp3": "You learned the letter L!",
    "instructions/step1/learned-m.mp3": "You learned the letter M!",
    "instructions/step1/learned-n.mp3": "You learned the letter N!",
    "instructions/step1/learned-o.mp3": "You learned the letter O!",
    "instructions/step1/learned-p.mp3": "You learned the letter P!",
    "instructions/step1/learned-r.mp3": "You learned the letter R!",
    "instructions/step1/learned-s.mp3": "You learned the letter S!",
    "instructions/step1/learned-t.mp3": "You learned the letter T!",
    "instructions/step1/learned-u.mp3": "You learned the letter U!",
    "instructions/step1/learned-v.mp3": "You learned the letter V!",
    "instructions/step1/learned-w.mp3": "You learned the letter W!",
    "instructions/step1/learned-y.mp3": "You learned the letter Y!",
    "instructions/step1/learned-z.mp3": "You learned the letter Z!",
    # Q and X were missing from the old set — added so every letter is complete.
    "instructions/step1/learned-q.mp3": "You learned the letter Q!",
    "instructions/step1/learned-x.mp3": "You learned the letter X!",

    # ── LEVEL 1 (revamped letter lesson) — extra spoken guidance ──────────
    # The letter lesson now welcomes, teaches, plays 6 games and celebrates,
    # guiding the child by voice at every step (see components/letters/Step1Client).
    "instructions/step1/clap-your-hands.mp3": "Clap your hands! Hooray!",
    "instructions/step1/touch-small-letter.mp3": "Now touch the small letter!",
    "instructions/step1/look-here.mp3": "Look here!",
    # New guided-lesson lines (see the reworked components/letters/Step1Client).
    "instructions/step1/new-letter-intro.mp3": "Look! We have a beautiful new letter to learn today!",
    "instructions/step1/now-touch-letter.mp3": "Now we are going to touch the letter!",
    "instructions/step1/say-it.mp3": "Now you say it!",
    "instructions/step1/say-one-more.mp3": "One more time. Say it!",
    "instructions/step1/touch-one-more.mp3": "Touch it one more, last time!",
    "instructions/step1/lets-find-small.mp3": "Now let's find the small letter!",
    "instructions/step1/now-you-say.mp3": "Now you say it!",
    "instructions/step1/say-again.mp3": "Say it again!",
    "instructions/step1/now-small.mp3": "Now let's learn the small letter!",
    "instructions/step1/lets-play-games.mp3": "Now let's play some fun games!",
    "instructions/step1/find-the-capital.mp3": "Can you find the capital letter?",
    "instructions/step1/find-the-small.mp3": "Can you find the small letter?",
    "instructions/step1/you-win.mp3": "You win a gift!",
    "instructions/step1/see-basket.mp3": "See it go into your basket!",
    "instructions/step1/lost-gift.mp3": "Oh no! We lost one gift. Let's try again!",
    "instructions/step1/look-gifts.mp3": "Look at all the gifts you collected! I am so proud of you!",
    "instructions/step1/tap-star-next.mp3": "Wonderful work! Touch the shining star to learn a new letter!",
    "instructions/step1/try-again-letter.mp3": "Let's learn this letter one more time together. You can do it!",
    # Per-letter welcome — "Now we are going to learn the letter D!"
    "instructions/step1/learn-a.mp3": "Now we are going to learn the letter A!",
    "instructions/step1/learn-b.mp3": "Now we are going to learn the letter B!",
    "instructions/step1/learn-c.mp3": "Now we are going to learn the letter C!",
    "instructions/step1/learn-d.mp3": "Now we are going to learn the letter D!",
    "instructions/step1/learn-e.mp3": "Now we are going to learn the letter E!",
    "instructions/step1/learn-f.mp3": "Now we are going to learn the letter F!",
    "instructions/step1/learn-g.mp3": "Now we are going to learn the letter G!",
    "instructions/step1/learn-h.mp3": "Now we are going to learn the letter H!",
    "instructions/step1/learn-i.mp3": "Now we are going to learn the letter I!",
    "instructions/step1/learn-j.mp3": "Now we are going to learn the letter J!",
    "instructions/step1/learn-k.mp3": "Now we are going to learn the letter K!",
    "instructions/step1/learn-l.mp3": "Now we are going to learn the letter L!",
    "instructions/step1/learn-m.mp3": "Now we are going to learn the letter M!",
    "instructions/step1/learn-n.mp3": "Now we are going to learn the letter N!",
    "instructions/step1/learn-o.mp3": "Now we are going to learn the letter O!",
    "instructions/step1/learn-p.mp3": "Now we are going to learn the letter P!",
    "instructions/step1/learn-q.mp3": "Now we are going to learn the letter Q!",
    "instructions/step1/learn-r.mp3": "Now we are going to learn the letter R!",
    "instructions/step1/learn-s.mp3": "Now we are going to learn the letter S!",
    "instructions/step1/learn-t.mp3": "Now we are going to learn the letter T!",
    "instructions/step1/learn-u.mp3": "Now we are going to learn the letter U!",
    "instructions/step1/learn-v.mp3": "Now we are going to learn the letter V!",
    "instructions/step1/learn-w.mp3": "Now we are going to learn the letter W!",
    "instructions/step1/learn-x.mp3": "Now we are going to learn the letter X!",
    "instructions/step1/learn-y.mp3": "Now we are going to learn the letter Y!",
    "instructions/step1/learn-z.mp3": "Now we are going to learn the letter Z!",

    # ── STEP 2 INSTRUCTIONS ───────────────────────────────────
    # Stage announcement — spoken as the child arrives at "find the picture".
    "instructions/step2/lets-find.mp3": "Now we are going to find pictures!",
    "instructions/step2/touch-picture-a.mp3": "Touch the picture that starts with A!",
    "instructions/step2/touch-picture-b.mp3": "Touch the picture that starts with B!",
    "instructions/step2/touch-picture-c.mp3": "Touch the picture that starts with C!",
    "instructions/step2/touch-picture-d.mp3": "Touch the picture that starts with D!",
    "instructions/step2/touch-picture-e.mp3": "Touch the picture that starts with E!",
    "instructions/step2/touch-picture-f.mp3": "Touch the picture that starts with F!",
    "instructions/step2/touch-picture-g.mp3": "Touch the picture that starts with G!",
    "instructions/step2/touch-picture-h.mp3": "Touch the picture that starts with H!",
    "instructions/step2/touch-picture-i.mp3": "Touch the picture that starts with I!",
    "instructions/step2/touch-picture-j.mp3": "Touch the picture that starts with J!",
    "instructions/step2/touch-picture-k.mp3": "Touch the picture that starts with K!",
    "instructions/step2/touch-picture-l.mp3": "Touch the picture that starts with L!",
    "instructions/step2/touch-picture-m.mp3": "Touch the picture that starts with M!",
    "instructions/step2/touch-picture-n.mp3": "Touch the picture that starts with N!",
    "instructions/step2/touch-picture-o.mp3": "Touch the picture that starts with O!",
    "instructions/step2/touch-picture-p.mp3": "Touch the picture that starts with P!",
    "instructions/step2/touch-picture-r.mp3": "Touch the picture that starts with R!",
    "instructions/step2/touch-picture-s.mp3": "Touch the picture that starts with S!",
    "instructions/step2/touch-picture-t.mp3": "Touch the picture that starts with T!",
    "instructions/step2/touch-picture-u.mp3": "Touch the picture that starts with U!",
    "instructions/step2/touch-picture-v.mp3": "Touch the picture that starts with V!",
    "instructions/step2/touch-picture-w.mp3": "Touch the picture that starts with W!",
    "instructions/step2/touch-picture-y.mp3": "Touch the picture that starts with Y!",
    "instructions/step2/touch-picture-z.mp3": "Touch the picture that starts with Z!",
    "instructions/step2/touch-picture-q.mp3": "Touch the picture that starts with Q!",
    "instructions/step2/touch-picture-x.mp3": "Touch the picture that starts with X!",
    "instructions/step2/look-carefully.mp3": "Look carefully!",
    "instructions/step2/take-your-time.mp3": "Take your time!",

    # ── STEP 3 INSTRUCTIONS ───────────────────────────────────
    "instructions/step3/lets-write.mp3": "Now let's write the letter!",
    "instructions/step3/trace-dots.mp3": "Trace the dots with your finger!",
    "instructions/step3/start-at-top.mp3": "Start at the top!",
    "instructions/step3/go-slowly.mp3": "Go slowly!",
    "instructions/step3/almost-there.mp3": "Almost there!",
    "instructions/step3/keep-going.mp3": "Keep going!",
    "instructions/step3/small-letter.mp3": "Now write the small letter!",
    "instructions/step3/you-can-do-it.mp3": "You can do it!",
    "instructions/step3/thats-okay.mp3": "Start over, that is okay!",
    "instructions/step3/follow-arrow.mp3": "Follow the arrow!",
    "instructions/step3/great-stroke.mp3": "Great stroke!",
    "instructions/step3/you-wrote-it.mp3": "You wrote the letter!",

    # ── STEP 4 GAME INSTRUCTIONS ──────────────────────────────
    "instructions/games/lets-play.mp3": "Let's play a game!",
    "instructions/games/are-you-ready.mp3": "Are you ready?",
    "instructions/games/here-we-go.mp3": "Here we go!",
    "instructions/games/find-pairs.mp3": "Find the matching pairs!",
    "instructions/games/tap-card.mp3": "Tap a card to flip it!",
    "instructions/games/keep-looking.mp3": "Keep looking!",
    "instructions/games/put-pieces.mp3": "Put the pieces together!",
    "instructions/games/it-fits.mp3": "It fits! Keep going!",
    "instructions/games/feed-me.mp3": "Feed me things that start with this letter!",
    "instructions/games/mmm-correct.mp3": "Mmm! That starts with the letter!",
    "instructions/games/no-no.mp3": "No no! That does not start with the letter!",
    "instructions/games/tummy-full.mp3": "My tummy is full!",
    "instructions/games/tap-letters.mp3": "Tap all the letters you can find!",
    "instructions/games/find-it-fast.mp3": "Find it fast!",
    "instructions/games/time-running.mp3": "Time is running out!",
    "instructions/games/build-word.mp3": "Build the word!",
    "instructions/games/spell-it.mp3": "Spell it out!",
    "instructions/games/draw-line.mp3": "Draw a line to the right picture!",
    "instructions/games/thats-a-match.mp3": "That is a match!",
    "instructions/games/catch-bucket.mp3": "Catch the right pictures in the bucket!",
    "instructions/games/bucket-full.mp3": "The bucket is full!",
    "instructions/games/sing-along.mp3": "Sing along with me!",
    "instructions/games/missing-word.mp3": "What is the missing word?",

    # ── POSITIVE FEEDBACK ─────────────────────────────────────
    "feedback/positive/amazing.mp3": "Amazing!",
    "feedback/positive/well-done.mp3": "Well done!",
    "feedback/positive/excellent.mp3": "Excellent!",
    "feedback/positive/brilliant.mp3": "Brilliant!",
    "feedback/positive/great-job.mp3": "Great job!",
    "feedback/positive/wonderful.mp3": "Wonderful!",
    "feedback/positive/you-did-it.mp3": "You did it!",
    "feedback/positive/super-star.mp3": "Super star!",
    "feedback/positive/fantastic.mp3": "Fantastic!",
    "feedback/positive/you-got-it.mp3": "You got it!",
    "feedback/positive/perfect.mp3": "Perfect!",
    "feedback/positive/yes-correct.mp3": "Yes! That is correct!",
    "feedback/positive/hooray.mp3": "Hooray!",
    "feedback/positive/wow.mp3": "Wow!",
    "feedback/positive/so-smart.mp3": "You are so smart!",
    "feedback/positive/superstar-learner.mp3": "You are a superstar learner!",
    "feedback/positive/knew-you-could.mp3": "I knew you could do it!",
    "feedback/positive/look-at-you-go.mp3": "Look at you go!",

    # ── ENCOURAGING FEEDBACK (wrong answers) ──────────────────
    "feedback/encouraging/try-again.mp3": "Try again!",
    "feedback/encouraging/almost-there.mp3": "Almost there!",
    "feedback/encouraging/you-can-do-it.mp3": "You can do it!",
    "feedback/encouraging/one-more-try.mp3": "One more try!",
    "feedback/encouraging/dont-give-up.mp3": "Don't give up!",
    "feedback/encouraging/take-another-look.mp3": "Take another look!",
    "feedback/encouraging/thats-okay.mp3": "That is okay, try again!",
    "feedback/encouraging/keep-trying.mp3": "Keep trying, you are doing great!",
    "feedback/encouraging/nice-try.mp3": "Nice try! Try one more time!",
    "feedback/encouraging/so-close.mp3": "So close! Try again!",

    # ── REWARD REACTIONS: removed. The /audio/feedback/rewards folder was
    #    deleted on purpose — gifts are announced by the teacher speaking the
    #    gift's name instead, so no separate reward sound effects are used. ──

    # ── COMPLETION ────────────────────────────────────────────
    "feedback/completion/step-complete.mp3": "Step complete! Amazing!",
    "feedback/completion/earned-one-star.mp3": "You earned one star!",
    "feedback/completion/earned-two-stars.mp3": "You earned two stars!",
    "feedback/completion/earned-three-stars.mp3": "You earned three stars!",
    "feedback/completion/new-reward.mp3": "You got a new reward!",
    "feedback/completion/ready-next-letter.mp3": "You are ready for the next letter!",
    "feedback/completion/lets-keep-going.mp3": "Let's keep going!",

    # ── UI NAVIGATION ─────────────────────────────────────────
    "ui/welcome-back.mp3": "Welcome back!",
    "ui/welcome-kid.mp3": "Hello! Welcome, my dear child! I am so happy to see you today. Let's discover something new together!",
    "ui/lets-start.mp3": "Let's start!",
    "ui/are-you-ready.mp3": "Are you ready to learn?",
    "ui/tap-to-continue.mp3": "Tap to continue!",
    "ui/tap-next.mp3": "Well done! Touch the big button to keep going!",
    "ui/doing-well-today.mp3": "You are doing so well today!",
    "ui/goodbye.mp3": "Goodbye!",
    "ui/see-you-next-time.mp3": "See you next time!",
}


# ─────────────────────────────────────
# GENERATOR
# ─────────────────────────────────────

def generate_audio(text, file_path):
    """Generate audio using gTTS — completely free, no API key"""
    try:
        full_path = os.path.join(OUTPUT_BASE, file_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)

        tts = gTTS(
            text=text,
            lang="en",
            slow=False,      # normal speed — children need clear but not too slow
            tld="com.au"     # Australian English — clearest accent for children
        )
        tts.save(full_path)
        return True

    except Exception as e:
        print(f"  ERROR: {str(e)}")
        return False


def main():
    try:
        from gtts import gTTS
    except ImportError:
        print("ERROR: gTTS not installed!")
        print("Run this first: pip install gtts")
        return

    print("=" * 50)
    print("ELIMU YANGU — FREE VOICE GENERATOR")
    print("Using gTTS — 100% free, no API key needed")
    print("=" * 50)
    print(f"Total files: {len(AUDIO_FILES)}")
    print(f"Saving to: {OUTPUT_BASE}")
    print()

    success = 0
    skipped = 0
    errors = 0

    for i, (file_path, text) in enumerate(AUDIO_FILES.items(), 1):
        full_path = os.path.join(OUTPUT_BASE, file_path)

        # Skip files already generated (safe to re-run)
        if os.path.exists(full_path):
            print(f"[{i}/{len(AUDIO_FILES)}] SKIP: {file_path}")
            skipped += 1
            continue

        print(f"[{i}/{len(AUDIO_FILES)}] Generating: {file_path}")

        ok = generate_audio(text, file_path)

        if ok:
            print(f"  ✓ Done")
            success += 1
        else:
            errors += 1

        # Small pause to avoid hitting Google rate limits
        time.sleep(0.3)

    print()
    print("=" * 50)
    print("FINISHED!")
    print(f"  Generated : {success}")
    print(f"  Skipped   : {skipped}")
    print(f"  Errors    : {errors}")
    print("=" * 50)
    print()
    print("Next step: Copy the /public/audio/ folder into your Next.js project.")


if __name__ == "__main__":
    main()
