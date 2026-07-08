"use client"

import { motion } from "framer-motion"

interface WordDisplayProps {
  word: string
  color?: string
}

export function WordDisplay({ word, color = "#333333" }: WordDisplayProps) {
  const letters = word.split("")

  return (
    <div className="flex items-center justify-center gap-1" aria-label={word}>
      {letters.map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.12 }}
          className="text-4xl font-black uppercase select-none md:text-5xl"
          style={{ color }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </div>
  )
}
