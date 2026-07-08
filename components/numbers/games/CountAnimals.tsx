"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { NumeralCard } from "@/components/numbers/NumeralCard"
import { CountRow } from "@/components/numbers/CountRow"
import { PHOTO_OBJECTS, nearbyNumbers } from "@/data/numbers"
import {
  playInstruction,
  speakNumber,
  speakNumberAnyVoice,
} from "@/lib/audio"
import { playSound } from "@/lib/playSound"
import { randomFrom } from "@/lib/utils"
import { useChoiceGame, shuffled, numeralColor, type NumberGameProps } from "./shared"

// Game 6 — count REAL pictures. A row of animal photos the child already knows
// from the letter lessons; touching each one counts it aloud (varied voices),
// then the digits appear and they pick how many they counted. Two skills in
// one: one-to-one counting, then matching the count to its numeral.
export function CountAnimals({ data, onComplete }: NumberGameProps) {
  const animal = useMemo(() => randomFrom(PHOTO_OBJECTS), [])
  const options = useMemo(
    () => shuffled([data.value, ...nearbyNumbers(data.value, 2)]),
    [data.value],
  )
  const [lit, setLit] = useState<number[]>([])
  const allCounted = lit.length >= data.value
  const asked = useRef(false)

  const { choose, stateFor } = useChoiceGame(onComplete, (done) =>
    speakNumber(data.value, done),
  )

  useEffect(() => {
    // "How many cats can you see?" → "Touch each one and count with me!"
    playInstruction(`numbers/howmany/${animal.plural}`, () =>
      playInstruction("numbers/tap-count"),
    )
  }, [animal.plural])

  // Once every animal is counted, ask for the digit.
  useEffect(() => {
    if (allCounted && !asked.current) {
      asked.current = true
      playInstruction("numbers/choose-number")
    }
  }, [allCounted])

  const handleTap = (i: number) => {
    if (lit.includes(i)) return
    playSound("/audio/sfx/touch.mp3")
    speakNumberAnyVoice(lit.length + 1)
    setLit((prev) => [...prev, i])
  }

  return (
    <div className="flex flex-col items-center gap-7">
      <button
        type="button"
        onClick={() => playInstruction(`numbers/howmany/${animal.plural}`)}
        className="rounded-full bg-white/80 px-5 py-2 text-base font-bold text-gray-600 shadow"
      >
        Count the {animal.plural}!
      </button>

      <CountRow
        object={animal}
        count={data.value}
        lit={lit}
        onTap={allCounted ? undefined : handleTap}
        size={92}
      />

      {allCounted && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="flex items-center justify-center gap-4 sm:gap-6"
        >
          {options.map((v) => (
            <NumeralCard
              key={v}
              value={v}
              color={numeralColor(v, data.color)}
              size={96}
              state={stateFor(`${v}`, v === data.value)}
              onClick={() => choose(`${v}`, v === data.value)}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}
