"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { getCompletedLetters } from "@/lib/progress"
import { playUi } from "@/lib/audio"
import { Decor } from "@/components/ui/Decor"

export interface PathItem {
  letter: string
  word: string
  color: string
  bg: string
  available: boolean // has lesson data
  href: string
}

const container = { show: { transition: { staggerChildren: 0.06 } } }
const item = {
  hidden: { opacity: 0, y: 40, rotateX: -25, scale: 0.8 },
  show: { opacity: 1, y: 0, rotateX: 0, scale: 1 },
}

export function LessonPath({ items, sequential }: { items: PathItem[]; sequential: boolean }) {
  const [done, setDone] = useState<string[]>([])
  useEffect(() => setDone(getCompletedLetters()), [])
  // Friendly spoken greeting when the child lands on their lesson map.
  useEffect(() => playUi("welcome-back"), [])

  const isUnlocked = (i: number) => {
    if (!sequential) return true
    if (i === 0) return true
    return done.includes(items[i - 1].letter.toUpperCase())
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      style={{ perspective: 1200 }}
      className="mx-auto grid max-w-3xl grid-cols-2 gap-5 sm:grid-cols-3"
    >
      {items.map((it, i) => {
        const unlocked = it.available && isUnlocked(i)
        const completed = done.includes(it.letter.toUpperCase())

        const card = (
          <motion.div
            variants={item}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            whileHover={unlocked ? { y: -10, rotateX: 10, rotateY: -8, scale: 1.05 } : {}}
            whileTap={unlocked ? { scale: 0.95, rotateX: 0 } : {}}
            style={{ transformStyle: "preserve-3d" }}
            className="group relative flex aspect-square flex-col items-center justify-center rounded-[2rem] ring-1 ring-white/60"
          >
            {/* depth base layer */}
            <span
              aria-hidden
              className="absolute inset-0 rounded-[2rem]"
              style={{
                background: unlocked ? `linear-gradient(150deg,#ffffff 0%, ${it.bg} 100%)` : "#eef0f4",
                boxShadow: unlocked
                  ? `0 22px 40px -16px ${it.color}aa, inset 0 -6px 0 rgba(0,0,0,0.06)`
                  : "inset 0 -4px 0 rgba(0,0,0,0.05)",
                transform: "translateZ(-1px)",
              }}
            />
            <span
              className="relative text-6xl font-black drop-shadow-md sm:text-7xl"
              style={{ color: unlocked ? it.color : "#c2c5cc", transform: "translateZ(20px)" }}
            >
              {it.letter}
            </span>
            <span
              className="relative mt-1 text-xs font-bold sm:text-sm"
              style={{ color: unlocked ? "#6b7280" : "#c2c5cc", transform: "translateZ(12px)" }}
            >
              {unlocked ? it.word : it.available ? "Locked" : "Coming soon"}
            </span>

            {/* order badge */}
            <span className="absolute left-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white/80 text-xs font-black text-gray-500 shadow">
              {i + 1}
            </span>
            {completed && <Decor name="star_badge" size={26} className="absolute right-3 top-3" />}
            {!unlocked && it.available && (
              <Decor name="lock" size={22} className="absolute bottom-3 right-3" />
            )}
            {unlocked && (
              <Decor
                name="sparkle"
                size={20}
                className="animate-twinkle absolute right-3 top-3 group-hover:scale-125"
              />
            )}
          </motion.div>
        )

        return unlocked ? (
          <Link key={it.letter} href={it.href} className="block">
            {card}
          </Link>
        ) : (
          <div key={it.letter} aria-disabled className="cursor-not-allowed">
            {card}
          </div>
        )
      })}
    </motion.div>
  )
}
