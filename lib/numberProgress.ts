"use client"

// Per-device record of which numbers the child has finished — the numbers map
// unlocks sequentially from it (same lightweight pattern as lib/progress.ts
// until per-student Progress rows are wired for the NUMBERS module).
const KEY = "kinda_numbers_done"

export function getCompletedNumbers(): number[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

export function markNumberComplete(value: number): void {
  if (typeof window === "undefined") return
  const done = new Set(getCompletedNumbers())
  done.add(value)
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...done].sort((a, b) => a - b)))
  } catch {
    // storage full / disabled — gating just stays where it was
  }
}

/** Highest unlocked number (1-based): the first not-yet-finished number. */
export function nextNumber(): number {
  const done = new Set(getCompletedNumbers())
  for (let v = 1; v <= 10; v++) if (!done.has(v)) return v
  return 10
}
