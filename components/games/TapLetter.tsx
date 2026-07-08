"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Decor } from "@/components/ui/Decor"
import { shuffle } from "@/lib/utils"
import { playSound } from "@/lib/playSound"
import { useLanguage } from "@/store/languageStore"
import { getPhrases } from "@/lib/i18n"
import type { GameProps } from "./gameTypes"

interface FloatingLetter {
  id: string
  letter: string
  isCorrect: boolean
  x: number
  y: number
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

export function TapLetter({ letterData, onReward, onComplete }: GameProps) {
  const t = getPhrases(useLanguage((s) => s.lang))
  const target = letterData.letter.toUpperCase()
  const [letters, setLetters] = useState<FloatingLetter[]>([])
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(30)
  const ended = useRef(false)

  const spawn = (correct: boolean, key: string): FloatingLetter => ({
    id: key,
    letter: correct ? target : "",
    isCorrect: correct,
    x: Math.random() * 80 + 5,
    y: Math.random() * 65 + 12,
  })

  useEffect(() => {
    const others = ALPHABET.replace(target, "").split("")
    const correct = Array.from({ length: 3 }, (_, i) => spawn(true, `c-${i}`))
    const wrong = shuffle(others)
      .slice(0, 12)
      .map((l, i) => ({ ...spawn(false, `w-${i}`), letter: l }))
    setLetters(shuffle([...correct, ...wrong]))
    // target is stable for the game's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  useEffect(() => {
    const t = setInterval(() => setTime((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (time <= 5 && time > 0) playSound("/audio/games/countdown-beep.mp3")
    if (time <= 0 && !ended.current) {
      ended.current = true
      const stars = score >= 8 ? 3 : score >= 5 ? 2 : 1
      onComplete(stars)
    }
  }, [time, score, onComplete])

  const tap = (fl: FloatingLetter) => {
    if (fl.isCorrect) {
      setScore((s) => s + 1)
      playSound("/audio/games/pop.mp3")
      onReward()
      setLetters((prev) => [
        ...prev.filter((l) => l.id !== fl.id),
        { ...spawn(true, `c-${Math.random()}`) },
      ])
    } else {
      playSound("/audio/feedback/wrong-soft.mp3")
    }
  }

  return (
    <div className="relative h-[70vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white/40">
      <div className="absolute left-3 top-2 inline-flex items-center gap-1 text-lg font-black text-gray-700">
        <Decor name="timer" size={20} /> {Math.max(0, time)}s
      </div>
      <div className="absolute right-3 top-2 inline-flex items-center gap-1 text-lg font-black text-gray-700"><Decor name="star" size={20} /> {score}</div>
      <h3 className="pt-2 text-center text-xl font-bold text-gray-700">{t.tapAll(target)}</h3>

      {letters.map((fl) => (
        <motion.button
          key={fl.id}
          type="button"
          onClick={() => tap(fl)}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 1.6 + Math.random(), repeat: Infinity, ease: "easeInOut" }}
          className="absolute text-5xl font-black"
          style={{ left: `${fl.x}%`, top: `${fl.y}%`, color: fl.isCorrect ? letterData.color : "#9CA3AF" }}
        >
          {fl.letter}
        </motion.button>
      ))}
    </div>
  )
}
