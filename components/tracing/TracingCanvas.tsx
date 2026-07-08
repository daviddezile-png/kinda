"use client"

import { useLanguage } from "@/store/languageStore"
import { getPhrases } from "@/lib/i18n"
import { StrokeCanvas } from "@/components/tracing/StrokeCanvas"
import { LETTER_STROKES } from "@/lib/letterStrokes"
import type { LetterData } from "@/types"

interface TracingCanvasProps {
  letterData: LetterData
  isUppercase: boolean
  /** Show the guide hand (guided trace) vs. a solo "write it yourself" test. */
  guide?: boolean
  onSectionComplete: (sectionId: string, reward: string) => void
  onLetterComplete: () => void
}

// Letter tracing — a thin binding of the glyph-agnostic StrokeCanvas to the
// letters' stroke paths and Step-3 reward callbacks. (Numbers reuse the same
// canvas via components/numbers/NumberWrite.tsx.)
export function TracingCanvas({
  letterData,
  isUppercase,
  guide = true,
  onSectionComplete,
  onLetterComplete,
}: TracingCanvasProps) {
  const char = isUppercase ? letterData.letter.toUpperCase() : letterData.lowercase
  const path = LETTER_STROKES[char] ?? `M50 14 L50 90`
  const t = getPhrases(useLanguage((s) => s.lang))

  return (
    <StrokeCanvas
      // Remount when the guide toggles so the canvas + animation reset cleanly.
      key={`${char}-${guide ? "guided" : "solo"}`}
      path={path}
      color={letterData.color}
      glyphKey={`${char}-${guide ? "g" : "s"}`}
      clearLabel={t.startOver}
      guide={guide}
      onReward={() => onSectionComplete("coverage", "candy")}
      onComplete={onLetterComplete}
    />
  )
}
