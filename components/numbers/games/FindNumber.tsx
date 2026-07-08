"use client"

import { useEffect, useMemo } from "react"
import { NumeralCard } from "@/components/numbers/NumeralCard"
import { nearbyNumbers } from "@/data/numbers"
import { playInstruction, speakNumber } from "@/lib/audio"
import { useChoiceGame, shuffled, numeralColor, type NumberGameProps } from "./shared"

// Game 1 — "Touch the number three!" One right digit among three lookalike
// neighbours. Pure numeral recognition.
export function FindNumber({ data, onComplete }: NumberGameProps) {
  const options = useMemo(
    () => shuffled([data.value, ...nearbyNumbers(data.value, 3)]),
    [data.value],
  )
  const { choose, stateFor } = useChoiceGame(onComplete, (done) =>
    speakNumber(data.value, done),
  )

  useEffect(() => {
    playInstruction(`numbers/find/${data.value}`)
  }, [data.value])

  return (
    <div className="flex flex-col items-center gap-8">
      <button
        type="button"
        onClick={() => playInstruction(`numbers/find/${data.value}`)}
        className="rounded-full bg-white/80 px-5 py-2 text-base font-bold text-gray-600 shadow"
      >
        Touch the number {data.value}!
      </button>
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {options.map((v) => (
          <NumeralCard
            key={v}
            value={v}
            color={numeralColor(v, data.color)}
            size={120}
            state={stateFor(`${v}`, v === data.value)}
            onClick={() => choose(`${v}`, v === data.value)}
          />
        ))}
      </div>
    </div>
  )
}
