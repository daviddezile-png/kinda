"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Picture } from "@/components/ui/Picture"
import { shuffle } from "@/lib/utils"
import { playSound } from "@/lib/playSound"
import { playEncouraging, playInstruction, speakWord } from "@/lib/audio"
import { WORD_SETS } from "@/data/words"
import type { WordGameProps } from "./shared"

// Every imaged word we know, as a distractor pool for the picture choices.
const POOL = Array.from(new Set(WORD_SETS.flatMap((s) => s.words)))

interface Option {
  word: string
  correct: boolean
}

// "Touch the picture for the word …" — the target word is shown as text and
// spoken; the child reads/hears it and taps its picture among three. Reading
// → meaning. Runs one round per word in the set (max 3).
export function MatchWordPicture({ words, color, onReward, onDone }: WordGameProps) {
  const rounds = useMemo(() => shuffle(words).slice(0, Math.min(3, words.length)), [words])
  const [ri, setRi] = useState(0)
  const [wrong, setWrong] = useState<string | null>(null)
  const [solved, setSolved] = useState(false)
  const target = rounds[ri]

  const options = useMemo<Option[]>(() => {
    const distractors = shuffle(POOL.filter((w) => w !== target)).slice(0, 2)
    return shuffle([{ word: target, correct: true }, ...distractors.map((w) => ({ word: w, correct: false }))])
  }, [target])

  // Announce the target: "Touch the picture for the word…" then say it.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSolved(false)
    playInstruction("words/find-picture", () => speakWord(target))
  }, [target])

  const tap = (o: Option) => {
    if (solved) return
    if (o.correct) {
      setSolved(true)
      playSound("/audio/feedback/correct.mp3")
      onReward()
      setTimeout(() => {
        if (ri + 1 < rounds.length) setRi((i) => i + 1)
        else onDone()
      }, 2600)
    } else {
      setWrong(o.word)
      playSound("/audio/feedback/wrong-soft.mp3")
      playEncouraging()
      setTimeout(() => setWrong(null), 500)
    }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <button
        type="button"
        onClick={() => speakWord(target)}
        className="rounded-2xl bg-white/85 px-8 py-3 text-4xl font-black lowercase shadow"
        style={{ color }}
        aria-label={`hear the word ${target}`}
      >
        {target}
      </button>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {options.map((o) => (
          <motion.button
            key={o.word}
            type="button"
            onClick={() => tap(o)}
            animate={wrong === o.word ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
            className="flex h-36 w-36 items-center justify-center rounded-2xl bg-white p-1.5 shadow"
            aria-label={o.word}
          >
            <Picture src={undefined} alt={o.word} className="h-32 w-32 object-contain" />
          </motion.button>
        ))}
      </div>
    </div>
  )
}
