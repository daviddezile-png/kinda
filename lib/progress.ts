"use client"

// Lightweight per-device record of which letters a student has finished, used to
// unlock the next letter in a sequential curriculum. (Server-side per-student
// Progress rows already exist in the schema; this is the client gate until the
// lesson flow writes them.)
const KEY = "kinda_done"

export function getCompletedLetters(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function markLetterComplete(letter: string): void {
  if (typeof window === "undefined") return
  const L = letter.toUpperCase()
  const done = new Set(getCompletedLetters())
  done.add(L)
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...done]))
  } catch {
    // storage full / disabled — gating just stays where it was
  }
}
