"use client"

import { Howl } from "howler"

/**
 * Fire-and-forget one-shot sound. Safe with missing placeholder assets — a load
 * error is swallowed so gameplay never breaks on a 404. Pass `onend` to run
 * something once the sound finishes (also fired on a load error, so a missing
 * file never stalls a sequence).
 */
export function playSound(src: string, volume = 1, onend?: () => void): void {
  try {
    const howl = new Howl({ src: [src], volume, onend, onloaderror: onend })
    howl.play()
  } catch {
    onend?.() // audio is non-essential — never let it block what comes next
  }
}
