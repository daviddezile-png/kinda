// The author-supplied 3D letter photos under /public/images/letters/ come in
// several style variants per letter — uppercase/D.png, D-2.png, D-3.png … and
// lowercase/a.png, a-2.png … These power the Level-1 letter-picking games, where
// the SAME letter is shown in a different style each round so the child learns
// the letter shape itself, not one memorised picture.
//
// The base file is variant 1 ("D.png"); extra styles are "-2", "-3", … The
// counts below mirror the files actually on disk (see public/images/letters).
// Anything past the real count simply falls back to the base file, so a wrong
// count only costs variety, never a broken image.

import type { LetterCase } from "@/lib/letterArt"

const UPPER_COUNT: Record<string, number> = {
  A: 3, B: 3, C: 2, D: 4, E: 3, F: 3, G: 3, H: 4, I: 2, J: 5, K: 4, L: 3, M: 3,
  N: 2, O: 2, P: 2, Q: 2, R: 2, S: 2, T: 4, U: 3, V: 2, W: 2, X: 3, Y: 2, Z: 5,
}
const LOWER_COUNT: Record<string, number> = {
  a: 2, b: 2, c: 5, d: 1, e: 3, f: 2, g: 1, h: 2, i: 2, j: 2, k: 1, l: 1, m: 1,
  n: 1, o: 3, p: 1, q: 1, r: 2, s: 2, t: 1, u: 2, v: 1, w: 3, x: 1, y: 2, z: 2,
}

const dir = (c: LetterCase) => (c === "upper" ? "uppercase" : "lowercase")
const keyFor = (letter: string, c: LetterCase) =>
  c === "upper" ? letter.toUpperCase() : letter.toLowerCase()

/** How many style variants exist for this letter/case (at least 1). */
export function variantCount(letter: string, c: LetterCase): number {
  const table = c === "upper" ? UPPER_COUNT : LOWER_COUNT
  return Math.max(1, table[keyFor(letter, c)] ?? 1)
}

/**
 * Path to the nth style variant (1-based) of a letter. Variant 1 is the base
 * file ("D.png"); higher variants are "D-2.png", "D-3.png" … Out-of-range
 * indices wrap around so a call site can always ask for "the next style".
 */
export function letterVariant(letter: string, c: LetterCase, index: number): string {
  const count = variantCount(letter, c)
  const n = ((index - 1) % count + count) % count + 1 // 1-based, wrapped
  const key = keyFor(letter, c)
  const suffix = n === 1 ? "" : `-${n}`
  return `/images/letters/${dir(c)}/${key}${suffix}.jpg`
}

/**
 * Pick `n` distinct letters other than `exclude`, as {letter, image} options for
 * a letter-picking game. Each wrong letter uses its base style; the styling
 * variety is carried by the correct letter changing style between rounds.
 */
export function otherLetters(
  exclude: string,
  c: LetterCase,
  n: number,
): { letter: string; image: string }[] {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
  const pool = alphabet.filter((L) => L.toUpperCase() !== exclude.toUpperCase())
  // Fisher–Yates on a copy, take n.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, n).map((L) => {
    const shown = c === "upper" ? L : L.toLowerCase()
    return { letter: shown, image: letterVariant(L, c, 1) }
  })
}
