"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Decor } from "@/components/ui/Decor"

interface LivesDisplayProps {
  lives: number
  maxLives?: number
}

export function LivesDisplay({ lives, maxLives = 3 }: LivesDisplayProps) {
  return (
    <div className="flex items-center gap-1" aria-label={`${lives} lives left`}>
      <AnimatePresence>
        {Array.from({ length: maxLives }).map((_, i) =>
          i < lives ? (
            <motion.span
              key={i}
              initial={{ scale: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Decor name="heart" size={28} />
            </motion.span>
          ) : null,
        )}
      </AnimatePresence>
    </div>
  )
}
