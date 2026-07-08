"use client"

import { useMemo } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { letterArt } from "@/lib/letterArt"

interface LetterCardProps {
  letter: string
  lowercase: string
  color: string
  isGlowing: boolean
  showLowercase: boolean
  onTouch: () => void
}

// Fallback extrusion for the few letters with no photo yet: a solid, chunky 3D
// glyph (stack of offset text-shadows in a darker shade).
function extrusion(color: string, depth = 12) {
  const shade = `color-mix(in srgb, ${color} 50%, #15102e)`
  const layers: string[] = []
  for (let i = 1; i <= depth; i++) layers.push(`${i}px ${i}px 0 ${shade}`)
  layers.push("0 22px 28px rgba(30,20,60,0.35)")
  return layers.join(", ")
}

// Shows the author-supplied letter photo (public/images/letters/…) on a big,
// pressable card. Intentionally LARGE — it fills a good part of a tablet screen
// so a young child can see the letter shape clearly — with a calm, simple
// animation (a soft float + a gentle press bounce), not a spinning 3D flip, so
// the letter is always easy to read. Styling (colour ring, glow) is added around
// the artwork.
export function LetterCard({
  letter,
  lowercase,
  color,
  isGlowing,
  showLowercase,
  onTouch,
}: LetterCardProps) {
  const textShadow = useMemo(() => extrusion(color), [color])

  const art = letterArt(letter, showLowercase ? "lower" : "upper")
  const shown = showLowercase ? lowercase : letter

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      whileTap={{ scale: 0.94 }}
      onClick={onTouch}
      className="bg-transparent outline-none"
      aria-label={`Letter ${shown}`}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={showLowercase ? "lower" : "upper"}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.35 }}
          className="block"
        >
          {/* Gentle float only — no spin — so the letter stays easy to read. */}
          <motion.span
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="relative block rounded-4xl bg-white p-3 sm:p-5"
            style={{
              width: "clamp(13rem, 54vmin, 24rem)",
              height: "clamp(13rem, 54vmin, 24rem)",
              border: `8px solid ${color}`,
              boxShadow: isGlowing
                ? `0 0 0 8px #fff, 0 0 52px 14px rgba(255,210,60,0.9), 0 24px 44px -14px ${color}aa`
                : `0 0 0 8px #fff, 0 24px 44px -14px ${color}aa`,
            }}
          >
            {art ? (
              <span className="relative block h-full w-full">
                <Image
                  src={art}
                  alt={`Letter ${shown}`}
                  fill
                  sizes="(max-width: 640px) 54vw, 24rem"
                  draggable={false}
                  className="select-none rounded-[1.4rem] object-cover"
                />
              </span>
            ) : (
              <span
                className="grid h-full w-full select-none place-items-center font-black leading-none"
                style={{
                  color,
                  fontSize: "clamp(120px, 34vmin, 220px)",
                  textShadow,
                  WebkitTextStroke: "2px rgba(255,255,255,0.85)",
                }}
              >
                {shown}
              </span>
            )}
          </motion.span>
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
