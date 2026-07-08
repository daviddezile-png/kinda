"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { NumeralCard } from "@/components/numbers/NumeralCard"
import {
  playCountUp,
  playFeedback,
  playInstruction,
  speakNumber,
} from "@/lib/audio"
import { playSound } from "@/lib/playSound"
import { shuffled, numeralColor, type NumberGameProps } from "./shared"

const LOSE_SFX = "/audio/feedback/wrong-soft.mp3"

// Game 4 — "Touch the numbers in order — start at one!" Scattered digits the
// child must tap 1, 2, 3… Each correct tap says its number; the finish replays
// the whole count-up. Builds the SEQUENCE, not just single digits.
export function NumberOrder({ data, onComplete }: NumberGameProps) {
  // Ordering needs at least three steps to feel like a sequence.
  const top = Math.max(3, data.value)
  const cards = useMemo(() => shuffled(Array.from({ length: top }, (_, i) => i + 1)), [top])
  const [next, setNext] = useState(1)
  const [wrongAt, setWrongAt] = useState<number | null>(null)
  const finished = useRef(false)

  useEffect(() => {
    playInstruction("numbers/in-order")
  }, [])

  const handleTap = (v: number) => {
    if (finished.current || v < next) return
    if (v === next) {
      setWrongAt(null)
      playSound("/audio/sfx/touch.mp3")
      if (v === top) {
        finished.current = true
        setNext(top + 1)
        speakNumber(v, () =>
          playCountUp(top, () => playFeedback(true, () => setTimeout(onComplete, 700))),
        )
      } else {
        setNext(v + 1)
        speakNumber(v)
      }
    } else {
      setWrongAt(v)
      playSound(LOSE_SFX)
      playFeedback(false)
      setTimeout(() => setWrongAt(null), 800)
    }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <button
        type="button"
        onClick={() => playInstruction("numbers/in-order")}
        className="rounded-full bg-white/80 px-5 py-2 text-base font-bold text-gray-600 shadow"
      >
        Touch the numbers in order: 1, 2, 3…
      </button>
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {cards.map((v) => (
          <NumeralCard
            key={v}
            value={v}
            color={numeralColor(v, data.color)}
            size={104}
            state={
              v < next
                ? "correct"
                : wrongAt === v
                  ? "wrong"
                  : // After a stumble, glow the digit that comes next.
                    wrongAt !== null && v === next
                    ? "hint"
                    : "idle"
            }
            onClick={() => handleTap(v)}
          />
        ))}
      </div>
    </div>
  )
}
