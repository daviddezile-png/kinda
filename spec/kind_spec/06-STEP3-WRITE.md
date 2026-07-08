# STEP 3 — WRITE (TRACING)
## Component Specifications

---

## WHAT THIS STEP DOES

The child traces the letter with their finger on a canvas. 
Guide dots show the path. Each stroke completed gives a reward.
After completing the uppercase letter, the letter transforms into 
a picture (e.g. A → Apple image). Then the child traces the lowercase letter.

---

## PAGE ROUTE

```
/student/letters/[letter]/step/3
```

---

## SCREEN LAYOUT

```
┌──────────────────────────────────────┐
│  [Home] ──── Progress Bar ─── [Mute] │  15%
├──────────────────────────────────────┤
│  "Trace the letter A with            │  10%
│         your finger!"                │
├─────────────────┬────────────────────┤
│                 │                    │
│ Lottie          │  ┌──────────────┐  │
│ Character       │  │              │  │
│                 │  │   CANVAS     │  │  60%
│                 │  │   (tracing)  │  │
│                 │  │              │  │
│                 │  └──────────────┘  │
│                 │  [Erase Button]    │
├─────────────────┴────────────────────┤
│              Reward Chest            │  15%
└──────────────────────────────────────┘
```

---

## COMPONENTS TO BUILD

### 1. `TracingCanvas` — `/src/components/tracing/TracingCanvas.tsx`

```typescript
interface TracingCanvasProps {
  letterData: LetterData
  isUppercase: boolean
  onSectionComplete: (sectionId: string, reward: string) => void
  onLetterComplete: () => void
}
```

**Implementation using HTML5 Canvas API:**

```typescript
"use client"
import { useRef, useEffect, useState, useCallback } from "react"

export function TracingCanvas({ letterData, isUppercase, onSectionComplete, onLetterComplete }: TracingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const currentPath = useRef<{x: number, y: number}[]>([])
  const completedSections = useRef<Set<string>>(new Set())
  
  const tracingData = isUppercase 
    ? letterData.tracing.uppercase 
    : letterData.tracing.lowercase

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    // Draw guide dots
    drawGuideDots(ctx, tracingData)
    
    // Draw directional arrows
    drawArrows(ctx, tracingData)
  }, [tracingData])

  // Draw guide dots function
  function drawGuideDots(ctx: CanvasRenderingContext2D, data: TracingData) {
    data.sections.forEach(section => {
      section.guideDots.forEach(dot => {
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, 12, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(200, 200, 200, 0.6)"
        ctx.fill()
        ctx.strokeStyle = "rgba(150, 150, 150, 0.8)"
        ctx.lineWidth = 2
        ctx.stroke()
      })
    })
  }

  // Touch/Mouse handlers
  const startDrawing = useCallback((x: number, y: number) => {
    isDrawing.current = true
    currentPath.current = [{ x, y }]
    
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx) return
    
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.strokeStyle = letterData.color
    ctx.lineWidth = 10
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [letterData.color])

  const continueDrawing = useCallback((x: number, y: number) => {
    if (!isDrawing.current) return
    
    currentPath.current.push({ x, y })
    
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx) return
    
    ctx.lineTo(x, y)
    ctx.stroke()
    
    // Check if any guide dots are being hit
    checkGuideDotHits(x, y)
    
    // Check section completion
    checkSectionCompletion()
  }, [])

  const stopDrawing = useCallback(() => {
    isDrawing.current = false
    currentPath.current = []
  }, [])

  // Check if finger is near a guide dot
  function checkGuideDotHits(x: number, y: number) {
    tracingData.sections.forEach(section => {
      section.guideDots.forEach(dot => {
        const distance = Math.sqrt(Math.pow(x - dot.x, 2) + Math.pow(y - dot.y, 2))
        if (distance < 30) {
          // Highlight this dot green
          highlightDot(dot)
        }
      })
    })
  }

  function highlightDot(dot: { x: number; y: number }) {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx) return
    
    ctx.beginPath()
    ctx.arc(dot.x, dot.y, 14, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(76, 175, 80, 0.7)"
    ctx.fill()
  }

  // Check if a section is complete (enough dots hit)
  function checkSectionCompletion() {
    tracingData.sections.forEach(section => {
      if (completedSections.current.has(section.id)) return
      
      const allDotsHit = section.guideDots.every(dot =>
        currentPath.current.some(point => {
          const distance = Math.sqrt(Math.pow(point.x - dot.x, 2) + Math.pow(point.y - dot.y, 2))
          return distance < 35 // 35px tolerance — generous for young children
        })
      )
      
      if (allDotsHit) {
        completedSections.current.add(section.id)
        onSectionComplete(section.id, section.reward)
        
        // Check if ALL sections done
        if (completedSections.current.size === tracingData.sections.length) {
          onLetterComplete()
        }
      }
    })
  }

  // Clear canvas
  function clearCanvas() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx || !canvas) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    completedSections.current = new Set()
    currentPath.current = []
    drawGuideDots(ctx, tracingData)
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    startDrawing(touch.clientX - rect.left, touch.clientY - rect.top)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    continueDrawing(touch.clientX - rect.left, touch.clientY - rect.top)
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={tracingData.canvasWidth}
        height={tracingData.canvasHeight}
        className="rounded-2xl bg-white shadow-lg border-4 border-gray-100 touch-none"
        onMouseDown={(e) => startDrawing(e.nativeEvent.offsetX, e.nativeEvent.offsetY)}
        onMouseMove={(e) => continueDrawing(e.nativeEvent.offsetX, e.nativeEvent.offsetY)}
        onMouseUp={stopDrawing}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={stopDrawing}
      />
      
      {/* Erase button */}
      <button
        onClick={clearCanvas}
        className="mt-2 flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-600 text-sm"
      >
        🧹 Start Over
      </button>
    </div>
  )
}
```

---

### 2. `FingerGuide` — `/src/components/tracing/FingerGuide.tsx`

```typescript
interface FingerGuideProps {
  path: string  // SVG path string
  isPlaying: boolean
  onComplete: () => void
}
```

**Implementation — animates a finger emoji along the SVG path:**

```typescript
"use client"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { useEffect } from "react"

export function FingerGuide({ path, isPlaying, onComplete }: FingerGuideProps) {
  // Use Framer Motion's SVG path animation
  // Animate a finger emoji from 0% to 100% along the path
  
  if (!isPlaying) return null
  
  return (
    <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
      <path id="guide-path" d={path} fill="none" stroke="none" />
      <motion.text
        fontSize="32"
        initial={{ offsetDistance: "0%" }}
        animate={{ offsetDistance: "100%" }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
        style={{ offsetPath: `path('${path}')` }}
        onAnimationComplete={onComplete}
      >
        👆
      </motion.text>
    </svg>
  )
}
```

---

### 3. `LetterTransform` — `/src/components/tracing/LetterTransform.tsx`

```typescript
interface LetterTransformProps {
  letter: string         // "A"
  transformImage: string // "/images/letters/a/apple.png"
  letterColor: string    // "#FF6B6B"
  isTransforming: boolean
  onComplete: () => void
}
```

**Animation — letter fades out, image fades in same position:**

```typescript
"use client"
import { motion, AnimatePresence } from "framer-motion"

export function LetterTransform({ letter, transformImage, letterColor, isTransforming, onComplete }: LetterTransformProps) {
  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      <AnimatePresence mode="wait">
        {!isTransforming ? (
          <motion.div
            key="letter"
            exit={{ scale: 0, rotate: 360, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[150px] font-black select-none"
            style={{ color: letterColor }}
          >
            {letter}
          </motion.div>
        ) : (
          <motion.img
            key="image"
            src={transformImage}
            alt={letter}
            initial={{ scale: 0, rotate: -360, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
            className="w-40 h-40 object-contain"
            onAnimationComplete={onComplete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
```

---

### 4. `MiniCanvas` — `/src/components/tracing/MiniCanvas.tsx`

Same as `TracingCanvas` but smaller (150x150) for lowercase letter.
Shows after uppercase is complete as a bonus round.

---

## FULL EVENT FLOW (Step 3)

```
Mount
  → Canvas renders with guide dots and directional arrows
  → FingerGuide plays once (shows HOW to trace)
  → LottieCharacter: "teaching" state
  → Play intro audio: "Now let's write the letter A! Trace the dots with your finger!"
  → [FingerGuide animation plays: 2.5 seconds]
  → Canvas ready for input

Child starts tracing
  → Pencil scratching sound starts (Howler.js, loops while drawing)
  → Guide dots turn green as finger passes them
  → LottieCharacter: "watching" state

Section 1 complete (left stroke of A)
  → Pencil sound pauses
  → Section glows briefly
  → RewardSystem.giveReward() → Candy + crunch sound
  → LottieCharacter: "happy"
  → Play audio: "Great stroke! Keep going!"
  → Pencil sound resumes

Section 2 complete (right stroke of A)
  → Same as section 1 but Toy Car reward

Section 3 complete (middle stroke of A)
  → Same but Ice Cream reward
  → [All sections done!]

Letter complete
  → Pencil sound stops
  → Entire letter glows yellow for 1 second
  → LetterTransform plays: A spins and transforms into Apple image
  → Play transform sound (magical sparkle)
  → Play nom nom sound
  → LottieCharacter: "nom_nom" state
  → Play audio: "The letter A became an Apple! Amazing!"
  → [2 second pause]

Lowercase intro
  → MiniCanvas appears from right with slide animation
  → Play audio: "Now write the small letter a!"
  → LottieCharacter: "teaching"
  → [Child traces lowercase a]
  → Completion: bonus reward + celebration

All done
  → LottieCharacter: "celebrating" (big dance)
  → Play celebration audio: "Wonderful! You can write the letter A!"
  → Show stars earned
  → Next button appears
```

---

## PENCIL SOUND IMPLEMENTATION

```typescript
// In TracingCanvas — start/stop pencil sound
const pencilSound = useRef<Howl | null>(null)

useEffect(() => {
  pencilSound.current = new Howl({
    src: ["/audio/sfx/pencil-writing.mp3"],
    loop: true,
    volume: 0.4,
  })
  
  return () => pencilSound.current?.unload()
}, [])

// In startDrawing:
pencilSound.current?.play()

// In stopDrawing:
pencilSound.current?.stop()
```

---

## IDLE DETECTION (show guide again if child stops)

```typescript
// In TracingCanvas
const idleTimer = useRef<NodeJS.Timeout | null>(null)

function resetIdleTimer() {
  if (idleTimer.current) clearTimeout(idleTimer.current)
  idleTimer.current = setTimeout(() => {
    // Show FingerGuide again
    setShowGuide(true)
  }, 5000) // 5 seconds of no movement
}

// Call resetIdleTimer() in continueDrawing()
```
