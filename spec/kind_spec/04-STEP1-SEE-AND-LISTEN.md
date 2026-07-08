# STEP 1 — SEE & LISTEN
## Component Specifications

---

## WHAT THIS STEP DOES

The child sees a large letter, hears it spoken, sees a picture representing the letter,
touches the letter 3 times, and gets a surprise reward each time they touch it.
After 3 touches the lowercase letter appears and 2 more words are shown.
A celebration ends the step.

---

## PAGE ROUTE

```
/student/letters/[letter]/step/1
```

---

## SCREEN LAYOUT

```
┌─────────────────────────────────────┐
│  [Home] ──── Progress Bar ── [Mute] │  15%
├──────────┬──────────────┬───────────┤
│          │              │           │
│ Lottie   │  Big Letter  │  Reward   │  65%
│ Character│  + Image     │  Chest    │
│          │              │           │
├──────────┴──────────────┴───────────┤
│     APPLE  (word display)           │  20%
│     [====Next Button====]           │
└─────────────────────────────────────┘
```

---

## COMPONENTS TO BUILD

### 1. `LetterCard` — `/src/components/letters/LetterCard.tsx`

```typescript
// Props
interface LetterCardProps {
  letter: string        // "A"
  lowercase: string     // "a"
  color: string         // "#FF6B6B"
  onTouch: (touchCount: number) => void
  touchCount: number    // 0, 1, 2, 3
}
```

**States (use Framer Motion variants):**
- `hidden` — opacity 0, y: -100
- `entering` — bounce animation, comes from top
- `glowing` — gentle yellow glow pulse, waiting to be touched
- `touched` — scale up 1.2 then back to 1.0, color flash
- `morphing` — letter morphs to lowercase (animate layout)
- `celebrating` — spin + scale + color change

**Framer Motion variants:**
```typescript
const variants = {
  hidden: { opacity: 0, y: -100 },
  entering: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
      duration: 0.8
    }
  },
  glowing: {
    boxShadow: [
      "0 0 0px rgba(255,215,0,0)",
      "0 0 30px rgba(255,215,0,0.8)",
      "0 0 0px rgba(255,215,0,0)"
    ],
    transition: { duration: 2, repeat: Infinity }
  },
  touched: {
    scale: [1, 1.3, 1],
    transition: { duration: 0.4 }
  }
}
```

**Behavior:**
- On mount: play `entering` animation
- After entering: switch to `glowing`
- On touch/click: play `touched` animation + call `onTouch`
- After 3 touches: play `morphing` to show lowercase
- Letter font: use a very large, rounded, child-friendly font (800+ font-weight)
- Letter size: text-[200px] on tablet, text-[120px] on mobile

---

### 2. `AudioManager` — `/src/components/audio/AudioManager.tsx`

```typescript
interface AudioManagerProps {
  letterAudio: string
  wordAudios: string[]
  rewardSounds: string[]
  speechAudios: {
    intro: string
    touchPrompt: string
    celebration: string
    lowercaseIntro: string
  }
  songAudio: string
}

// Methods exposed via ref
interface AudioManagerRef {
  playLetter: () => void
  playWord: (index: number) => void
  playReward: (rewardId: string) => void
  playCharacterSpeech: (key: string) => void
  playSong: () => void
  stopAll: () => void
}
```

**Rules:**
- Preload ALL audio files on component mount using Howler.js
- Use a queue — never overlap two important sounds
- Reward sounds CAN overlap with character speech (they are short)
- Show loading state while preloading

**Implementation:**
```typescript
"use client"
import { useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { Howl } from "howler"

const AudioManager = forwardRef<AudioManagerRef, AudioManagerProps>((props, ref) => {
  const sounds = useRef<Record<string, Howl>>({})

  useEffect(() => {
    // Preload all sounds
    sounds.current = {
      letter: new Howl({ src: [props.letterAudio], preload: true }),
      word0: new Howl({ src: [props.wordAudios[0]], preload: true }),
      word1: new Howl({ src: [props.wordAudios[1]], preload: true }),
      word2: new Howl({ src: [props.wordAudios[2]], preload: true }),
      intro: new Howl({ src: [props.speechAudios.intro], preload: true }),
      touchPrompt: new Howl({ src: [props.speechAudios.touchPrompt], preload: true }),
      celebration: new Howl({ src: [props.speechAudios.celebration], preload: true }),
      song: new Howl({ src: [props.songAudio], preload: true }),
    }
    // Preload reward sounds
    props.rewardSounds.forEach((sound, i) => {
      sounds.current[`reward${i}`] = new Howl({ src: [sound], preload: true })
    })
  }, [])

  useImperativeHandle(ref, () => ({
    playLetter: () => sounds.current.letter?.play(),
    playWord: (index) => sounds.current[`word${index}`]?.play(),
    playReward: (id) => sounds.current[id]?.play(),
    playCharacterSpeech: (key) => sounds.current[key]?.play(),
    playSong: () => sounds.current.song?.play(),
    stopAll: () => Object.values(sounds.current).forEach(s => s.stop()),
  }))

  return null // No UI — purely functional
})
```

---

### 3. `LottieCharacter` — `/src/components/character/LottieCharacter.tsx`

```typescript
type CharacterState = 
  | "idle" 
  | "teaching" 
  | "pointing" 
  | "happy" 
  | "excited" 
  | "celebrating" 
  | "nom_nom"
  | "watching"

interface LottieCharacterProps {
  state: CharacterState
  size?: number // default 200
}
```

**Lottie JSON files needed (download from LottieFiles.com):**
- `/public/images/character/idle.json` — character standing, gentle breathing
- `/public/images/character/teaching.json` — character pointing
- `/public/images/character/happy.json` — character smiling/nodding
- `/public/images/character/excited.json` — character jumping
- `/public/images/character/celebrating.json` — character dancing
- `/public/images/character/nom_nom.json` — character eating with happy face
- `/public/images/character/watching.json` — character looking sideways

**Implementation:**
```typescript
"use client"
import Lottie from "lottie-react"
import { useEffect, useState } from "react"

const CHARACTER_ANIMATIONS: Record<CharacterState, string> = {
  idle: "/images/character/idle.json",
  teaching: "/images/character/teaching.json",
  happy: "/images/character/happy.json",
  excited: "/images/character/excited.json",
  celebrating: "/images/character/celebrating.json",
  nom_nom: "/images/character/nom_nom.json",
  watching: "/images/character/watching.json",
  pointing: "/images/character/teaching.json",
}

export function LottieCharacter({ state, size = 200 }: LottieCharacterProps) {
  const [animData, setAnimData] = useState(null)

  useEffect(() => {
    fetch(CHARACTER_ANIMATIONS[state])
      .then(r => r.json())
      .then(setAnimData)
  }, [state])

  if (!animData) return <div style={{ width: size, height: size }} />

  return (
    <Lottie
      animationData={animData}
      loop={true}
      style={{ width: size, height: size }}
    />
  )
}
```

---

### 4. `RewardSystem` — `/src/components/rewards/RewardSystem.tsx`

```typescript
interface RewardSystemProps {
  rewards: Reward[]
  onRewardGiven: (reward: Reward) => void
}

interface RewardSystemRef {
  giveReward: () => void
}
```

**Behavior:**
- When `giveReward()` is called, pick a random reward from the list
- Show reward in center of screen with Framer Motion pop animation
- Play the reward sound via Howler.js
- After 1.5 seconds, animate reward flying to the chest (top-right corner)
- Call `onRewardGiven` callback

**Animation sequence:**
```typescript
// 1. Reward pops up from nothing
initial: { scale: 0, opacity: 0 }
animate: { scale: 1.2, opacity: 1 } // duration: 0.3s

// 2. Reward bounces
animate: { scale: 1.0 } // duration: 0.2s

// 3. After 1.5s, flies to chest position
animate: { 
  x: chestPosition.x, 
  y: chestPosition.y, 
  scale: 0.2,
  opacity: 0 
} // duration: 0.5s
```

---

### 5. `RewardChest` — `/src/components/rewards/RewardChest.tsx`

```typescript
interface RewardChestProps {
  rewards: Reward[]  // earned rewards
  isOpen?: boolean
}
```

**Behavior:**
- Shows chest icon with count badge in top-right corner
- Shakes with Framer Motion when new reward arrives
- Opens when clicked to show all earned rewards
- Each reward inside bounces when chest opens

---

### 6. `WordDisplay` — `/src/components/letters/WordDisplay.tsx`

```typescript
interface WordDisplayProps {
  word: string        // "APPLE"
  audio: string       // audio file path
  isHighlighting?: boolean
}
```

**Behavior:**
- Shows word in large, bold, child-friendly font
- Each letter lights up one by one in sync with audio (use Howler.js `onplay` + setTimeout)
- After all letters lit, whole word glows briefly

---

### 7. `ProgressBar` — `/src/components/ui/ProgressBar.tsx`

```typescript
interface ProgressBarProps {
  current: number  // 1-26
  total: number    // 26
  step?: number    // 1-4
  totalSteps?: number // 4
}
```

---

## FULL EVENT FLOW (Step 1)

```
Mount
  → Preload all audio (AudioManager)
  → Show loading spinner
  
Audio loaded
  → LetterCard enters with bounce animation
  → Play letterAudio ("A")
  → [1 second pause]
  → Play wordAudio[0] ("Apple")
  → WordCard slides in from right
  
[2 seconds]
  → LottieCharacter switches to "teaching"
  → Play characterSpeech.intro ("Look! This is the letter A — A is for Apple!")
  
[Speech ends]
  → LetterCard switches to "glowing"
  → Play characterSpeech.touchPrompt ("Touch the letter A!")
  
User touches letter (Touch #1)
  → LetterCard plays "touched" animation
  → Play letterAudio ("A!")
  → LottieCharacter switches to "happy"
  → RewardSystem.giveReward() called → Candy appears + crunch sound
  → LottieCharacter switches to "nom_nom" for 2 seconds
  → LetterCard returns to "glowing"

User touches letter (Touch #2)
  → LetterCard plays "touched" animation
  → Play wordAudio[0] ("Apple!")
  → WordCard bounces
  → RewardSystem.giveReward() called → Toy Car appears + vroom sound
  → LottieCharacter switches to "excited"
  → LetterCard returns to "glowing"

User touches letter (Touch #3)
  → LetterCard plays "touched" animation
  → Play letterAudio ("A!")
  → LetterCard plays "morphing" — big A slowly becomes small a
  → Play characterSpeech.lowercaseIntro ("Big A... and small a!")
  → RewardSystem.giveReward() called → Ice Cream appears + slurp sound
  → LottieCharacter switches to "nom_nom"

[2 seconds after Touch #3]
  → Show words 2 and 3 (Ant, Arrow) one by one with their images
  → Each word: image slides in + audio plays
  → LottieCharacter points at each word

[All 3 words shown]
  → Play song (Suno AI audio)
  → LottieCharacter dances
  → All 3 words + letter show together for 3 seconds
  → Play characterSpeech.celebration ("You learned the letter A!")
  → LottieCharacter plays "celebrating"
  → RewardChest opens briefly showing all 3 rewards
  → Next button pulses and becomes active
```

---

## ZUSTAND STORE FOR THIS STEP

```typescript
// src/store/gameStore.ts
import { create } from "zustand"

interface Step1State {
  touchCount: number
  isComplete: boolean
  earnedRewards: Reward[]
  currentState: "loading" | "entering" | "glowing" | "touched" | "morphing" | "words" | "song" | "complete"
  
  // Actions
  incrementTouch: () => void
  addReward: (reward: Reward) => void
  setCurrentState: (state: Step1State["currentState"]) => void
  reset: () => void
}

export const useStep1Store = create<Step1State>((set) => ({
  touchCount: 0,
  isComplete: false,
  earnedRewards: [],
  currentState: "loading",
  
  incrementTouch: () => set((state) => ({ 
    touchCount: state.touchCount + 1,
    isComplete: state.touchCount + 1 >= 3
  })),
  addReward: (reward) => set((state) => ({
    earnedRewards: [...state.earnedRewards, reward]
  })),
  setCurrentState: (currentState) => set({ currentState }),
  reset: () => set({ touchCount: 0, isComplete: false, earnedRewards: [], currentState: "loading" }),
}))
```

---

## PAGE COMPONENT

```typescript
// src/app/student/letters/[letter]/step/1/page.tsx
import { getLetter } from "@/lib/letters"
import { Step1Client } from "@/components/letters/Step1Client"

interface PageProps {
  params: { letter: string }
}

export default async function Step1Page({ params }: PageProps) {
  const letterData = await getLetter(params.letter.toUpperCase())
  
  if (!letterData) return <div>Letter not found</div>
  
  return <Step1Client letterData={letterData} />
}
```

```typescript
// src/components/letters/Step1Client.tsx
"use client"
// All the client-side logic lives here
// Uses all components above: LetterCard, AudioManager, LottieCharacter, RewardSystem, etc.
```
