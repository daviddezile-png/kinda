# Kinda — Image Generation Prompts

Prompts for the new artwork the updated lessons need. Generate these with **any**
image AI (Midjourney, DALL·E, Leonardo, Ideogram, SDXL…) — not Pollinations.

## Rules that keep everything consistent

1. **The teacher must always be the same character.** Paste the `TEACHER IDENTITY`
   block verbatim into every prompt that includes her. It matches
   `scripts/gen-3d-character.py`, so she stays recognizably "Madam."
2. **Backgrounds:**
   - *Scene images* (celebrations): **solid pure white background** → easy to drop in.
   - *Reward/gift objects*: **transparent PNG, isolated object, no background,
     no shadow on the ground** → they fly into the basket cleanly.
3. **Style for everything:** `3D Pixar-style render, soft studio lighting, high
   detail, cute, wholesome, vibrant kid-friendly colors, no text, no words,
   no letters`.
4. Export square (1:1). Scenes ≈ 1024×1024; gift objects ≈ 768×768.
5. After generating gift objects, run them through background removal if the AI
   won't do transparency (the repo already uses `rembg` — see
   `scripts/remove-bg.py`).

---

## TEACHER IDENTITY (paste into every teacher prompt)

```
3D Pixar-style animated character, a warm friendly African woman teacher, rich
dark brown skin, short black curly natural afro hair, round dark navy-rimmed
glasses, gentle warm smile, navy blue suit blazer over a crisp white collared
blouse, matching navy blue knee-length pencil skirt, dark flat shoes, full body
from head to shoes.
```

---

## 1. Discover celebration  →  `public/images/character/3d/discover-celebration.png`

End of the picture-discovery journey. (Replaces the plain party icon.)

```
<TEACHER IDENTITY>, standing and clapping and celebrating together with three
happy diverse young children beside her, the children are also clapping and
smiling with joy, everyone laughing, festive celebration moment, confetti in the
air. Solid plain pure white background, centered group, front view, soft studio
lighting, 3D Pixar-style render, high detail, cute, wholesome, no text.
```

## 2. Level-complete celebration  →  `public/images/character/3d/level-celebration.png`

Shown at the end of a letter in Level 1, over hand-clap sounds.

```
<TEACHER IDENTITY>, cheering with both arms raised high in celebration, huge
proud joyful smile, party streamers and colorful confetti falling around her,
gold stars sparkling. Solid plain pure white background, centered, full body,
front view, soft studio lighting, 3D Pixar-style render, high detail, cute,
wholesome, no text.
```

## 3. Teacher pointing at a button (optional — only if the current pose feels off)

The app already has a "pointing" pose. Only regenerate if you want a stronger
"click here" gesture. → `public/images/character/3d/pointing-strong.png`

```
<TEACHER IDENTITY>, leaning slightly forward and pointing firmly with one arm
fully extended to the side, big encouraging smile, inviting the viewer to tap.
Solid plain pure white background, full body, front view, soft studio lighting,
3D Pixar-style render, high detail, cute, wholesome, no text.
```

---

## 4. Reward gift objects  →  `public/images/things/<name>.png`  (TRANSPARENT)

These are the gifts the child collects for winning games. Each one flies into the
basket. Generate each **alone, transparent, no background, no ground shadow**.
Existing ones you can reuse: apple, banana, ice cream, candy. New ones to add:

| File | Prompt (append the shared style + "isolated object, transparent background, no shadow") |
|------|------|
| `cookie.png` | A single round chocolate-chip cookie, appetizing |
| `lollipop.png` | A colorful spiral swirl lollipop on a stick |
| `cupcake.png` | A cute cupcake with pink frosting and a cherry on top |
| `toy-car.png` | A cute chunky red toy car |
| `teddy.png` | A cute soft brown teddy bear sitting |
| `balloon-red.png` | A single glossy red party balloon with a string |
| `star-gold.png` | A single shiny gold five-pointed star, glossy |
| `gift-box.png` | A small wrapped gift box with a bow |

Shared suffix for each:

```
, 3D Pixar-style render, soft studio lighting, high detail, cute, glossy,
vibrant kid-friendly colors, isolated single object, centered, transparent
background, no background, no ground shadow, no text.
```

## 5. Reward basket (where gifts collect)  →  `public/images/decor/basket.png` (TRANSPARENT)

```
A cute open woven basket, front view, empty and inviting, warm brown wicker.
3D Pixar-style render, soft studio lighting, high detail, cute, isolated object,
centered, transparent background, no background, no ground shadow, no text.
```

---

### Naming / placement checklist
- Scenes → `public/images/character/3d/` (white bg is fine there).
- Gift objects → `public/images/things/` (must be transparent).
- Basket → `public/images/decor/` (must be transparent).
- Keep filenames **exactly** as above — the code will look for these paths.
- If any file is missing, the app still runs (it just shows nothing there), so you
  can add them incrementally.
</content>
</invoke>
