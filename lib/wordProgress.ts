"use client"

// Per-device record of which letters' word sets the child has finished — the
// Words map unlocks sequentially from it (same lightweight pattern as
// lib/numberProgress.ts / lib/progress.ts until per-student Progress rows are
// wired for a WORDS module).
import { WORD_LETTERS } from "@/data/words"

const KEY = "kinda_words_done"

export function getCompletedWordLetters(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function markWordLetterComplete(letter: string): void {
  if (typeof window === "undefined") return
  const done = new Set(getCompletedWordLetters())
  done.add(letter.toUpperCase())
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...done]))
  } catch {
    // storage full / disabled — gating just stays where it was
  }
}

/** First letter whose words aren't finished yet (falls back to the last). */
export function nextWordLetter(): string {
  const done = new Set(getCompletedWordLetters())
  return WORD_LETTERS.find((l) => !done.has(l)) ?? WORD_LETTERS[WORD_LETTERS.length - 1]
}
