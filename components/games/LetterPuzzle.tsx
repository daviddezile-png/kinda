"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { shuffle } from "@/lib/utils"
import { playSound } from "@/lib/playSound"
import { useLanguage } from "@/store/languageStore"
import { getPhrases } from "@/lib/i18n"
import type { GameProps } from "./gameTypes"

// Tap the numbered pieces in order (1,2,3…) to assemble the letter.
export function LetterPuzzle({ letterData, onReward, onComplete }: GameProps) {
  const t = getPhrases(useLanguage((s) => s.lang))
  const pieces = letterData.games.letter_puzzle.pieces
  const scattered = useMemo(() => shuffle(Array.from({ length: pieces }, (_, i) => i)), [pieces])
  const [placed, setPlaced] = useState<number[]>([])
  const [wrong, setWrong] = useState<number | null>(null)

  const handleTap = (n: number) => {
    if (placed.includes(n)) return
    if (n === placed.length) {
      const p = [...placed, n]
      setPlaced(p)
      playSound("/audio/games/puzzle-snap.mp3")
      onReward()
      if (p.length === pieces) setTimeout(() => onComplete(3), 700)
    } else {
      setWrong(n)
      playSound("/audio/feedback/wrong-soft.mp3")
      setTimeout(() => setWrong(null), 500)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <h3 className="text-xl font-bold text-gray-700">{t.putPieces(letterData.letter)}</h3>

      <div className="flex gap-2">
        {Array.from({ length: pieces }).map((_, i) => (
          <div
            key={i}
            className="flex h-16 w-16 items-center justify-center rounded-xl border-4 border-dashed border-gray-300 text-2xl font-black"
            style={{ color: letterData.color }}
          >
            {placed.includes(i) ? letterData.letter : i + 1}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {scattered
          .filter((n) => !placed.includes(n))
          .map((n) => (
            <motion.button
              key={n}
              type="button"
              onClick={() => handleTap(n)}
              animate={wrong === n ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
              className="flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-black text-white shadow"
              style={{ backgroundColor: letterData.color }}
            >
              {n + 1}
            </motion.button>
          ))}
      </div>
      <p className="text-sm text-gray-400">{t.pieceOrder}</p>
    </div>
  )
}
