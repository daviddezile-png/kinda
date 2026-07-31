"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"

const COLORS = ["#ff6b9d", "#ffc24a", "#4ecdc4", "#7c83ff", "#ff8a5b", "#3ddc97"]

interface ConfettiProps {
  count?: number
}

function seeded(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Celebratory confetti rain — drop it onto any completion screen.
export function Confetti({ count = 44 }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: seeded(i * 7 + count) * 100,
        delay: seeded(i * 11 + count) * 0.8,
        duration: 2.4 + seeded(i * 13 + count) * 2,
        color: COLORS[i % COLORS.length],
        rotate: seeded(i * 17 + count) * 360,
        size: 8 + seeded(i * 19 + count) * 8,
        drift: (seeded(i * 23 + count) - 0.5) * 140,
        round: seeded(i * 29 + count) > 0.5,
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
