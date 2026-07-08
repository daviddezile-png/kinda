"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export type NumeralState = "idle" | "correct" | "wrong" | "dimmed" | "hint"

interface NumeralCardProps {
  value: number
  color: string
  /** Rendered box in px (square). */
  size?: number
  onClick?: () => void
  state?: NumeralState
  ariaLabel?: string
  className?: string
}

// A big, touchable 3D digit — the numbers module's equivalent of LetterCard.
// Pure CSS-3D glyph (no artwork needed): gradient card, deep drop shadow and a
// translateZ'd digit so it pops off the card like the letter tiles do.
export function NumeralCard({
  value,
  color,
  size = 120,
  onClick,
  state = "idle",
  ariaLabel,
  className,
}: NumeralCardProps) {
  const interactive = Boolean(onClick) && state !== "dimmed" && state !== "correct"

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={ariaLabel ?? `number ${value}`}
      whileHover={interactive ? { y: -6, rotateX: 10, scale: 1.05 } : {}}
      whileTap={interactive ? { scale: 0.92 } : {}}
      animate={
        state === "wrong"
          ? { x: [0, -10, 10, -7, 7, 0] }
          : state === "correct"
            ? { scale: [1, 1.18, 1.08] }
            : { x: 0, scale: 1 }
      }
      transition={{ duration: 0.45 }}
      style={{ width: size, height: size, transformStyle: "preserve-3d", perspective: 600 }}
      className={cn(
        "relative grid shrink-0 cursor-pointer select-none place-items-center rounded-[1.8rem] ring-1 ring-white/70 transition-opacity",
        state === "dimmed" && "opacity-40",
        state === "hint" && "animate-pulse-glow",
        !onClick && "cursor-default",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-[1.8rem]"
        style={{
          background: `linear-gradient(150deg, #ffffff 0%, ${color}22 100%)`,
          boxShadow:
            state === "correct"
              ? `0 0 0 5px #40C057, 0 22px 40px -16px ${color}aa`
              : state === "wrong"
                ? `0 0 0 5px #FF6B6B, 0 22px 40px -16px ${color}aa`
                : `0 22px 40px -16px ${color}aa, inset 0 -6px 0 rgba(0,0,0,0.06)`,
        }}
      />
      <span
        className="relative font-black drop-shadow-md"
        style={{
          color,
          fontSize: size * 0.58,
          lineHeight: 1,
          transform: "translateZ(24px)",
          textShadow: `0 4px 0 ${color}44, 0 10px 18px rgba(0,0,0,0.18)`,
        }}
      >
        {value}
      </span>
    </motion.button>
  )
}
