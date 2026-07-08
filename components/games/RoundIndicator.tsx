"use client"

import { motion } from "framer-motion"

interface RoundIndicatorProps {
  currentRound: number
  totalRounds: number
}

export function RoundIndicator({ currentRound, totalRounds }: RoundIndicatorProps) {
  return (
    <div className="flex items-center gap-2" aria-label={`Round ${currentRound} of ${totalRounds}`}>
      {Array.from({ length: totalRounds }).map((_, i) => {
        const index = i + 1
        const done = index < currentRound
        const current = index === currentRound
        return (
          <motion.span
            key={i}
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: done ? "#4CAF50" : current ? "#FFCA28" : "#D1D5DB" }}
            animate={current ? { scale: [1, 1.4, 1] } : { scale: 1 }}
            transition={current ? { duration: 1, repeat: Infinity } : undefined}
          />
        )
      })}
    </div>
  )
}
