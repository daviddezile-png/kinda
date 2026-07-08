# MODIFICATION SPEC — NEW STEP 0 + RESTRUCTURED LEARNING FLOW
## For Coding Agent — Modify Existing Elimu Yangu Project

> **STACK NOTE (read first):** This spec was originally drafted against the
> Next 14 / `src/` layout. This repo is **app-at-root** (no `src/` folder, `@/*`
> → `./*`). All paths below have been corrected accordingly — components live in
> `components/`, types in `types/`. See `SPEC-DEVIATIONS.md` for the full mapping.

---

## WHY THIS CHANGE IS NEEDED

Research on early childhood literacy shows that children cannot connect a letter 
to meaning if they have never seen, touched, or experienced the object the word 
represents. This is called "background knowledge" — without it, letter learning 
becomes empty memorization instead of real understanding.

Source: Studies on background knowledge and reading comprehension (Smith, Snow, 
Serry & Hammond 2021) found that children with more background knowledge 
comprehend significantly better than those without it, regardless of skill level.

We are adding a new step that happens BEFORE the letter is ever shown, so the 
child first understands the object/animal/food itself, then later connects it 
to a letter.

---

## IMPORTANT STRUCTURAL RULE

**Step 0 (Discover) and the old Step 3 (Write/Tracing) must be COMPLETELY SEPARATE 
and unrelated steps.** Do not merge them. Do not let them share components or logic.

- Step 0 = recognizing real-world objects (no letters, no writing, no tracing)
- Step 3 = tracing the shape of a letter with a finger (no object recognition)

These are two different cognitive skills (object recognition vs. motor/writing skill) 
and must remain architecturally independent components, routes, and data structures.

---

## NEW 5-STEP STRUCTURE (replaces the old 4-step structure)

```
STEP 0 — DISCOVER          (NEW — build background knowledge, no letters shown)
STEP 1 — SEE & LISTEN      (existing — letter + word + image appears)
STEP 2 — RECOGNIZE         (existing — pick the correct picture game)
STEP 3 — WRITE             (existing — finger tracing, UNCHANGED, stays separate)
STEP 4 — GAMES             (existing — 8 mini games)
```

Update all routes from `/student/letters/[letter]/step/1-4` to `/student/letters/[letter]/step/0-4`.

Update the `Progress` database model — the `step` field now supports values 0, 1, 2, 3, 4 
instead of 1, 2, 3, 4. No schema change needed, just update validation ranges in API routes.

---

## STEP 0 — "DISCOVER" — FULL SPECIFICATION

### Purpose
Before any letter appears, the child sees a short visual sequence (2-3 images, 
not video) showing a real-world object/animal/food: what it looks like, and what 
it does or how it's used. No letters, no text, no writing — pure picture + audio 
recognition. This builds the background knowledge needed before Step 1 can be 
meaningful.

### Route
```
/student/letters/[letter]/step/0
```

### Screen Layout

```
┌──────────────────────────────────────┐
│  [Home]                      [Mute]  │  10%
├──────────────────────────────────────┤
│                                       │
│                                       │
│         [Image Sequence Area]        │  70%
│        (1 image visible at a time,   │
│         crossfades to next)          │
│                                       │
├──────────────────────────────────────┤
│   Lottie Character (small, corner)   │  10%
├──────────────────────────────────────┤
│      [Mini Quiz — appears at end]    │  10%
└──────────────────────────────────────┘
```

### Content Structure Per Word

Each word used in Step 0 needs 2-3 sequential images (NOT a single image, 
NOT a video):

1. **Image 1 — The object alone.** Clear, simple, real-world style photo or 
   high-quality illustration of just the object/animal/food by itself.
2. **Image 2 — The object in action.** Shows what the object does or how it's 
   used/eaten/interacted with by a person or animal.
3. **(Optional) Image 3 — Result/context.** Shows the outcome (e.g., a child 
   smiling after eating, or the animal in its natural setting).

Each image is shown for approximately 1.5-2 seconds with a crossfade transition 
(Framer Motion `AnimatePresence` with opacity fade), synced to a short audio 
narration line.

### Event Flow

```
Mount
  → Image 1 fades in
  → Audio plays: "This is a Mango." (English) then repeat in Swahili if 
    school language setting includes Swahili: "Hii ni embe."
  → LottieCharacter: "watching" state (small, in corner, not the main focus)

[1.5-2 seconds]
  → Crossfade to Image 2
  → Audio plays action sentence: "The child is eating a mango."
    (use the action sentences already defined in the word list data)

[1.5-2 seconds]
  → Crossfade to Image 3 (if available)
  → Audio plays closing line: "Yummy!" or a simple reaction sound

[All images shown]
  → Transition to Mini Quiz (see below)
```

### Mini Quiz — Completion Check

After the image sequence, show a simple recall game called **"What Did You See?"**

- 3 images appear: the correct object + 2 random distractor objects from 
  OTHER letters' word lists (not from the same letter, to avoid confusion)
- Audio asks: "What did we just see?"
- Child taps the correct image
- Correct tap: image glows green, reward given (reuse existing RewardSystem 
  component), character celebrates
- Wrong tap: gentle shake animation, audio says "Let's look again!" and the 
  image sequence replays once, then the quiz repeats
- No lives system, no failure state — this is recognition practice, not a test
- After 1 correct answer, Step 0 is complete and the Next button activates

### Components to Build

**`DiscoverySequence`** — `components/discover/DiscoverySequence.tsx`
```typescript
interface DiscoveryImage {
  image: string
  audioEn: string
  audioSw?: string
  durationMs: number  // default 1800
}

interface DiscoverySequenceProps {
  images: DiscoveryImage[]  // 2-3 images
  onSequenceComplete: () => void
}
```
Handles crossfade animation between images using Framer Motion `AnimatePresence`. 
Plays the audio for each image. Calls `onSequenceComplete` after the last image's 
audio finishes.

**`WhatDidYouSee`** — `components/discover/WhatDidYouSee.tsx`
```typescript
interface QuizOption {
  id: string
  image: string
  word: string
  isCorrect: boolean
}

interface WhatDidYouSeeProps {
  options: QuizOption[]  // 3 total, 1 correct
  questionAudio: string
  onCorrect: () => void
}
```
Reuses the same visual pattern as the existing `ImageCard` component
(`components/games/ImageCard.tsx`, used by the Step 2 recognize game) —
green glow on correct, gentle shake on wrong. Import and reuse that component
rather than rebuilding it.

**`Step0Client`** — `components/discover/Step0Client.tsx`
Top-level client component for the page. Manages state: `"sequence"` → `"quiz"` → 
`"complete"`. Renders `DiscoverySequence` then `WhatDidYouSee` then shows the 
Next button.

### Data Structure Addition

Add a new top-level field to each letter's data file (alongside the existing 
`words`, `tracing`, `games` fields — do NOT nest this inside `tracing` or any 
writing-related structure):

```json
{
  "letter": "M",
  "discover": {
    "primaryWord": {
      "word": "Mango",
      "images": [
        {
          "image": "/images/discover/mango-alone.jpg",
          "audioEn": "/audio/discover/mango-intro-en.mp3",
          "audioSw": "/audio/discover/mango-intro-sw.mp3"
        },
        {
          "image": "/images/discover/mango-eating.jpg",
          "audioEn": "/audio/discover/mango-action-en.mp3",
          "audioSw": "/audio/discover/mango-action-sw.mp3"
        }
      ],
      "quizDistractors": ["banana", "chicken"]
    }
  }
}
```

This is a SEPARATE field from `tracing` (used by Step 3). They must never 
reference each other's data or components.

### Word List Source

Use the simplified word list (no body parts, no complex/rare items like 
xylophone, x-ray, quail, quilt) already finalized in this conversation. 
Each letter has up to 4 candidate words with action sentences in both 
English and Swahili — pick the FIRST (most locally familiar, e.g. Tanzania-based) 
word from that list as the `primaryWord` for Step 0 and Step 1.

Letters Q and X should be skipped entirely in early version (no Step 0, 
Step 1, or content) — add a comment in the data files noting these are 
deferred to a later phase for older/advanced learners.

### Image Sourcing Rule

Images for Step 0 should look more realistic/photographic than the cartoon 
style used in Steps 1, 2, and 4. Use this prompt pattern with ChatGPT/DALL-E:

```
Realistic, warm, simple photo-style illustration of [OBJECT] for a young 
child's educational app. Natural lighting, clear single subject, 
no text, no cartoon style — semi-realistic illustration. 
Suitable for Tanzanian preschool children aged 3-6.
```

For the "action" image:
```
Realistic, warm illustration of [ACTION SENTENCE, e.g. "a child eating a mango"], 
simple semi-realistic style, no text, friendly for preschool children aged 3-6.
```

---

## CHANGES TO EXISTING FILES

### `00-PROJECT-OVERVIEW.md`
Update folder structure to add:
```
/components
  /discover         → NEW — Step 0 components
/data
  /letters           → each letter JSON now includes a "discover" field
/public
  /images
    /discover         → NEW — Step 0 images (realistic style)
  /audio
    /discover         → NEW — Step 0 audio (English + Swahili)
```

### `01-DATABASE-SCHEMA.md`
No schema change required. Just update any hardcoded comments/validation 
that assumed steps were numbered 1-4 to instead support 0-4.

### `03-LETTER-DATA-STRUCTURE.md`
Add the `discover` field shown above to the master JSON structure and 
TypeScript types. Add this interface to `types/index.ts`:

```typescript
export interface DiscoveryImage {
  image: string
  audioEn: string
  audioSw?: string
}

export interface DiscoveryWord {
  word: string
  images: DiscoveryImage[]
  quizDistractors: string[]
}

export interface LetterData {
  // ...existing fields...
  discover: {
    primaryWord: DiscoveryWord
  }
}
```

### `06-STEP3-WRITE.md`
No functional change. Add a note at the top of the file:

> NOTE: Step 3 (Write/Tracing) is fully independent from Step 0 (Discover). 
> Do not import, reference, or share state/components between these two steps. 
> Step 3 deals only with letter shape tracing and has no object-recognition logic.

### `11-CODING-AGENT-INSTRUCTIONS.md`
Update the build order:

```
PHASE 2 — Core Learning (updated)

Step 6.5 (NEW): Discover data + components
  - Add "discover" field to letter JSON data structure
  - Build DiscoverySequence component
  - Build WhatDidYouSee component (reuses ImageCard from Step 2)
  - Build Step0Client component
  - Create /student/letters/[letter]/step/0 page
  - Test complete flow with letter M (Mango)

Step 7-13: (renumber as needed, otherwise unchanged)
```

Update testing checklist to add:

```
### Step 0 Test
- [ ] Image 1 fades in, audio plays (object alone)
- [ ] Crossfades to Image 2, audio plays (action sentence)
- [ ] Transitions to "What Did You See?" quiz
- [ ] Correct tap = green glow + reward + Next button activates
- [ ] Wrong tap = gentle shake, sequence replays, no penalty/lives lost
- [ ] No letters or text appear anywhere in Step 0
- [ ] Step 0 and Step 3 share NO components or state
```

---

## STUDENT NAVIGATION UPDATE

Update the student home page (`/student`) and the letter progress tracker 
to reflect 5 sub-steps per letter instead of 4. The letter "unlocks" the 
next step only after the current one is marked complete, in this fixed order:

```
Discover (0) → See & Listen (1) → Recognize (2) → Write (3) → Games (4)
```

Pass `totalSteps={5}` (instead of `4`) wherever `components/ui/ProgressBar.tsx`
is used. Note: `ProgressBar` has no built-in `totalSteps` default — `totalSteps`
is an optional prop supplied by each call site — so this is a call-site change,
not a default-value change.

---

## SUMMARY FOR THE AGENT

1. Add a brand new Step 0 ("Discover") — pure image-sequence + audio + simple 
   recognition quiz, with NO letters or writing involved.
2. Keep Step 3 ("Write") completely separate — no shared logic, components, 
   or data with Step 0.
3. Update all step routing, progress tracking, and UI step counters from 
   4 steps to 5 steps (0-4).
4. Use the simplified, locally-familiar word list (no body parts, no complex 
   items) already established for this project, skipping letters Q and X 
   for now.
5. Step 0 images should look more realistic/semi-photographic than the 
   cartoon style in other steps.
