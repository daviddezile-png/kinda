"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { TracingCanvas } from "@/components/tracing/TracingCanvas"
import { Character3D } from "@/components/character/Character3D"
import { Picture } from "@/components/ui/Picture"
import { Decor } from "@/components/ui/Decor"
import { speakWord } from "@/lib/audio"
import { useLanguage } from "@/store/languageStore"
import { getPhrases } from "@/lib/i18n"
import type { CharacterState } from "@/types"
import type { GameProps } from "./gameTypes"

// "See & Write" — the bridge from identifying a thing to writing it. The child
// is shown a real picture they know from earlier steps, hears its name, and
// then writes the letter it starts with (uppercase round, then lowercase).
// This closes the identify → recognise → write loop inside one activity.
export function SeeAndWrite({ letterData, onReward, onComplete }: GameProps) {
  const t = getPhrases(useLanguage((s) => s.lang))

  // Two rounds: big letter with the first word, small letter with the second
  // (falls back to the first word for letters that only have one picture).
  const rounds = useMemo(() => {
    const words = letterData.words.filter((w) => w.image)
    if (words.length === 0) return []
    return [
      { word: words[0], upper: true },
      { word: words[1] ?? words[0], upper: false },
    ]
  }, [letterData])

  const [ri, setRi] = useState(0)
  // Rafiki points at the picture while naming it, then watches the child write.
  const [character, setCharacter] = useState<CharacterState>("pointing")
  const rewardedRound = useRef(-1)
  const round = rounds[ri]

  // Name the picture at the start of each round.
  useEffect(() => {
    if (!round) return
    speakWord(round.word.word, () => setCharacter("watching"))
  }, [ri, round])

  useEffect(() => {
    if (rounds.length === 0) onComplete(0)
  }, [rounds, onComplete])

  if (!round) return null

  const letter = round.upper ? letterData.letter.toUpperCase() : letterData.lowercase

  const handleSection = () => {
    // TracingCanvas fires this at partial coverage — one reward per round.
    if (rewardedRound.current !== ri) {
      rewardedRound.current = ri
      onReward()
    }
  }

  const handleLetterDone = () => {
    // The win cheer + gift name come from onReward (GameSelector); here we just
    // celebrate visually and move on, so the gift's name is never cut short.
    setCharacter("celebrating")
    setTimeout(() => {
      if (ri + 1 < rounds.length) {
        setCharacter("pointing")
        setRi(ri + 1)
      } else onComplete(3)
    }, 1200)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-xl font-bold text-gray-700">
        {t.seeAndWrite(round.word.word)} {t.nowWriteIt(letter)}
      </h3>

      <div className="flex flex-wrap items-center justify-center gap-6">
        {/* What we saw: the picture + the character presenting it */}
        <div className="flex flex-col items-center gap-2">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`${ri}-${round.word.word}`}
              initial={{ scale: 0.6, opacity: 0, rotate: -6 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.6, opacity: 0, rotate: 6 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="grid h-44 w-44 place-items-center rounded-3xl bg-white/90 p-3 shadow-lg ring-4 ring-white"
            >
              <Picture src={round.word.image} alt={round.word.word} className="h-36 w-36 object-contain" />
            </motion.div>
          </AnimatePresence>
          <button
            type="button"
            onClick={() => speakWord(round.word.word)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-1.5 text-sm font-bold text-gray-600 shadow"
          >
            <Decor name="sound-on" size={16} /> {t.hearAgain}
          </button>
          <Character3D state={character} size={110} />
        </div>

        {/* …and now we write it */}
        <TracingCanvas
          key={`${ri}-${letter}`}
          letterData={letterData}
          isUppercase={round.upper}
          onSectionComplete={handleSection}
          onLetterComplete={handleLetterDone}
        />
      </div>
    </div>
  )
}
