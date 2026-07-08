"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { StrokeCanvas } from "@/components/tracing/StrokeCanvas"
import { Decor } from "@/components/ui/Decor"
import { NUMBER_STROKES, digitsOf } from "@/lib/numberStrokes"
import { playFeedback, playInstruction, playPositive } from "@/lib/audio"
import type { NumberData } from "@/data/numbers"

const GUIDED_ROUNDS = 3 // trace WITH the guide hand three times…
const TOTAL_ROUNDS = GUIDED_ROUNDS + 1 // …then ONE test round with no guide

interface NumberWriteProps {
  data: NumberData
  onComplete: () => void
}

// Writing the digit — the number's own "Step 3". For the first three rounds the
// write-guide-hand travels the stroke (slowly, so the child can follow it) with
// a spoken "follow the hand" cue; then a FOURTH test round hides the guide and
// asks the child to write it all by themselves. (10 writes its two digits in
// order each round.)
export function NumberWrite({ data, onComplete }: NumberWriteProps) {
  const digits = digitsOf(data.value)
  const [round, setRound] = useState(0)
  const [digitIdx, setDigitIdx] = useState(0)
  const finished = useRef(false)

  const isTest = round >= GUIDED_ROUNDS

  useEffect(() => {
    // "Now, let's write it! Watch the little hand…" → "Follow the hand with
    // your finger!"
    playInstruction("numbers/lets-write", () => playInstruction("numbers/follow-hand"))
  }, [])

  const handleGlyphDone = () => {
    if (finished.current) return
    // More digits in this round? (only for 10)
    if (digitIdx + 1 < digits.length) {
      playPositive()
      setDigitIdx((i) => i + 1)
      return
    }
    const nextRound = round + 1
    if (nextRound < TOTAL_ROUNDS) {
      setRound(nextRound)
      setDigitIdx(0)
      if (nextRound < GUIDED_ROUNDS) {
        // Still guided — "Beautiful! Write it again!" / "Wonderful! One more time!"
        playInstruction(nextRound === 1 ? "numbers/write-again" : "numbers/write-once-more")
      } else {
        // Entering the TEST round — guide hand disappears. "Now write it all by
        // yourself!"
        playInstruction("numbers/write-yourself")
      }
    } else {
      finished.current = true
      // "Hooray! You can write the number three!"
      playInstruction(`numbers/wrote-it/${data.value}`, () => setTimeout(onComplete, 600))
    }
  }

  const glyph = digits[digitIdx]

  return (
    <div className="flex flex-col items-center gap-5">
      <button
        type="button"
        onClick={() => playInstruction(isTest ? "numbers/write-yourself" : "numbers/follow-hand")}
        className="rounded-full bg-white/80 px-5 py-2 text-base font-bold text-gray-600 shadow"
      >
        {isTest ? `Write ${data.value} by yourself!` : `Write the number ${data.value}!`}
      </button>

      {/* Progress: three guided writes then one "on your own" test (the pencil). */}
      <div className="flex items-center gap-2" aria-label={`writing round ${round + 1} of ${TOTAL_ROUNDS}`}>
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => {
          const testSlot = i >= GUIDED_ROUNDS
          return (
            <motion.span key={i} animate={{ scale: i === round ? 1.2 : 1 }} style={{ opacity: i <= round ? 1 : 0.35 }}>
              {/* guided rounds show stars; the final "on your own" slot sparkles */}
              <Decor
                name={i < round ? "star_badge" : testSlot ? "sparkle" : "star"}
                size={30}
              />
            </motion.span>
          )
        })}
      </div>

      <StrokeCanvas
        // Remount per round + digit so coverage resets and the guide restarts.
        key={`${round}-${digitIdx}`}
        path={NUMBER_STROKES[glyph] ?? NUMBER_STROKES["1"]}
        color={data.color}
        glyphKey={`${glyph}-${round}`}
        clearLabel="Start over"
        guide={!isTest} // final round: no guide hand — the child writes it alone
        onReward={() => playFeedback(true)}
        onComplete={handleGlyphDone}
      />
    </div>
  )
}
