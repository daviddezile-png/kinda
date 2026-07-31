"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Picture } from "@/components/ui/Picture"
import { shuffle } from "@/lib/utils"
import { playSound } from "@/lib/playSound"
import { playEncouraging, playInstruction, speakLetterSound, speakWord } from "@/lib/audio"
import type { WordGameProps } from "./shared"

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("")

interface Round {
  word: string
  pos: number // index of the missing letter
}

// "Which letter is missing?" — the word is shown with one letter blanked (and
// its picture beside it); the child taps the missing letter from three choices.
// Reinforces spelling. One round per word in the set (max 3).
export function MissingLetter({ words, color, onReward, onDone }: WordGameProps) {
  const rounds = useMemo<Round[]>(
    () =>
      shuffle(words)
        .slice(0, Math.min(3, words.length))
        // shuffle the letter indices and take the first — a random blank
        // position without an impure Math.random() call during render.
        .map((word) => ({ word, pos: shuffle(word.split("").map((_, i) => i))[0] })),
    [words],
  )
  const [ri, setRi] = useState(0)
  const [wrong, setWrong] = useState<string | null>(null)
  const [solved, setSolved] = useState(false)
  const round = rounds[ri]
  const missing = round.word[round.pos]

  const choices = useMemo<string[]>(() => {
    const others = shuffle(ALPHABET.filter((l) => l !== missing)).slice(0, 2)
    return shuffle([missing, ...others])
  }, [missing])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSolved(false)
    // Say the word so the child can work out the missing letter, then the prompt.
    speakWord(round.word, () => playInstruction("words/missing-letter"))
  }, [round])

  const tap = (letter: string) => {
    if (solved) return
    if (letter === missing) {
      setSolved(true)
      playSound("/audio/feedback/correct.mp3")
      speakLetterSound(missing)
      onReward()
      setTimeout(() => {
        if (ri + 1 < rounds.length) setRi((i) => i + 1)
        else onDone()
      }, 2600)
    } else {
      setWrong(letter)
      playSound("/audio/feedback/wrong-soft.mp3")
      playEncouraging()
      setTimeout(() => setWrong(null), 500)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-5">
        <Picture src={undefined} alt={round.word} className="h-28 w-28 object-contain" />
        <div className="flex gap-1.5">
          {round.word.split("").map((l, i) => (
            <span
              key={i}
              className="flex h-14 w-11 items-center justify-center rounded-xl border-b-4 text-4xl font-black lowercase"
              style={{
                color,
                borderColor: i === round.pos && !solved ? color : "#d1d5db",
                background: i === round.pos && !solved ? "#fff" : "transparent",
              }}
            >
              {i === round.pos && !solved ? "" : l}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {choices.map((l) => (
          <motion.button
            key={l}
            type="button"
            onClick={() => tap(l)}
            animate={wrong === l ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-black lowercase text-white shadow"
            style={{ backgroundColor: color }}
          >
            {l}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
