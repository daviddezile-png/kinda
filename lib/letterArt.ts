// The author-supplied 3D letter photos under /public/images/letters/
// (uppercase/A.png, lowercase/a.png). Step 1 shows THESE — the child learns
// from the real artwork, not a font glyph. If a case is ever missing its file,
// callers fall back to the styled glyph.

const UPPERCASE = new Set("abcdefghijklmnopqrstuvwxyz".split(""))
const LOWERCASE = new Set("abcdefghijklmnopqrstuvwxyz".split(""))

export type LetterCase = "upper" | "lower"

/** Path of the added letter image, or undefined when that case has no file. */
export function letterArt(letter: string, letterCase: LetterCase): string | undefined {
  const key = letter.toLowerCase()
  if (letterCase === "upper") {
    return UPPERCASE.has(key) ? `/images/letters/uppercase/${key.toUpperCase()}.jpg` : undefined
  }
  return LOWERCASE.has(key) ? `/images/letters/lowercase/${key}.jpg` : undefined
}
