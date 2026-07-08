"use client"

import { useEffect, useMemo } from "react"
import { NumeralCard } from "@/components/numbers/NumeralCard"
import { CountRow } from "@/components/numbers/CountRow"
import { PHOTO_OBJECTS, nearbyNumbers } from "@/data/numbers"
import { playCountUp, playInstruction } from "@/lib/audio"
import { randomFrom } from "@/lib/utils"
import { useChoiceGame, shuffled, numeralColor, type NumberGameProps } from "./shared"

// Game 2 — "How many apples can you see?" A quiet row of real objects, three
// digits underneath. The child counts and picks the digit.
export function CountAndChoose({ data, onComplete }: NumberGameProps) {
  const object = useMemo(() => randomFrom(PHOTO_OBJECTS), [])
  const options = useMemo(
    () => shuffled([data.value, ...nearbyNumbers(data.value, 2)]),
    [data.value],
  )
  // On the win, the teacher counts the row out loud — confirming by counting.
  const { choose, stateFor } = useChoiceGame(onComplete, (done) =>
    playCountUp(data.value, done),
  )

  useEffect(() => {
    playInstruction(`numbers/howmany/${object.plural}`)
  }, [object.plural])

  return (
    <div className="flex flex-col items-center gap-8">
      <button
        type="button"
        onClick={() => playInstruction(`numbers/howmany/${object.plural}`)}
        className="rounded-full bg-white/80 px-5 py-2 text-base font-bold text-gray-600 shadow"
      >
        How many {object.plural}?
      </button>
      <CountRow object={object} count={data.value} lit={[]} size={80} />
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        {options.map((v) => (
          <NumeralCard
            key={v}
            value={v}
            color={numeralColor(v, data.color)}
            size={104}
            state={stateFor(`${v}`, v === data.value)}
            onClick={() => choose(`${v}`, v === data.value)}
          />
        ))}
      </div>
    </div>
  )
}
