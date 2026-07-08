"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"

const COLORS = ["#ff6b9d", "#ffc24a", "#4ecdc4", "#7c83ff", "#ff8a5b", "#3ddc97"]

interface ConfettiProps {
  count?: number
}

// Celebratory confetti rain — drop it onto any completion screen.
export function Confetti({ count = 44 }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.4 + Math.random() * 2,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
        size: 8 + Math.random() * 8,
        drift: (Math.random() - 0.5) * 140,
        round: Math.random() > 0.5,
      })),
    [count],
  )

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -50, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", x: p.drift, rotate: p.rotate + 540, opacity: [1, 1, 0.9, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn", repeat: Infinity, repeatDelay: 0.5 }}
          style={{
            position: "absolute",
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.55,
            backgroundColor: p.color,
            borderRadius: p.round ? "9999px" : 2,
          }}
        />
      ))}
    </div>
  )
}
