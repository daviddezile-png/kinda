"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Picture } from "@/components/ui/Picture"
import { shuffle } from "@/lib/utils"
import { playSound } from "@/lib/playSound"
import { playEncouraging, speakLetterSound } from "@/lib/audio"

const EXTRA_POOL = "abcdefghijklmnopqrstuvwxyz".split("")

interface Tile {
  id: string
  letter: string
}

interface WordBuildProps {
  /** Lowercase target word, e.g. "apple". */
  word: string
  color: string
  /** The word's picture stays in view so the child links letters → meaning. */
  image?: string
  /** Fired once the whole word has been joined correctly. */
  onComplete: () => void
}

// "Join the letters to make the word." The target picture sits above empty
// slots; the child taps the scrambled letter tiles in order. Each correct tap
// sounds the letter (phonics), a wrong tap shakes and gently encourages. Two
// spare letters keep it a real choice without overwhelming a beginner.
export function WordBuild({ word, color, image, onComplete }: WordBuildProps) {
  const letters = useMemo(() => word.split(""), [word])
  const [filled, setFilled] = useState<string[]>([])
  const [used, setUsed] = useState<string[]>([])
  const [wrong, setWrong] = useState<string | null>(null)

  const tiles = useMemo<Tile[]>(() => {
    const wordTiles = letters.map((l, i) => ({ id: `c-${i}`, letter: l }))
    const extras = shuffle(EXTRA_POOL.filter((l) => !letters.includes(l)))
      .slice(0, 2)
      .map((l, i) => ({ id: `e-${i}`, letter: l }))
    return shuffle([...wordTiles, ...extras])
  }, [letters])

  // (No reset effect needed — the parent remounts this via key={word}.)

  const tap = (tile: Tile) => {
    if (used.includes(tile.id) || filled.length >= letters.length) return
    if (tile.letter === letters[filled.length]) {
      const next = [...filled, tile.letter]
      setFilled(next)
      setUsed((u) => [...u, tile.id])
      playSound("/audio/games/pop.mp3")
      if (next.length === letters.length) {
        // Whole word joined — the parent celebrates + names the gift.
        setTimeout(onComplete, 400)
      } else {
        speakLetterSound(tile.letter)
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
      <Picture src={image} alt={word} className="h-28 w-28 object-contain sm:h-32 sm:w-32" />

      {/* Slots the child fills left→right */}
      <div className="flex flex-wrap justify-center gap-2">
        {letters.map((_, i) => (
          <div
            key={i}
            className="flex h-14 w-12 items-center justify-center rounded-xl border-b-4 border-gray-300 bg-white/70"
          >
            <AnimatePresence>
              {filled[i] && (
                <motion.span
                  initial={{ y: -26, opacity: 0, scale: 0.5 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="text-3xl font-black lowercase"
                  style={{ color }}
                >
                  {filled[i]}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Scrambled letter tiles */}
      <div className="flex max-w-md flex-wrap justify-center gap-2">
        {tiles.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            onClick={() => tap(t)}
            disabled={used.includes(t.id)}
            animate={wrong === t.id ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl font-black lowercase text-white shadow disabled:opacity-25"
            style={{ backgroundColor: color }}
          >
            {t.letter}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
