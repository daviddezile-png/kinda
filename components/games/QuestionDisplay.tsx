"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { playSound } from "@/lib/playSound"
import { playInstruction } from "@/lib/audio"
import { useLanguage } from "@/store/languageStore"
import { getPhrases } from "@/lib/i18n"

interface QuestionDisplayProps {
  letter: string
  color: string
  audio: string
  /** Wait this long before speaking the prompt, so a stage-intro line played by
   *  the parent (e.g. "Now we are going to find pictures!") is not cut off. */
  introDelayMs?: number
}

export function QuestionDisplay({ letter, color, audio, introDelayMs = 0 }: QuestionDisplayProps) {
  const t = getPhrases(useLanguage((s) => s.lang))

  useEffect(() => {
    // Spoken prompt: "Touch the picture that starts with A!"
    const speak = () => {
      playSound(audio) // legacy per-letter speech (silent until recorded)
      playInstruction(`step2/touch-picture-${letter.toLowerCase()}`)
    }
    if (introDelayMs <= 0) {
      speak()
      return
    }
    const id = setTimeout(speak, introDelayMs)
    return () => clearTimeout(id)
  }, [audio, letter, introDelayMs])

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      className="flex items-center justify-center gap-3 px-4 text-center"
    >
      <motion.span
        className="flex h-14 w-14 items-center justify-center rounded-full text-3xl font-black text-white shadow"
        style={{ backgroundColor: color }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      >
        {letter}
      </motion.span>
      <p className="text-xl font-bold text-gray-700 md:text-2xl">{t.findPicture(letter)}</p>
    </motion.div>
  )
}
