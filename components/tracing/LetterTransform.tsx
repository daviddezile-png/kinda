"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Picture } from "@/components/ui/Picture"

interface LetterTransformProps {
  letter: string
  transformImage: string
  letterColor: string
  isTransforming: boolean
  onComplete: () => void
}

export function LetterTransform({
  letter,
  transformImage,
  letterColor,
  isTransforming,
  onComplete,
}: LetterTransformProps) {
  // Derive the word from the image filename (e.g. .../apple.png → "apple") so the
  // emoji fallback matches when no real image exists.
  const word = transformImage.split("/").pop()?.replace(/\.[a-z]+$/i, "").replace(/-/g, " ") ?? letter

  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      <AnimatePresence mode="wait">
        {!isTransforming ? (
          <motion.div
            key="letter"
            exit={{ scale: 0, rotate: 360, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="select-none text-[150px] font-black leading-none"
            style={{ color: letterColor }}
          >
            {letter}
          </motion.div>
        ) : (
          <motion.div
            key="image"
            initial={{ scale: 0, rotate: -360, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
            onAnimationComplete={onComplete}
          >
            <Picture src={transformImage} alt={word} emojiClassName="text-8xl" className="h-40 w-40" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
