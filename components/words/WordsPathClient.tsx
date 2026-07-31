"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { WORD_SETS } from "@/data/words"
import { getCompletedWordLetters } from "@/lib/wordProgress"
import { Picture } from "@/components/ui/Picture"
import { Decor } from "@/components/ui/Decor"
import { playInstruction } from "@/lib/audio"

const container = { show: { transition: { staggerChildren: 0.06 } } }
const item = {
  hidden: { opacity: 0, y: 40, rotateX: -25, scale: 0.8 },
  show: { opacity: 1, y: 0, rotateX: 0, scale: 1 },
}

// The Words map — each letter that has a word set, as a big 3D tile, mirroring
// the letters/numbers maps so the child never learns a new navigation. Tiles
// unlock in order (finish A's words to open B). A tile previews its first word's
// picture so even a pre-reader knows what waits inside.
export function WordsPathClient() {
  const [done, setDone] = useState<string[]>([])
  // Progress lives in localStorage (client-only).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setDone(getCompletedWordLetters()), [])
  // Spoken greeting: "Words! Touch a letter to start making words!"
  useEffect(() => playInstruction("words/map-welcome"), [])

  const isUnlocked = (i: number) => i === 0 || done.includes(WORD_SETS[i - 1].letter)

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      style={{ perspective: 1200 }}
      className="mx-auto grid max-w-3xl grid-cols-2 gap-5 sm:grid-cols-3"
    >
      {WORD_SETS.map((set, i) => {
        const unlocked = isUnlocked(i)
        const completed = done.includes(set.letter)
        const preview = set.words[0]

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
                background: unlocked ? `linear-gradient(150deg,#ffffff 0%, ${set.bg} 100%)` : "#eef0f4",
                boxShadow: unlocked
                  ? `0 22px 40px -16px ${set.color}aa, inset 0 -6px 0 rgba(0,0,0,0.06)`
                  : "inset 0 -4px 0 rgba(0,0,0,0.05)",
                transform: "translateZ(-1px)",
              }}
            />
            <span
              className="relative text-5xl font-black drop-shadow-md sm:text-6xl"
              style={{ color: unlocked ? set.color : "#c2c5cc", transform: "translateZ(20px)" }}
            >
              {set.letter}<span className="lowercase">{set.letter.toLowerCase()}</span>
            </span>
            {unlocked && (
              <span className="relative mt-1" style={{ transform: "translateZ(12px)" }}>
                <Picture src={undefined} alt={preview} className="h-12 w-12 object-contain" />
              </span>
            )}

            {completed && <Decor name="star_badge" size={26} className="absolute right-3 top-3" />}
            {!unlocked && <Decor name="lock" size={22} className="absolute bottom-3 right-3" />}
            {unlocked && !completed && (
              <Decor name="sparkle" size={20} className="animate-twinkle absolute right-3 top-3 group-hover:scale-125" />
            )}
          </motion.div>
        )

        return unlocked ? (
          <Link key={set.letter} href={`/student/words/${set.letter.toLowerCase()}`} className="block">
            {card}
          </Link>
        ) : (
          <div key={set.letter} aria-disabled className="cursor-not-allowed">
            {card}
          </div>
        )
      })}
    </motion.div>
  )
}
