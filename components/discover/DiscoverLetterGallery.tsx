"use client"

/* eslint-disable react-hooks/preserve-manual-memoization, react-hooks/set-state-in-effect */

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ImageCard, type CardState } from "@/components/games/ImageCard"
import { imagesForLetter, type LetterImage } from "@/data/letterImages"
import { playEncouraging, playPositive, speakLetterName, speakWord } from "@/lib/audio"
import { shuffle } from "@/lib/utils"

interface DiscoverLetterGalleryProps {
  letters: string[] // uppercase letters, in curriculum order
  onComplete: () => void
  onCorrect?: () => void // fires on a correct "touch the picture" answer (reward)
}

type Phase = "learn" | "ask"

// A chunky, extruded 3D letter (a stack of offset shadows in a darker shade of
// the letter's own colour), so the glyph reads as a real toy block rather than a
// flat coloured tile. Matches the look of the tracing screen's <LetterCard>.
const LETTER_COLOR = "#ff6b9d"
function extrusion(color: string, depth = 12) {
  const shade = `color-mix(in srgb, ${color} 50%, #15102e)`
  const layers: string[] = []
  for (let i = 1; i <= depth; i++) layers.push(`${i}px ${i}px 0 ${shade}`)
  layers.push("0 20px 26px rgba(30,20,60,0.32)")
  return layers.join(", ")
}

// Deliberately slow — this is a pre-reading child meeting new pictures.
const NAME_GAP_MS = 1900 // pause between naming each picture
const AFTER_LEARN_MS = 1400 // beat before the little game starts
const REVEAL_MS = 2600 // how long the corrected answer is shown + named
const NEXT_MS = 1700 // beat after a correct answer

// Level 0 "See & Know", one letter at a time:
//   1. LEARN — the whole letter's pictures appear together (an "A wall"); each is
//      highlighted and named slowly, one by one. Tapping any picture re-says it.
//   2. ASK — up to two rounds of "touch the …": the child hears a word and taps
//      it. A wrong tap is never punished — the correct picture lights up and is
//      named ("early stage" correction), then it moves on.
// After the last letter, onComplete() fires.
export function DiscoverLetterGallery({ letters, onComplete, onCorrect }: DiscoverLetterGalleryProps) {
  const seq = letters.map((l) => l.toUpperCase()).filter((l) => imagesForLetter(l).length > 0)
  const [li, setLi] = useState(0)
  const letter = seq[li] ?? ""
  const images = imagesForLetter(letter)
  const rounds = Math.min(2, images.length) // a single-picture letter has no quiz

  const [phase, setPhase] = useState<Phase>("learn")
  const [activeIdx, setActiveIdx] = useState(0) // highlighted while naming
  const [round, setRound] = useState(0)
  const [targets, setTargets] = useState<LetterImage[]>([])
  const [picked, setPicked] = useState<string | null>(null)
  const [wrong, setWrong] = useState<string | null>(null)
  const [reveal, setReveal] = useState<string | null>(null)

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])
  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms))
  }, [])

  const nextLetter = useCallback(() => {
    clearTimers()
    if (li + 1 < seq.length) setLi(li + 1)
    else onComplete()
  }, [li, seq.length, onComplete, clearTimers])

  // Enter a letter: reset, then narrate the whole wall slowly.
  useEffect(() => {
    if (!letter) return
    setPhase("learn")
    setActiveIdx(0)
    setRound(0)
    setPicked(null)
    setWrong(null)
    setReveal(null)
    setTargets(shuffle(images).slice(0, rounds))
    clearTimers()

    speakLetterName(letter)
    images.forEach((img, k) => {
      after(900 + k * NAME_GAP_MS, () => {
        setActiveIdx(k)
        speakWord(img.word)
      })
    })
    after(900 + images.length * NAME_GAP_MS + AFTER_LEARN_MS, () => {
      if (rounds >= 2) setPhase("ask")
      else nextLetter()
    })
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [li])

  // Each ask round: say the target after a short beat.
  useEffect(() => {
    if (phase !== "ask") return
    const target = targets[round]
    if (!target) return
    setPicked(null)
    setWrong(null)
    setReveal(null)
    after(500, () => speakWord(target.word))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round])

  const advanceRound = useCallback(
    (r: number) => {
      if (r + 1 < targets.length) setRound(r + 1)
      else nextLetter()
    },
    [targets.length, nextLetter],
  )

  const target = phase === "ask" ? targets[round] : undefined

  const handleTap = (img: LetterImage, idx: number) => {
    if (phase === "learn") {
      setActiveIdx(idx)
      speakWord(img.word)
      return
    }
    if (!target || picked || wrong) return
    if (img.word === target.word) {
      setPicked(img.word)
      onCorrect?.()
      speakWord(img.word, () => playPositive())
      after(NEXT_MS, () => advanceRound(round))
    } else {
      // No penalty: reveal + name the correct picture, then carry on.
      setWrong(img.word)
      setReveal(target.word)
      speakWord(target.word, () => playEncouraging())
      after(REVEAL_MS, () => advanceRound(round))
    }
  }

  const cardState = (img: LetterImage, idx: number): CardState => {
    if (phase === "learn") return idx === activeIdx ? "hint" : "idle"
    if (picked === img.word || reveal === img.word) return "correct"
    if (wrong === img.word) return "wrong"
    if (picked || wrong) return "dimmed"
    return "idle"
  }

  const cols = images.length <= 2 ? images.length : images.length <= 4 ? 2 : 3

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-6">
      {/* Big letter + what to do (icon only — pre-reading) */}
      <div className="flex items-center gap-4">
        <motion.span
          key={letter}
          initial={{ scale: 0.6, opacity: 0, y: -30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 16 }}
          className="select-none px-4 font-black leading-none"
          style={{
            color: LETTER_COLOR,
            fontSize: "clamp(90px, 18vw, 150px)",
            textShadow: extrusion(LETTER_COLOR),
            WebkitTextStroke: "2px rgba(255,255,255,0.85)",
          }}
        >
          {letter}
        </motion.span>
        {target && (
          <motion.button
            type="button"
            onClick={() => speakWord(target.word)}
            aria-label="Hear it again"
            className="grid h-16 w-16 place-items-center rounded-full bg-white/80 text-3xl shadow"
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 1.3, repeat: Infinity }}
          >
            🔊
          </motion.button>
        )}
      </div>

      {/* The letter's whole picture wall */}
      <AnimatePresence mode="wait">
        <motion.div
          key={letter}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          className="grid justify-center gap-4"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {images.map((img, idx) => (
            <ImageCard
              key={img.word}
              image={img.image}
              word={img.word}
              state={cardState(img, idx)}
              onSelect={() => handleTap(img, idx)}
              size="md"
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Progress dots — one per letter */}
      <div className="flex max-w-[92vw] flex-wrap items-center justify-center gap-2.5">
        {seq.map((_, k) => (
          <span
            key={k}
            className={`h-3 w-3 rounded-full transition-all duration-300 ${
              k === li ? "scale-125 bg-[#ff6b9d]" : k < li ? "bg-[#ffc24a]" : "bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
