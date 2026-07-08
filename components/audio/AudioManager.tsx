"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import { Howl } from "howler"
import type { CharacterSpeech } from "@/types"

export interface AudioManagerRef {
  playLetter: () => void
  playWord: (index: number) => void
  playCharacterSpeech: (key: keyof CharacterSpeech) => void
  playSong: () => void
  stopAll: () => void
}

interface AudioManagerProps {
  letterAudio: string
  wordAudios: string[]
  speechAudios: CharacterSpeech
  songAudio: string
  /** Called once all audio has loaded (or failed to load — placeholders won't block). */
  onReady?: () => void
}

// Reward sounds are played by RewardSystem (see SPEC-DEVIATIONS.md); AudioManager
// owns letter/word/speech/song playback only. Renders no UI.
const AudioManager = forwardRef<AudioManagerRef, AudioManagerProps>(function AudioManager(
  { letterAudio, wordAudios, speechAudios, songAudio, onReady },
  ref,
) {
  const sounds = useRef<Record<string, Howl>>({})

  useEffect(() => {
    const entries: Record<string, string> = {
      letter: letterAudio,
      intro: speechAudios.intro,
      touchPrompt: speechAudios.touchPrompt,
      celebration: speechAudios.celebration,
      lowercaseIntro: speechAudios.lowercaseIntro,
      song: songAudio,
    }
    wordAudios.forEach((src, i) => {
      entries[`word${i}`] = src
    })

    const keys = Object.keys(entries)
    let settled = 0
    let ready = false
    const markSettled = () => {
      settled += 1
      if (settled >= keys.length && !ready) {
        ready = true
        onReady?.()
      }
    }

    const loaded: Record<string, Howl> = {}
    keys.forEach((key) => {
      loaded[key] = new Howl({
        src: [entries[key]],
        preload: true,
        onload: markSettled,
        onloaderror: markSettled, // missing placeholder audio should not block the lesson
      })
    })
    sounds.current = loaded

    // Safety net: never leave the lesson stuck on the loading screen.
    const fallback = setTimeout(() => {
      if (!ready) {
        ready = true
        onReady?.()
      }
    }, 4000)

    return () => {
      clearTimeout(fallback)
      Object.values(loaded).forEach((s) => s.unload())
    }
    // Audio set is fixed for the lifetime of a lesson; intentionally run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useImperativeHandle(ref, () => ({
    playLetter: () => {
      sounds.current.letter?.play()
    },
    playWord: (index: number) => {
      sounds.current[`word${index}`]?.play()
    },
    playCharacterSpeech: (key) => {
      sounds.current[key]?.play()
    },
    playSong: () => {
      sounds.current.song?.play()
    },
    stopAll: () => {
      Object.values(sounds.current).forEach((s) => s.stop())
    },
  }))

  return null
})

export default AudioManager
