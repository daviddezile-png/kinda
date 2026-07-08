"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Character3D } from "@/components/character/Character3D"
import { DISTRACTORS } from "@/data/distractors"
import { randomFrom } from "@/lib/utils"
import { playSound } from "@/lib/playSound"
import { Picture } from "@/components/ui/Picture"
import { useLanguage } from "@/store/languageStore"
import { getPhrases } from "@/lib/i18n"
import type { GameProps } from "./gameTypes"

interface FallItem {
  id: string
  image: string
  word: string
  isCorrect: boolean
  x: number
}

export function FeedCharacter({ letterData, onReward, onComplete }: GameProps) {
  const t = getPhrases(useLanguage((s) => s.lang))
  const correctItems = letterData.games.feed_character.correctItems
  const [items, setItems] = useState<FallItem[]>([])
  const [fill, setFill] = useState(0)
  const done = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const isCorrect = Math.random() > 0.5
      const src = isCorrect ? randomFrom(correctItems) : randomFrom(DISTRACTORS)
      const item: FallItem = {
        id: `${Date.now()}-${Math.random()}`,
        image: src.image,
        word: src.word,
        isCorrect,
        x: Math.random() * 80 + 10,
      }
      setItems((p) => [...p, item])
      setTimeout(() => setItems((p) => p.filter((i) => i.id !== item.id)), 4000)
    }, 1500)
    return () => clearInterval(interval)
  }, [correctItems])

  const tap = (item: FallItem) => {
    setItems((p) => p.filter((i) => i.id !== item.id))
    if (item.isCorrect) {
      // (reward-audio folder removed — the catch still feels good visually)
      onReward()
      setFill((f) => {
        const nf = Math.min(100, f + 20)
        if (nf >= 100 && !done.current) {
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
    <div className="relative h-[70vh] w-full max-w-xl overflow-hidden">
      <h3 className="text-center text-xl font-bold text-gray-700">{t.feedMe(letterData.letter)}</h3>

      {items.map((item) => (
        <motion.button
          key={item.id}
          type="button"
          onClick={() => tap(item)}
          initial={{ top: "0%" }}
          animate={{ top: "85%" }}
          transition={{ duration: 4, ease: "linear" }}
          className="absolute"
          style={{ left: `${item.x}%` }}
        >
          <Picture src={item.image} alt={item.word} emojiClassName="text-4xl" className="h-16 w-16" />
        </motion.button>
      ))}

      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 flex-col items-center">
        <Character3D state="nom_nom" size={140} />
        <div className="mt-1 h-3 w-32 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full bg-green-500 transition-all" style={{ width: `${fill}%` }} />
        </div>
      </div>
    </div>
  )
}
