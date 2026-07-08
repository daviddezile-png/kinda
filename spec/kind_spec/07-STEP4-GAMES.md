# STEP 4 — GAMES (All 8 Games)
## Component Specifications

---

## HOW STEP 4 WORKS

- System randomly selects 3 games from the 8 available
- Child plays game 1 → gets rewards → game 2 starts → game 3 → step complete
- Each game has its own component
- One parent `GameSelector` component manages all games

---

## PAGE ROUTE

```
/student/letters/[letter]/step/4
```

---

## GAME SELECTOR — `/src/components/games/GameSelector.tsx`

```typescript
interface GameSelectorProps {
  letterData: LetterData
  onComplete: (totalStars: number) => void
}

const ALL_GAMES = [
  "memory_cards",
  "letter_puzzle",
  "feed_character",
  "tap_letter",
  "build_word",
  "match_picture",
  "catch_bucket",
  "sing_along",
] as const

type GameId = typeof ALL_GAMES[number]

// Select 3 random games
function selectGames(): GameId[] {
  return [...ALL_GAMES]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
}
```

**Behavior:**
- On mount: select 3 random games, store in state
- Show current game with full-screen transition between games
- Track stars from each game
- After game 3: show total stars + completion screen

---

## GAME 1 — MEMORY CARDS
### `/src/components/games/MemoryCardGame.tsx`

```typescript
interface MemoryCardGameProps {
  letterData: LetterData
  onComplete: (stars: number) => void
}
```

**Setup:** 6 cards = 3 pairs (one pair per word: Apple, Ant, Arrow)

**Card states:** `hidden` | `revealed` | `matched` | `mismatched`

**Framer Motion flip animation:**
```typescript
// Card flip — Y axis rotation
const cardVariants = {
  hidden: { rotateY: 0 },     // shows card back
  revealed: { rotateY: 180 }, // shows card front (image)
  matched: { 
    rotateY: 180,
    scale: [1, 1.1, 1],
    boxShadow: "0 0 0 4px #4CAF50"
  },
  mismatched: {
    rotateY: 0,
    transition: { delay: 1.5 }  // show front for 1.5s then flip back
  }
}
```

**Game Logic:**
```typescript
const [flipped, setFlipped] = useState<string[]>([])    // currently face-up (max 2)
const [matched, setMatched] = useState<string[]>([])    // successfully matched
const [moves, setMoves] = useState(0)

function handleCardClick(cardId: string) {
  if (flipped.length === 2) return   // already 2 cards face up
  if (flipped.includes(cardId)) return // already flipped this card
  if (matched.includes(cardId)) return // already matched
  
  const newFlipped = [...flipped, cardId]
  setFlipped(newFlipped)
  setMoves(m => m + 1)
  
  if (newFlipped.length === 2) {
    // Check for match
    const [first, second] = newFlipped
    const firstCard = cards.find(c => c.id === first)
    const secondCard = cards.find(c => c.id === second)
    
    if (firstCard?.pairId === secondCard?.pairId) {
      // MATCH!
      setMatched([...matched, first, second])
      setFlipped([])
      // Give reward
      onReward()
      // Play match sound + character celebrates
    } else {
      // NO MATCH — flip back after 1.5s
      setTimeout(() => setFlipped([]), 1500)
    }
  }
}

// Stars calculation
function calculateStars(moves: number, totalPairs: number): number {
  const perfectMoves = totalPairs * 2  // minimum possible moves
  if (moves <= perfectMoves) return 3
  if (moves <= perfectMoves * 1.5) return 2
  return 1
}
```

**When matched pair found:**
- Both cards glow green
- Images on matched cards do a little dance (Framer Motion scale animation)
- Play match sound (Freesound.org)
- RewardSystem gives reward
- LottieCharacter: "excited"

**When all pairs matched:**
- All cards flip over and bounce together
- Big celebration
- Stars appear

---

## GAME 2 — LETTER PUZZLE
### `/src/components/games/LetterPuzzle.tsx`

```typescript
interface LetterPuzzleProps {
  letterData: LetterData
  onComplete: (stars: number) => void
}
```

**Setup:** Letter A is cut into 4 pieces that are scattered on screen

**Implementation using Framer Motion drag:**
```typescript
const [pieces, setPieces] = useState<PuzzlePiece[]>([
  { id: "top", x: random(), y: random(), isPlaced: false, targetX: 150, targetY: 50 },
  { id: "left", x: random(), y: random(), isPlaced: false, targetX: 100, targetY: 150 },
  { id: "right", x: random(), y: random(), isPlaced: false, targetX: 200, targetY: 150 },
  { id: "bottom", x: random(), y: random(), isPlaced: false, targetX: 150, targetY: 250 },
])

function handleDragEnd(pieceId: string, x: number, y: number) {
  const piece = pieces.find(p => p.id === pieceId)
  if (!piece) return
  
  // Check if close enough to target (snap zone: 40px)
  const distance = Math.sqrt(
    Math.pow(x - piece.targetX, 2) + Math.pow(y - piece.targetY, 2)
  )
  
  if (distance < 40) {
    // SNAP TO POSITION
    setPieces(prev => prev.map(p => 
      p.id === pieceId 
        ? { ...p, x: p.targetX, y: p.targetY, isPlaced: true } 
        : p
    ))
    // Play snap sound
    // Give section reward
    // Check if all placed
  }
}
```

**Framer Motion drag implementation:**
```typescript
<motion.div
  drag
  dragMomentum={false}
  dragElastic={0.1}
  onDragEnd={(_, info) => handleDragEnd(piece.id, info.point.x, info.point.y)}
  animate={piece.isPlaced ? { x: piece.targetX, y: piece.targetY } : {}}
  whileDrag={{ scale: 1.1, zIndex: 10, cursor: "grabbing" }}
  className="absolute w-24 h-24 cursor-grab select-none"
>
  {/* SVG piece rendering */}
</motion.div>
```

---

## GAME 3 — FEED THE CHARACTER
### `/src/components/games/FeedCharacter.tsx`

```typescript
interface FeedCharacterProps {
  letterData: LetterData
  onComplete: (stars: number) => void
}
```

**Setup:**
- Character stands with mouth open (Lottie animation)
- Items fall from top every 2 seconds
- Mix of correct (starts with letter) and wrong items
- Child taps correct items to send to character's mouth

**Falling items logic:**
```typescript
const [fallingItems, setFallingItems] = useState<FallingItem[]>([])
const [stomachFill, setStomachFill] = useState(0)  // 0-100%
const [score, setScore] = useState(0)

// Spawn items every 2 seconds
useEffect(() => {
  const interval = setInterval(() => {
    const isCorrect = Math.random() > 0.5  // 50% correct items
    const item = isCorrect
      ? randomFrom(letterData.games.feed_character.correctItems)
      : randomFrom(DISTRACTORS)
    
    const newItem: FallingItem = {
      id: Date.now().toString(),
      ...item,
      isCorrect,
      x: Math.random() * 80 + 10, // 10-90% of screen width
      startY: -10,
    }
    
    setFallingItems(prev => [...prev, newItem])
    
    // Remove item if not tapped after 4 seconds
    setTimeout(() => {
      setFallingItems(prev => prev.filter(i => i.id !== newItem.id))
    }, 4000)
    
  }, 2000)
  
  return () => clearInterval(interval)
}, [])

function handleItemTap(item: FallingItem) {
  if (item.isCorrect) {
    // Send to character mouth
    animateToMouth(item)
    setStomachFill(prev => prev + 20) // Fill stomach by 20%
    setScore(s => s + 1)
    // Character: "nom_nom" + happy expression
    // Play nom nom sound
    // Give reward
  } else {
    // Item hits wall and falls
    animateWallHit(item)
    // Character: shakes head "No no!"
    // Play gentle wrong sound
  }
  
  setFallingItems(prev => prev.filter(i => i.id !== item.id))
}
```

**Framer Motion falling animation:**
```typescript
<motion.div
  initial={{ y: "-10vh", x: `${item.x}vw` }}
  animate={{ y: "110vh" }}
  transition={{ duration: 4, ease: "linear" }}
  onClick={() => handleItemTap(item)}
  className="absolute cursor-pointer"
>
  <img src={item.image} className="w-16 h-16 object-contain" />
</motion.div>
```

**Stomach fill indicator:**
- Lottie character has a visible stomach that fills with color
- At 100%: game ends with big celebration

---

## GAME 4 — TAP THE LETTER
### `/src/components/games/TapLetter.tsx`

```typescript
interface TapLetterProps {
  letterData: LetterData
  onComplete: (stars: number) => void
}
```

**Setup:**
- 15 letters float around screen (2-3 are target letter, rest are random)
- Child taps target letters
- Timer: 30 seconds
- Each correct tap: particle burst + point
- Wrong tap: gentle shake

```typescript
const [letters, setLetters] = useState<FloatingLetter[]>([])
const [score, setScore] = useState(0)
const [timeLeft, setTimeLeft] = useState(30)

// Generate floating letters
useEffect(() => {
  const targetLetter = letterData.letter
  const otherLetters = "BCDEFGHIJKLMNOPQRSTUVWXYZ"
    .replace(targetLetter, "")
    .split("")
  
  const newLetters: FloatingLetter[] = [
    // 3 correct letters
    ...Array(3).fill(null).map((_, i) => ({
      id: `correct-${i}`,
      letter: targetLetter,
      isCorrect: true,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
    })),
    // 12 wrong letters
    ...shuffle(otherLetters).slice(0, 12).map((letter, i) => ({
      id: `wrong-${i}`,
      letter,
      isCorrect: false,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
    }))
  ]
  
  setLetters(newLetters)
}, [])

function handleLetterTap(id: string, isCorrect: boolean) {
  if (isCorrect) {
    // Burst animation then remove
    setScore(s => s + 1)
    setLetters(prev => prev.filter(l => l.id !== id))
    // Add new correct letter to keep 3 on screen
    // Play pop sound
    // Particle burst at tap position
  } else {
    // Shake the letter
    // Play soft wrong sound
  }
}
```

**Framer Motion floating animation:**
```typescript
<motion.div
  key={letter.id}
  animate={{
    x: [letter.x + "vw", (letter.x + 5) + "vw", letter.x + "vw"],
    y: [letter.y + "vh", (letter.y - 5) + "vh", letter.y + "vh"],
  }}
  transition={{
    duration: 2 + Math.random() * 2,
    repeat: Infinity,
    ease: "easeInOut"
  }}
  onClick={() => handleLetterTap(letter.id, letter.isCorrect)}
  className="absolute text-5xl font-black cursor-pointer select-none"
  style={{ color: letter.isCorrect ? letterData.color : "#999999" }}
>
  {letter.letter}
</motion.div>
```

**Countdown timer:**
```typescript
// Last 5 seconds: show countdown with beep sounds
useEffect(() => {
  if (timeLeft <= 5 && timeLeft > 0) {
    playBeepSound()
  }
  if (timeLeft === 0) {
    endGame()
  }
}, [timeLeft])
```

**Stars:** 3 correct = 1 star, 5 correct = 2 stars, 8+ correct = 3 stars

---

## GAME 5 — BUILD THE WORD
### `/src/components/games/BuildWord.tsx`

```typescript
interface BuildWordProps {
  letterData: LetterData
  onComplete: (stars: number) => void
}
```

**Setup:**
- Image of word shown (e.g. Apple)
- Empty slots below image: _ _ _ _ _
- Letter tiles scattered at bottom: A P P L E + 4 wrong letters
- Child taps letters in correct order to fill slots

```typescript
const [currentWordIndex, setCurrentWordIndex] = useState(0)
const [filledSlots, setFilledSlots] = useState<string[]>([])
const [availableLetters, setAvailableLetters] = useState<LetterTile[]>([])

const currentWord = letterData.games.build_word.words[currentWordIndex]

// Build available letters
useEffect(() => {
  const wordLetters = currentWord.word.split("").map((l, i) => ({
    id: `correct-${i}`,
    letter: l,
    isUsed: false,
  }))
  
  const extraLetters = currentWord.extraLetters.map((l, i) => ({
    id: `extra-${i}`,
    letter: l,
    isUsed: false,
  }))
  
  setAvailableLetters(shuffle([...wordLetters, ...extraLetters]))
  setFilledSlots([])
}, [currentWordIndex])

function handleLetterTap(tile: LetterTile) {
  if (tile.isUsed) return
  
  const nextSlotIndex = filledSlots.length
  const expectedLetter = currentWord.word[nextSlotIndex]
  
  if (tile.letter === expectedLetter) {
    // CORRECT LETTER
    setFilledSlots([...filledSlots, tile.letter])
    setAvailableLetters(prev => prev.map(t => 
      t.id === tile.id ? { ...t, isUsed: true } : t
    ))
    // Play letter sound
    // Letter tile jumps into slot
    // Play click sound
    
    // Check if word complete
    if (filledSlots.length + 1 === currentWord.word.length) {
      onWordComplete()
    }
  } else {
    // WRONG LETTER — shake the tile
    shakeTile(tile.id)
  }
}

function onWordComplete() {
  // All letters glow and animate
  // Play word audio
  // Give big reward
  // Move to next word or complete game
}
```

**Slot animation when letter enters:**
```typescript
<motion.div
  key={index}
  className="w-12 h-14 border-b-4 border-gray-300 flex items-center justify-center"
>
  <AnimatePresence>
    {filledSlots[index] && (
      <motion.span
        initial={{ y: -30, opacity: 0, scale: 0.5 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400 }}
        className="text-3xl font-black"
        style={{ color: letterData.color }}
      >
        {filledSlots[index]}
      </motion.span>
    )}
  </AnimatePresence>
</motion.div>
```

---

## GAME 6 — MATCH PICTURE TO LETTER
### `/src/components/games/MatchPicture.tsx`

```typescript
interface MatchPictureProps {
  letterData: LetterData
  onComplete: (stars: number) => void
}
```

**Setup:**
- 3 rounds
- Left side: one letter shown
- Right side: 4 images (1 correct, 3 wrong)
- Child draws line from letter to correct image using Canvas API

```typescript
// Canvas line drawing
const canvasRef = useRef<HTMLCanvasElement>(null)
const [isDrawing, setIsDrawing] = useState(false)
const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null)
const [currentPos, setCurrentPos] = useState<{x: number, y: number} | null>(null)

function handleLetterMouseDown(e: React.MouseEvent) {
  const rect = canvasRef.current?.getBoundingClientRect()
  if (!rect) return
  setIsDrawing(true)
  setStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
}

function handleMouseMove(e: React.MouseEvent) {
  if (!isDrawing) return
  const rect = canvasRef.current?.getBoundingClientRect()
  if (!rect) return
  setCurrentPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  drawLine()
}

function drawLine() {
  const ctx = canvasRef.current?.getContext("2d")
  if (!ctx || !startPos || !currentPos) return
  
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.beginPath()
  ctx.moveTo(startPos.x, startPos.y)
  ctx.lineTo(currentPos.x, currentPos.y)
  ctx.strokeStyle = letterData.color
  ctx.lineWidth = 4
  ctx.lineCap = "round"
  ctx.stroke()
}

function handleMouseUp(targetImageId: string) {
  setIsDrawing(false)
  
  if (targetImageId === correctImageId) {
    // GREEN line animation
    drawGreenLine()
    // Give reward
    // Next round
  } else {
    // RED line flashes and disappears
    drawRedLine()
    setTimeout(clearCanvas, 800)
  }
}
```

---

## GAME 7 — CATCH IN BUCKET
### `/src/components/games/CatchBucket.tsx`

```typescript
interface CatchBucketProps {
  letterData: LetterData
  onComplete: (stars: number) => void
}
```

**Setup:**
- Bucket at bottom with letter label: "Letter A"
- Items fly from all directions
- Child taps correct items to redirect them into bucket
- Bucket fills as items enter

```typescript
const [bucketFill, setBucketFill] = useState(0)  // 0-5 items
const [score, setScore] = useState(0)
const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([])

// Spawn items from random edges
useEffect(() => {
  const interval = setInterval(spawnItem, 1800)
  return () => clearInterval(interval)
}, [])

function spawnItem() {
  const isCorrect = Math.random() > 0.45 // 55% correct
  const item = isCorrect
    ? randomFrom(letterData.games.feed_character.correctItems)
    : randomFrom(DISTRACTORS)
  
  // Random spawn edge: left, right, or top
  const edge = randomFrom(["left", "right", "top"])
  const spawnPos = getEdgePosition(edge)
  
  setFlyingItems(prev => [...prev, {
    id: Date.now().toString(),
    ...item,
    isCorrect,
    ...spawnPos,
    rotation: Math.random() * 360,
  }])
}

function handleItemTap(item: FlyingItem) {
  if (item.isCorrect) {
    // Animate to bucket
    animateToBucket(item)
    setBucketFill(prev => prev + 1)
    setScore(s => s + 1)
    // Play splash sound
    // Character cheers
    
    if (bucketFill + 1 >= 5) {
      completeGame()
    }
  } else {
    // Item bounces off invisible wall
    animateBounce(item)
    // Play bounce sound
    // Character shakes head
  }
  
  setFlyingItems(prev => prev.filter(i => i.id !== item.id))
}
```

**Bucket fill visualization:**
- Bucket SVG with fill level that rises
- Each item that enters causes a small splash animation

---

## GAME 8 — SING ALONG
### `/src/components/games/SingAlong.tsx`

```typescript
interface SingAlongProps {
  letterData: LetterData
  onComplete: (stars: number) => void
}
```

**Setup:**
- Song plays (Suno AI audio)
- Lyrics appear on screen, each word highlights as sung (karaoke style)
- Song pauses at blank words — child chooses from 3 options
- Correct choice: song continues
- LottieCharacter dances throughout

```typescript
const [currentTime, setCurrentTime] = useState(0)
const [currentLineIndex, setCurrentLineIndex] = useState(0)
const [isPaused, setIsPaused] = useState(false)
const [score, setScore] = useState(0)
const soundRef = useRef<Howl | null>(null)

const lyricsLines = letterData.song.lyricsLines

// Sync lyrics with audio
useEffect(() => {
  soundRef.current = new Howl({
    src: [letterData.song.audio],
    onplay: () => {
      // Update current time every 100ms
      const interval = setInterval(() => {
        if (!soundRef.current) return
        const time = soundRef.current.seek() as number
        setCurrentTime(time)
        
        // Check if we hit a blank timestamp
        lyricsLines.forEach((line, index) => {
          if (Math.abs(time - line.timestamp) < 0.1 && !isPaused) {
            soundRef.current?.pause()
            setIsPaused(true)
            setCurrentLineIndex(index)
          }
        })
      }, 100)
      
      return () => clearInterval(interval)
    }
  })
  
  soundRef.current.play()
}, [])

function handleChoiceSelect(choice: string, correctAnswer: string) {
  if (choice === correctAnswer) {
    // CORRECT
    setScore(s => s + 1)
    setIsPaused(false)
    soundRef.current?.play()
    // Flash correct answer green
    // Give reward
    // Character cheers
  } else {
    // WRONG — shake wrong choice, highlight correct
    // Try again — song replays that line
    soundRef.current?.seek(lyricsLines[currentLineIndex].timestamp - 1)
    soundRef.current?.play()
  }
}
```

**Karaoke word highlighting:**
```typescript
// Split each lyric line into words
// Highlight current word based on audio time
function getCurrentWord(line: string, lineStartTime: number, currentTime: number): number {
  const words = line.split(" ")
  const elapsed = currentTime - lineStartTime
  const wordDuration = 0.5 // approximate seconds per word
  return Math.min(Math.floor(elapsed / wordDuration), words.length - 1)
}
```

**Microphone detection (bonus feature):**
```typescript
// Detect if child is singing (any sound = singing)
async function setupMicrophone() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    
    const checkVolume = setInterval(() => {
      analyser.getByteFrequencyData(dataArray)
      const volume = dataArray.reduce((a, b) => a + b) / dataArray.length
      
      if (volume > 20) {
        // Child is making sound — character gets more excited
        setCharacterState("very_excited")
      }
    }, 200)
    
    return () => clearInterval(checkVolume)
  } catch {
    // Microphone not available — no problem, game works without it
  }
}
```

---

## REWARDS POOL FOR ALL GAMES

```typescript
// src/data/rewards.ts
export const ALL_REWARDS = [
  { id: "candy", type: "food", name: "Candy", image: "/images/rewards/candy.png", sound: "/audio/rewards/crunch.mp3", characterState: "nom_nom" },
  { id: "car", type: "toy", name: "Toy Car", image: "/images/rewards/car.png", sound: "/audio/rewards/vroom.mp3", characterState: "excited" },
  { id: "ice_cream", type: "food", name: "Ice Cream", image: "/images/rewards/ice-cream.png", sound: "/audio/rewards/slurp.mp3", characterState: "nom_nom" },
  { id: "candy2", type: "food", name: "Lollipop", image: "/images/rewards/lollipop.png", sound: "/audio/rewards/pop.mp3", characterState: "nom_nom" },
  { id: "teddy", type: "toy", name: "Teddy Bear", image: "/images/rewards/teddy.png", sound: "/audio/rewards/squeeze.mp3", characterState: "happy" },
  { id: "ball", type: "toy", name: "Ball", image: "/images/rewards/ball.png", sound: "/audio/rewards/bounce.mp3", characterState: "excited" },
  { id: "cake", type: "food", name: "Cake", image: "/images/rewards/cake.png", sound: "/audio/rewards/mmm.mp3", characterState: "nom_nom" },
  { id: "chips", type: "food", name: "Chips", image: "/images/rewards/chips.png", sound: "/audio/rewards/crunch2.mp3", characterState: "nom_nom" },
]
```

---

## GAME COMPLETION SCREEN

After all 3 games:

```typescript
// src/components/games/GameCompletionScreen.tsx
interface GameCompletionScreenProps {
  letter: string
  totalStars: number    // 0-9 (3 games x 3 stars each)
  rewards: Reward[]     // all rewards earned
  onContinue: () => void
}
```

**Screen shows:**
- Big letter with celebration animation
- All earned rewards bouncing in reward chest
- Stars count (shown as X out of 9)
- "Next Letter →" button
- LottieCharacter dancing

---

## AUDIO FILES NEEDED FOR ALL GAMES

```
/public/audio/games/
  match-found.mp3          ← cards match sound
  card-flip.mp3            ← card turning sound
  puzzle-snap.mp3          ← piece snaps into place
  item-catch.mp3           ← catching item in bucket
  splash.mp3               ← item enters bucket
  pop.mp3                  ← letter tap in tap game
  countdown-beep.mp3       ← last 5 seconds beep
  letter-tap.mp3           ← tapping wrong letter
  word-complete.mp3        ← word fully built
  game-complete.mp3        ← game finished fanfare
```
