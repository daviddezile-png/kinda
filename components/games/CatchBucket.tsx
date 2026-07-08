"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { DISTRACTORS } from "@/data/distractors"
import { randomFrom } from "@/lib/utils"
import { playSound } from "@/lib/playSound"
import { Picture } from "@/components/ui/Picture"
import { Decor } from "@/components/ui/Decor"
import { useLanguage } from "@/store/languageStore"
import { getPhrases } from "@/lib/i18n"
import type { GameProps } from "./gameTypes"

interface FlyItem {
  id: string
  image: string
  word: string
  isCorrect: boolean
  x: number
  y: number
}

const BUCKET_TARGET = 5

export function CatchBucket({ letterData, onReward, onComplete }: GameProps) {
  const t = getPhrases(useLanguage((s) => s.lang))
  const correctItems = letterData.games.feed_character.correctItems
  const [items, setItems] = useState<FlyItem[]>([])
  const [fill, setFill] = useState(0)
  const done = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const isCorrect = Math.random() > 0.45
      const src = isCorrect ? randomFrom(correctItems) : randomFrom(DISTRACTORS)
      const item: FlyItem = {
        id: `${Date.now()}-${Math.random()}`,
        image: src.image,
        word: src.word,
        isCorrect,
        x: Math.random() * 75 + 10,
        y: Math.random() * 50 + 10,
      }
      setItems((p) => [...p, item])
      setTimeout(() => setItems((p) => p.filter((i) => i.id !== item.id)), 2500)
    }, 1300)
    return () => clearInterval(interval)
  }, [correctItems])

  const tap = (item: FlyItem) => {
    setItems((p) => p.filter((i) => i.id !== item.id))
    if (item.isCorrect) {
      playSound("/audio/sfx/splash.mp3")
      onReward()
      setFill((f) => {
        const nf = f + 1
        if (nf >= BUCKET_TARGET && !done.current) {
          done.current = true
          setTimeout(() => onComplete(3), 600)
        }
        return nf
      })
    } else {
      playSound("/audio/feedback/wrong-soft.mp3")
    }
  }

  return (
    <div className="relative h-[70vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white/40">
      <h3 className="pt-2 text-center text-xl font-bold text-gray-700">{t.catchBucket(letterData.letter)}</h3>

      {items.map((item) => (
        <motion.button
          key={item.id}
          type="button"
          onClick={() => tap(item)}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute"
          style={{ left: `${item.x}%`, top: `${item.y}%` }}
        >
          <Picture src={item.image} alt={item.word} emojiClassName="text-4xl" className="h-14 w-14" />
        </motion.button>
      ))}

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
        <Decor name="bucket" size={64} />
        <div className="text-sm font-bold text-gray-600">{fill}/{BUCKET_TARGET}</div>
      </div>
    </div>
  )
}
