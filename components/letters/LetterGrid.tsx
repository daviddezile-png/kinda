"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Decor } from "@/components/ui/Decor"

export interface LetterGridItem {
  letter: string
  word: string
  color: string
  bg: string
  available: boolean
}

const container = {
  show: { transition: { staggerChildren: 0.035 } },
}
const item = {
  hidden: { opacity: 0, y: 30, scale: 0.8 },
  show: { opacity: 1, y: 0, scale: 1 },
}

export function LetterGrid({ items }: { items: LetterGridItem[] }) {
  return (
    <motion.div
      className="mx-auto grid max-w-4xl grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {items.map((it) => (
        <motion.div
          key={it.letter}
          variants={item}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {it.available ? (
            <motion.div whileHover={{ scale: 1.08, rotate: -2 }} whileTap={{ scale: 0.93 }}>
              <Link
                href={`/student/letters/${it.letter.toLowerCase()}/step/1`}
                className="relative flex aspect-square flex-col items-center justify-center rounded-3xl shadow-lg ring-1 ring-white/60"
                style={{ background: `linear-gradient(150deg, #ffffff 0%, ${it.bg} 100%)` }}
              >
                <span className="text-5xl font-black drop-shadow-sm sm:text-6xl" style={{ color: it.color }}>
                  {it.letter}
                </span>
                <span className="mt-1 text-xs font-bold text-gray-500 sm:text-sm">{it.word}</span>
                <Decor name="sparkle" size={20} className="animate-twinkle absolute right-2 top-2" />
              </Link>
            </motion.div>
          ) : (
            <div className="flex aspect-square flex-col items-center justify-center rounded-3xl bg-white/40 text-gray-300 shadow-inner backdrop-blur-sm">
              <span className="text-4xl font-black sm:text-5xl">{it.letter}</span>
              <Decor name="lock" size={22} className="mt-1" />
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}
