"use client"

import { motion, type Variants } from "framer-motion"
import { Picture } from "@/components/ui/Picture"

export type CardState = "idle" | "correct" | "wrong" | "dimmed" | "hint"

interface ImageCardProps {
  image: string
  word: string
  state: CardState
  onSelect: () => void
  /** "lg" = bigger picture for early-stage screens (Step 0). */
  size?: "md" | "lg"
}

const cardVariants: Variants = {
  idle: { scale: 1, opacity: 1, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" },
  correct: {
    scale: [1, 1.15, 1.05],
    boxShadow: "0 0 0 4px #4CAF50, 0 8px 16px rgba(76,175,80,0.4)",
    transition: { duration: 0.4 },
  },
  wrong: {
    x: [0, -10, 10, -8, 8, -5, 5, 0],
    boxShadow: "0 0 0 4px #FF5252",
    transition: { duration: 0.5 },
  },
  dimmed: { scale: 0.95, opacity: 0.4, transition: { duration: 0.3 } },
  hint: {
    scale: [1, 1.06, 1],
    boxShadow: [
      "0 0 0 0 rgba(76,175,80,0)",
      "0 0 0 7px rgba(76,175,80,0.45)",
      "0 0 0 0 rgba(76,175,80,0)",
    ],
    transition: { duration: 1.3, repeat: Infinity },
  },
}

export function ImageCard({ image, word, state, onSelect, size = "md" }: ImageCardProps) {
  const big = size === "lg"
  return (
    <motion.button
      type="button"
      variants={cardVariants}
      animate={state}
      initial="idle"
      onClick={onSelect}
      disabled={state === "dimmed" || state === "correct"}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl bg-white ${
        big ? "min-h-52 min-w-52 p-2" : "min-h-36 min-w-36 p-1.5"
      }`}
      aria-label={word}
    >
      <Picture
        src={image}
        alt={word}
        className={
          big
            ? "h-48 w-48 object-contain md:h-56 md:w-56"
            : "h-32 w-32 object-contain md:h-36 md:w-36"
        }
      />
    </motion.button>
  )
}
