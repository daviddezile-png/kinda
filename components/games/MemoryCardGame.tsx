"use client"

import { useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { shuffle } from "@/lib/utils"
import { playSound } from "@/lib/playSound"
import { Picture } from "@/components/ui/Picture"
import { Decor } from "@/components/ui/Decor"
import { useLanguage } from "@/store/languageStore"
import { getPhrases } from "@/lib/i18n"
import type { GameProps } from "./gameTypes"

interface Card {
  uid: string
  pairId: string
  image: string
  word: string
}

export function MemoryCardGame({ letterData, onReward, onComplete }: GameProps) {
  const t = getPhrases(useLanguage((s) => s.lang))
  const cards = useMemo<Card[]>(() => {
    const pairs = letterData.games.memory_cards.pairs
    const doubled = pairs.flatMap((p, i) => [
      { uid: `a-${i}`, pairId: `${i}`, image: p.image, word: p.word },
      { uid: `b-${i}`, pairId: `${i}`, image: p.image, word: p.word },
    ])
    return shuffle(doubled)
  }, [letterData])

  const [flipped, setFlipped] = useState<string[]>([])
  const [matched, setMatched] = useState<string[]>([])
  const moves = useRef(0)
  const lock = useRef(false)

  const handleClick = (card: Card) => {
    if (lock.current || flipped.includes(card.uid) || matched.includes(card.uid)) return
    playSound("/audio/games/card-flip.mp3")

    const next = [...flipped, card.uid]
    setFlipped(next)
    if (next.length < 2) return

    moves.current += 1
    lock.current = true
    const first = cards.find((c) => c.uid === next[0])
    const second = cards.find((c) => c.uid === next[1])

    if (first && second && first.pairId === second.pairId) {
      setTimeout(() => {
        const m = [...matched, first.uid, second.uid]
        setMatched(m)
        setFlipped([])
        lock.current = false
        playSound("/audio/games/match-found.mp3")
        onReward()
        if (m.length === cards.length) {
          const perfect = cards.length
          const stars = moves.current <= perfect ? 3 : moves.current <= perfect * 1.5 ? 2 : 1
          setTimeout(() => onComplete(stars), 800)
        }
      }, 600)
    } else {
      setTimeout(() => {
        setFlipped([])
        lock.current = false
      }, 1200)
    }
  }

  const isUp = (c: Card) => flipped.includes(c.uid) || matched.includes(c.uid)

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-xl font-bold text-gray-700">{t.findPairs}</h3>
      <div className="grid grid-cols-3 gap-3">
        {cards.map((c) => (
          <motion.button
            key={c.uid}
            type="button"
            onClick={() => handleClick(c)}
            whileTap={{ scale: 0.95 }}
            className="flex h-24 w-24 items-center justify-center rounded-2xl shadow-md"
            style={{ backgroundColor: isUp(c) ? "#ffffff" : letterData.color }}
            aria-label={isUp(c) ? c.word : "Hidden card"}
          >
            {isUp(c) ? (
              <Picture src={c.image} alt={c.word} emojiClassName="text-5xl" className="h-full w-full p-1" />
            ) : (
              <Decor name="mystery" size={36} />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
