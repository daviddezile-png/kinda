"use client"

import { useEffect, useMemo } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { NumeralCard } from "@/components/numbers/NumeralCard"
import { PHOTO_OBJECTS, nearbyNumbers, type CountObject } from "@/data/numbers"
import { playCountUp, playInstruction } from "@/lib/audio"
import { randomFrom } from "@/lib/utils"
import { useChoiceGame, shuffled, type NumberGameProps } from "./shared"
import type { NumeralState } from "@/components/numbers/NumeralCard"

// Game 5 — the reverse of Count & Choose: the DIGIT is given, the child picks
// the group that holds that many things. Same real object on every card, so
// only counting (not the picture) can tell them apart.
export function MatchQuantity({ data, onComplete }: NumberGameProps) {
  const object = useMemo(() => randomFrom(PHOTO_OBJECTS), [])
  const groups = useMemo(
    () => shuffled([data.value, ...nearbyNumbers(data.value, 2)]),
    [data.value],
  )
  const { choose, stateFor } = useChoiceGame(onComplete, (done) =>
    playCountUp(data.value, done),
  )

  useEffect(() => {
    playInstruction(`numbers/match/${data.value}`)
  }, [data.value])

  return (
    <div className="flex flex-col items-center gap-7">
      <div className="flex items-center gap-4">
        <NumeralCard value={data.value} color={data.color} size={96} />
        <button
          type="button"
          onClick={() => playInstruction(`numbers/match/${data.value}`)}
          className="rounded-full bg-white/80 px-5 py-2 text-base font-bold text-gray-600 shadow"
        >
          Find {data.value} {object.plural}!
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
        {groups.map((count) => (
          <GroupCard
            key={count}
            object={object}
            count={count}
            state={stateFor(`${count}`, count === data.value)}
            onClick={() => choose(`${count}`, count === data.value)}
          />
        ))}
      </div>
    </div>
  )
}

function GroupCard({
  object,
  count,
  state,
  onClick,
}: {
  object: CountObject
  count: number
  state: NumeralState
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={`${count} ${object.plural}`}
      whileHover={state === "idle" || state === "hint" ? { y: -6, scale: 1.04 } : {}}
      whileTap={{ scale: 0.93 }}
      animate={
        state === "wrong"
          ? { x: [0, -10, 10, -7, 7, 0] }
          : state === "correct"
            ? { scale: [1, 1.12, 1.05] }
            : { x: 0, scale: 1 }
      }
      transition={{ duration: 0.45 }}
      className={`grid w-40 grid-cols-3 place-items-center gap-1.5 rounded-[1.8rem] bg-white/90 p-4 shadow-xl ring-1 ring-white/70 transition-opacity sm:w-44 ${
        state === "dimmed" ? "opacity-40" : ""
      } ${state === "hint" ? "animate-pulse-glow" : ""}`}
      style={{
        boxShadow:
          state === "correct"
            ? "0 0 0 5px #40C057, 0 18px 34px -14px rgba(0,0,0,0.25)"
            : state === "wrong"
              ? "0 0 0 5px #FF6B6B, 0 18px 34px -14px rgba(0,0,0,0.25)"
              : undefined,
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <Image
          key={i}
          src={object.image ?? ""}
          alt=""
          width={40}
          height={40}
          className="pointer-events-none h-10 w-10 select-none object-contain"
          draggable={false}
        />
      ))}
    </motion.button>
  )
}
