# STEP 2 — RECOGNIZE
## Component Specifications

---

## WHAT THIS STEP DOES

4 pictures appear on screen. The child must tap the picture that starts with the 
letter they are learning. 3 correct answers completes the step. Wrong answers get 
gentle feedback with no penalty. Each correct answer gives a reward.

---

## PAGE ROUTE

```
/student/letters/[letter]/step/2
```

---

## SCREEN LAYOUT

```
┌──────────────────────────────────────┐
│  [Home] ──── Progress Bar ─── [Mute] │  15%
├──────────────────────────────────────┤
│                                      │
│  "Touch the picture that starts      │  15%
│         with the letter A!"          │
├──────────────┬───────────────────────┤
│              │                       │
│  [Image 1]   │  [Image 2]            │  40%
│              │                       │
│  [Image 3]   │  [Image 4]            │
│              │                       │
├──────────────┴───────────────────────┤
│  Lottie   ● ● ●   Reward Chest       │  15%
│  Character  (rounds)                 │
├──────────────────────────────────────┤
│  ❤️ ❤️ ❤️  Lives                     │  15%
└──────────────────────────────────────┘
```

---

## COMPONENTS TO BUILD

### 1. `RecognitionGame` — `/src/components/games/RecognitionGame.tsx`

```typescript
interface RecognitionGameProps {
  letterData: LetterData
  onComplete: (stars: number) => void
}
```

**Game Logic:**
```typescript
// State
const [round, setRound] = useState(1)          // 1, 2, 3
const [lives, setLives] = useState(3)          // 3 hearts
const [correctCount, setCorrectCount] = useState(0)
const [currentImages, setCurrentImages] = useState<ImageItem[]>([])
const [selectedId, setSelectedId] = useState<string | null>(null)
const [isAnswered, setIsAnswered] = useState(false)

// Each round: pick 1 correct + 3 wrong images
function buildRound(letterData: LetterData, roundNumber: number) {
  // Correct: pick from letterData.words based on round (rotate through 3 words)
  const correctWord = letterData.words[roundNumber - 1]
  
  // Wrong: pick 3 random distractors
  const wrong = shuffle(DISTRACTORS)
    .filter(d => !d.word.startsWith(letterData.letter))
    .slice(0, 3)
  
  // Shuffle all 4 together
  return shuffle([
    { ...correctWord, isCorrect: true },
    ...wrong.map(w => ({ ...w, isCorrect: false }))
  ])
}
```

---

### 2. `ImageCard` — `/src/components/games/ImageCard.tsx`

```typescript
type CardState = "idle" | "correct" | "wrong" | "dimmed"

interface ImageCardProps {
  image: string
  word: string
  isCorrect: boolean
  state: CardState
  onSelect: () => void
}
```

**Framer Motion animations per state:**
```typescript
const cardVariants = {
  idle: {
    scale: 1,
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    backgroundColor: "#FFFFFF",
  },
  correct: {
    scale: [1, 1.15, 1.05],
    boxShadow: "0 0 0 4px #4CAF50, 0 8px 16px rgba(76,175,80,0.4)",
    backgroundColor: "#F1F8F1",
    transition: { duration: 0.4 }
  },
  wrong: {
    x: [0, -10, 10, -8, 8, -5, 5, 0],
    boxShadow: "0 0 0 4px #FF5252",
    backgroundColor: "#FFF5F5",
    transition: { duration: 0.5 }
  },
  dimmed: {
    scale: 0.95,
    opacity: 0.4,
    transition: { duration: 0.3 }
  }
}
```

**Behavior:**
- `idle` → normal card with image and word label below
- `correct` → green border, scale up, then show sparkles
- `wrong` → red border, shake animation
- `dimmed` → when another card is selected (wrong ones fade out)
- Image is large (80% of card), word label is small text below
- Minimum touch target: 120x120px

---

### 3. `QuestionDisplay` — `/src/components/games/QuestionDisplay.tsx`

```typescript
interface QuestionDisplayProps {
  letter: string
  audio: string  // path to "Touch the picture that starts with A!" audio
}
```

**Behavior:**
- Slides down from top with Framer Motion on mount
- Shows letter in a colorful circle + question text
- Plays audio automatically on mount
- Letter bounces gently to draw attention

---

### 4. `LivesDisplay` — `/src/components/games/LivesDisplay.tsx`

```typescript
interface LivesDisplayProps {
  lives: number  // 0-3
  maxLives: number  // 3
}
```

**Behavior:**
- Shows 3 heart emojis (❤️)
- When life is lost: heart animates out with Framer Motion (scale down + fade)
- All lives lost: brief pause then round restarts (not the whole game)

---

### 5. `RoundIndicator` — `/src/components/games/RoundIndicator.tsx`

```typescript
interface RoundIndicatorProps {
  currentRound: number  // 1-3
  totalRounds: number   // 3
}
```

**Behavior:**
- Shows 3 dots in a row
- Completed rounds: filled colored dot
- Current round: pulsing dot
- Future rounds: empty dot

---

## FULL EVENT FLOW (Step 2)

```
Mount
  → Build round 1 images (1 correct + 3 wrong)
  → Images appear with stagger animation (0.1s delay each)
  → QuestionDisplay slides down
  → Play question audio: "Touch the picture that starts with A!"
  → LottieCharacter: "watching" state

User taps CORRECT image (e.g. Apple)
  → ImageCard state: "correct" (green glow + scale)
  → Other 3 cards: "dimmed" state
  → Play correct feedback audio: "Yes! Apple starts with A!"
  → LottieCharacter: "celebrating" state
  → RewardSystem.giveReward() → reward appears + sound
  → [1.5 seconds pause]
  → Round 2 starts: images slide out + new images slide in
  → correctCount becomes 2
  → Round indicator updates

User taps WRONG image (e.g. Ball)
  → ImageCard state: "wrong" (red glow + shake)
  → Play wrong feedback audio: "Try again!"
  → LottieCharacter: "encouraging" state — points at letter hint
  → Remove 1 life
  → [0.8 seconds pause]
  → Card returns to "idle" state
  → All images still visible — player tries again

All 3 lives lost on same round
  → Round restarts with same images (reshuffled positions)
  → Lives refilled to 3
  → LottieCharacter: "teaching" — gives hint

3 rounds completed
  → Big celebration: screen flashes, Lottie celebrates
  → Play celebration audio: "Amazing! You got them all!"
  → Calculate stars: 3 lives left = 3 stars, 2 left = 2 stars, 1 left = 1 star
  → Show stars with Framer Motion stagger animation
  → Next button appears
```

---

## STAR CALCULATION

```typescript
function calculateStars(totalErrors: number): number {
  if (totalErrors === 0) return 3
  if (totalErrors <= 2) return 2
  return 1
}
```

---

## ZUSTAND STORE

```typescript
// src/store/gameStore.ts (add to existing store)
interface Step2State {
  round: number          // 1-3
  lives: number          // 0-3
  totalErrors: number    // across all rounds
  earnedRewards: Reward[]
  isComplete: boolean
  currentImages: ImageItem[]

  nextRound: () => void
  loseLife: () => void
  addReward: (reward: Reward) => void
  complete: () => void
  reset: () => void
}
```
