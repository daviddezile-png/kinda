"use client"

import { useCallback, useRef, useState } from "react"
import { playFeedback } from "@/lib/audio"
import { playSound } from "@/lib/playSound"
import { NUMBERS, type NumberData } from "@/data/numbers"
import type { NumeralState } from "@/components/numbers/NumeralCard"

const PALETTE_BY_VALUE: Record<number, string> = Object.fromEntries(
  NUMBERS.map((n) => [n.value, n.color]),
)

export interface NumberGameProps {
  data: NumberData
  /** The game was won — the lesson advances to the next game. */
  onComplete: () => void
}

const WIN_SFX = "/audio/feedback/correct.mp3"
const LOSE_SFX = "/audio/feedback/wrong-soft.mp3"

/**
 * The pick-the-right-answer core every choice game shares: wrong answers shake
 * + encourage (and after two wrongs the right answer glows as a hint — same
 * gentle help as Step 2's last-life glow); the right answer cheers, then the
 * game reports complete. `echo` lets a game speak something first on the win
 * (e.g. the number's name) before the random praise line.
 */
export function useChoiceGame(
  onComplete: () => void,
  echo?: (onend: () => void) => void,
) {
  const [won, setWon] = useState(false)
  const [wrongId, setWrongId] = useState<string | null>(null)
  const [wrongCount, setWrongCount] = useState(0)
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const choose = useCallback(
    (id: string, correct: boolean) => {
      if (won) return
      if (correct) {
        setWon(true)
        setWrongId(null)
        playSound(WIN_SFX)
        const cheer = () => playFeedback(true, () => setTimeout(onComplete, 700))
        if (echo) echo(cheer)
        else cheer()
      } else {
        setWrongId(id)
        setWrongCount((c) => c + 1)
        playSound(LOSE_SFX)
        playFeedback(false)
        if (clearTimer.current) clearTimeout(clearTimer.current)
        clearTimer.current = setTimeout(() => setWrongId(null), 800)
      }
    },
    [won, echo, onComplete],
  )

  const stateFor = useCallback(
    (id: string, correct: boolean): NumeralState => {
      if (won) return correct ? "correct" : "dimmed"
      if (wrongId === id) return "wrong"
      if (wrongCount >= 2 && correct) return "hint"
      return "idle"
    },
    [won, wrongId, wrongCount],
  )

  return { won, choose, stateFor }
}

/** Stable per-mount shuffle (so re-renders never reshuffle mid-game). */
export function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Consistent per-numeral colour — each digit keeps its map colour everywhere. */
export function numeralColor(value: number, fallback: string): string {
  return value >= 1 && value <= 10 ? PALETTE_BY_VALUE[value] : fallback
}
