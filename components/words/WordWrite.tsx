"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { StrokeCanvas } from "@/components/tracing/StrokeCanvas"
import { Picture } from "@/components/ui/Picture"
import { LETTER_STROKES } from "@/lib/letterStrokes"
import { playInstruction } from "@/lib/audio"

interface WordWriteProps {
  /** Lowercase word to write, one letter at a time. */
  word: string
  color: string
  image?: string
  /** Fired when every letter has been written. */
  onComplete: () => void
}

// Write the whole word, letter by letter, reusing the same guided StrokeCanvas
// as the letters/numbers lessons. The word is shown above with the current
// letter lit, so the child always sees where they are.
export function WordWrite({ word, color, image, onComplete }: WordWriteProps) {
  const letters = word.split("")
  const [idx, setIdx] = useState(0)
  const letter = letters[idx]
  const path = LETTER_STROKES[letter] ?? LETTER_STROKES[letter?.toUpperCase()] ?? "M50 14 L50 90"

  const handleLetterDone = () => {
    if (idx + 1 < letters.length) {
      playInstruction("words/write-next")
      setIdx((i) => i + 1)
    } else {
      onComplete()
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Picture src={image} alt={word} className="h-20 w-20 object-contain" />

      {/* The word, with the letter we're writing lit up. */}
      <div className="flex gap-1.5" aria-label={`writing ${word}, letter ${idx + 1} of ${letters.length}`}>
        {letters.map((l, i) => (
          <motion.span
            key={i}
            animate={{ scale: i === idx ? 1.15 : 1 }}
            className="text-4xl font-black lowercase sm:text-5xl"
            style={{ color: i < idx ? color : i === idx ? color : "#cbd0d8", opacity: i <= idx ? 1 : 0.6 }}
          >
            {l}
          </motion.span>
        ))}
      </div>

      <StrokeCanvas
        // Remount per letter so coverage + guide reset cleanly.
        key={`${word}-${idx}`}
        path={path}
        color={color}
        glyphKey={`${word}-${idx}`}
        clearLabel="Start over"
        onComplete={handleLetterDone}
      />
    </div>
  )
}
