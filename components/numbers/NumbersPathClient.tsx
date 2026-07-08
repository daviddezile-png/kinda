"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { NUMBERS } from "@/data/numbers"
import { getCompletedNumbers } from "@/lib/numberProgress"
import { playInstruction } from "@/lib/audio"
import { Decor } from "@/components/ui/Decor"

const container = { show: { transition: { staggerChildren: 0.06 } } }
const item = {
  hidden: { opacity: 0, y: 40, rotateX: -25, scale: 0.8 },
  show: { opacity: 1, y: 0, rotateX: 0, scale: 1 },
}

interface NumbersPathClientProps {
  /** The numbers this class works through (subset of 1–10, ascending). */
  numbers: number[]
  /** Sequential = each number unlocks only once the previous one is finished. */
  sequential: boolean
}

// The numbers map — the class's assigned numbers as big 3D tiles, mirroring the
// letters LessonPath so the child never has to learn a second navigation. Each
// tile also previews its quantity (N little objects under the digit), so even
// the digit-blind child can see "this card means this many". When the teacher's
// curriculum is sequential, tiles unlock in order; otherwise all are open.
export function NumbersPathClient({ numbers, sequential }: NumbersPathClientProps) {
  const [done, setDone] = useState<number[]>([])
  // Deliberate set-on-mount: progress lives in localStorage (client-only).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setDone(getCompletedNumbers()), [])
  // Spoken greeting: "Numbers! Touch a number to start counting!"
  useEffect(() => playInstruction("numbers/map-welcome"), [])

  // Only the assigned numbers, in the canonical 1→10 order.
  const cards = NUMBERS.filter((num) => numbers.includes(num.value))

  const isUnlocked = (i: number) =>
    !sequential || i === 0 || done.includes(cards[i - 1].value)

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      style={{ perspective: 1200 }}
      className="mx-auto grid max-w-3xl grid-cols-2 gap-5 sm:grid-cols-3"
    >
      {cards.map((num, i) => {
        const unlocked = isUnlocked(i)
        const completed = done.includes(num.value)

        const card = (
          <motion.div
            variants={item}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            whileHover={unlocked ? { y: -10, rotateX: 10, rotateY: -8, scale: 1.05 } : {}}
            whileTap={unlocked ? { scale: 0.95, rotateX: 0 } : {}}
            style={{ transformStyle: "preserve-3d" }}
            className="group relative flex aspect-square flex-col items-center justify-center rounded-[2rem] ring-1 ring-white/60"
          >
            <span
              aria-hidden
              className="absolute inset-0 rounded-[2rem]"
              style={{
                background: unlocked
                  ? `linear-gradient(150deg,#ffffff 0%, ${num.bg} 100%)`
                  : "#eef0f4",
                boxShadow: unlocked
                  ? `0 22px 40px -16px ${num.color}aa, inset 0 -6px 0 rgba(0,0,0,0.06)`
                  : "inset 0 -4px 0 rgba(0,0,0,0.05)",
                transform: "translateZ(-1px)",
              }}
            />
            <span
              className="relative text-6xl font-black drop-shadow-md sm:text-7xl"
              style={{ color: unlocked ? num.color : "#c2c5cc", transform: "translateZ(20px)" }}
            >
              {num.value}
            </span>

            {/* Quantity preview — that many plain dots. (Deliberately not
                pictures: the tiles stay calm and the digit does the talking.) */}
            <span
              className="relative mt-2 flex max-w-[70%] flex-wrap items-center justify-center gap-1"
              style={{ transform: "translateZ(12px)" }}
            >
              {Array.from({ length: num.value }, (_, k) => (
                <span
                  key={k}
                  className="rounded-full"
                  style={{
                    width: num.value > 5 ? 8 : 11,
                    height: num.value > 5 ? 8 : 11,
                    backgroundColor: unlocked ? num.color : "#c2c5cc",
                  }}
                />
              ))}
            </span>

            {completed && <Decor name="star_badge" size={26} className="absolute right-3 top-3" />}
            {!unlocked && <Decor name="lock" size={22} className="absolute bottom-3 right-3" />}
            {unlocked && !completed && (
              <Decor
                name="sparkle"
                size={20}
                className="animate-twinkle absolute right-3 top-3 group-hover:scale-125"
              />
            )}
          </motion.div>
        )

        return unlocked ? (
          <Link key={num.value} href={`/student/numbers/${num.value}`} className="block">
            {card}
          </Link>
        ) : (
          <div key={num.value} aria-disabled className="cursor-not-allowed">
            {card}
          </div>
        )
      })}
    </motion.div>
  )
}
