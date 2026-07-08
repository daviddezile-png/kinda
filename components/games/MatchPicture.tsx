"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { DISTRACTORS } from "@/data/distractors"
import { shuffle } from "@/lib/utils"
import { playSound } from "@/lib/playSound"
import { playEncouraging, playPositive } from "@/lib/audio"
import { Picture } from "@/components/ui/Picture"
import { useLanguage } from "@/store/languageStore"
import { getPhrases } from "@/lib/i18n"
import type { GameProps } from "./gameTypes"

interface Option {
  uid: string
  image: string
  word: string
  correct: boolean
}

// Tap the picture that matches the shown letter (3 rounds).
export function MatchPicture({ letterData, onReward, onComplete }: GameProps) {
  const t = getPhrases(useLanguage((s) => s.lang))
  const rounds = letterData.games.match_picture.rounds
  const [ri, setRi] = useState(0)
  const [wrong, setWrong] = useState<string | null>(null)
  const round = rounds[ri]

  const options = useMemo<Option[]>(() => {
    // Keep it to three large pictures (1 correct + 2 distractors) so the child
    // is never faced with a wall of small tiles.
    const wrongs = shuffle(DISTRACTORS)
      .slice(0, 2)
      .map((d, i) => ({ uid: `w-${ri}-${i}`, image: d.image, word: d.word, correct: false }))
    return shuffle([{ uid: `c-${ri}`, image: round.correctImage, word: round.correctWord, correct: true }, ...wrongs])
  }, [ri, round])

  const tap = (o: Option) => {
    if (o.correct) {
      playSound("/audio/feedback/correct.mp3")
      playPositive()
      onReward()
      setTimeout(() => {
        if (ri + 1 < rounds.length) setRi(ri + 1)
        else onComplete(3)
      }, 800)
    } else {
      setWrong(o.uid)
      playSound("/audio/feedback/wrong-soft.mp3")
      playEncouraging()
      setTimeout(() => setWrong(null), 500)
    }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <h3 className="text-xl font-bold text-gray-700">{t.matchLetter}</h3>
      <div
        className="flex h-20 w-20 items-center justify-center rounded-2xl text-5xl font-black text-white"
        style={{ backgroundColor: letterData.color }}
      >
        {round.letter}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        {options.map((o) => (
          <motion.button
            key={o.uid}
            type="button"
            onClick={() => tap(o)}
            animate={wrong === o.uid ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
            className="flex h-40 w-40 items-center justify-center rounded-2xl bg-white p-1.5 shadow"
            aria-label={o.word}
          >
            <Picture src={o.image} alt={o.word} className="h-36 w-36 object-contain" />
          </motion.button>
        ))}
      </div>
    </div>
  )
}
