"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Character3D } from "@/components/character/Character3D"
import { shuffle } from "@/lib/utils"
import { playSound } from "@/lib/playSound"
import { playEncouraging } from "@/lib/audio"
import { useLanguage } from "@/store/languageStore"
import { getPhrases } from "@/lib/i18n"
import type { GameProps } from "./gameTypes"

export function SingAlong({ letterData, onReward, onComplete }: GameProps) {
  const t = getPhrases(useLanguage((s) => s.lang))
  const lines = letterData.song.lyricsLines
  const [li, setLi] = useState(0)
  const [wrong, setWrong] = useState<string | null>(null)
  const line = lines[li]
  const choices = useMemo(() => (line ? shuffle(line.choices) : []), [line])

  useEffect(() => {
    playSound(letterData.song.audio, 0.7)
  }, [letterData.song.audio])

  const choose = (choice: string) => {
    if (!line) return
    if (choice === line.blankWord) {
      // onReward (GameSelector) cheers and names the gift — no praise here.
      onReward()
      if (li + 1 < lines.length) {
        setLi(li + 1)
      } else {
        setTimeout(() => onComplete(3), 500)
      }
    } else {
      setWrong(choice)
      playSound("/audio/feedback/wrong-soft.mp3")
      playEncouraging()
      setTimeout(() => setWrong(null), 500)
    }
  }

  if (lines.length === 0 || !line) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Character3D state="celebrating" size={160} />
        <h3 className="text-xl font-bold text-gray-700">{t.singAlong}</h3>
        <button
          type="button"
          onClick={() => onComplete(3)}
          className="rounded-full bg-[#FF6B6B] px-8 py-3 font-black text-white"
        >
          {t.doneBtn}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <Character3D state="celebrating" size={140} />
      <h3 className="text-xl font-bold text-gray-700">{t.singAlong}</h3>
      <p className="text-2xl font-black" style={{ color: letterData.color }}>
        {line.line}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {choices.map((choice) => (
          <motion.button
            key={choice}
            type="button"
            onClick={() => choose(choice)}
            animate={wrong === choice ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
            className="rounded-full bg-white px-6 py-3 text-xl font-bold text-gray-700 shadow"
          >
            {choice}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
