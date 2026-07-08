"use client"

import { useEffect, useRef, useState } from "react"
import { CountRow } from "@/components/numbers/CountRow"
import {
  playCountUp,
  playFeedback,
  playInstruction,
  speakNumberAnyVoice,
} from "@/lib/audio"
import { playSound } from "@/lib/playSound"
import { type NumberGameProps } from "./shared"

const TOUCH_SFX = "/audio/sfx/touch.mp3"

// Game 3 — "Put three stars in the basket!" A tray with MORE objects than
// needed; every tap is counted out loud (in a different voice each time — the
// echo keeps the repetition fresh). Reaching the target ends the round with
// the full count-up, so the child hears the sequence one more time.
export function TapExactly({ data, onComplete }: NumberGameProps) {
  const total = Math.min(10, data.value + 3)
  const [lit, setLit] = useState<number[]>([])
  const finished = useRef(false)

  useEffect(() => {
    playInstruction(`numbers/tap-exactly/${data.value}`)
  }, [data.value])

  const handleTap = (i: number) => {
    if (finished.current || lit.includes(i)) return
    const k = lit.length + 1
    setLit((prev) => [...prev, i])
    playSound(TOUCH_SFX)
    if (k < data.value) {
      speakNumberAnyVoice(k)
    } else {
      finished.current = true
      // "…three! One, two, three!" → cheer → next game.
      speakNumberAnyVoice(k, () =>
        playCountUp(data.value, () =>
          playFeedback(true, () => setTimeout(onComplete, 700)),
        ),
      )
    }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <button
        type="button"
        onClick={() => playInstruction(`numbers/tap-exactly/${data.value}`)}
        className="rounded-full bg-white/80 px-5 py-2 text-base font-bold text-gray-600 shadow"
      >
        Tap {data.value} {data.object.plural}, one by one!
      </button>
      <CountRow
        object={data.object}
        count={total}
        lit={lit}
        // handleTap itself refuses taps once finished — passing it
        // unconditionally keeps refs out of render.
        onTap={handleTap}
        size={86}
      />
      {/* Big running counter so the child SEES the number grow as they tap. */}
      <div
        className="grid h-20 w-20 place-items-center rounded-full bg-white/90 text-4xl font-black shadow-lg ring-4 ring-white/70"
        style={{ color: data.color }}
        aria-live="polite"
      >
        {lit.length}
      </div>
    </div>
  )
}
