"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { shuffle } from "@/lib/utils"
import { playSound } from "@/lib/playSound"
import { playEncouraging, playPositive } from "@/lib/audio"
import { Picture } from "@/components/ui/Picture"
import { useLanguage } from "@/store/languageStore"
import { getPhrases } from "@/lib/i18n"
import type { GameProps } from "./gameTypes"

interface Tile {
  id: string
  letter: string
}

export function BuildWord({ letterData, onReward, onComplete }: GameProps) {
  const t = getPhrases(useLanguage((s) => s.lang))
  const words = letterData.games.build_word.words
  const [wi, setWi] = useState(0)
  const word = words[wi]
  const [filled, setFilled] = useState<string[]>([])
  const [used, setUsed] = useState<string[]>([])
  const [wrong, setWrong] = useState<string | null>(null)

  const tiles = useMemo<Tile[]>(() => {
    const wordTiles = word.word.split("").map((l, i) => ({ id: `c-${i}`, letter: l }))
    const extras = word.extraLetters.map((l, i) => ({ id: `e-${i}`, letter: l }))
    return shuffle([...wordTiles, ...extras])
  }, [word])

  useEffect(() => {
    setFilled([])
    setUsed([])
  }, [wi])

  const tap = (tile: Tile) => {
    if (used.includes(tile.id)) return
    const expected = word.word[filled.length]
    if (tile.letter === expected) {
      const f = [...filled, tile.letter]
      setFilled(f)
      setUsed((u) => [...u, tile.id])
      playSound("/audio/games/pop.mp3")
      if (f.length === word.word.length) {
        onReward()
        playSound("/audio/games/word-complete.mp3")
        playPositive()
        setTimeout(() => {
          if (wi + 1 < words.length) setWi(wi + 1)
          else onComplete(3)
        }, 900)
      }
    } else {
      setWrong(tile.id)
      playSound("/audio/feedback/wrong-soft.mp3")
      playEncouraging()
      setTimeout(() => setWrong(null), 500)
    }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <h3 className="text-xl font-bold text-gray-700">{t.buildTheWord}</h3>
      <Picture src={word.image} alt={word.word} emojiClassName="text-6xl" className="h-24 w-24" />

      <div className="flex gap-2">
        {word.word.split("").map((_, i) => (
          <div key={i} className="flex h-14 w-12 items-center justify-center border-b-4 border-gray-300">
            <AnimatePresence>
              {filled[i] && (
                <motion.span
                  initial={{ y: -30, opacity: 0, scale: 0.5 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="text-3xl font-black"
                  style={{ color: letterData.color }}
                >
                  {filled[i]}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="flex max-w-md flex-wrap justify-center gap-2">
        {tiles.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            onClick={() => tap(t)}
            disabled={used.includes(t.id)}
            animate={wrong === t.id ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
            className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl font-black text-white shadow disabled:opacity-30"
            style={{ backgroundColor: letterData.color }}
          >
            {t.letter}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
