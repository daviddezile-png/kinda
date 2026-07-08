import fs from "node:fs"
import path from "node:path"
import type { LetterData } from "@/types"
import type { Lang } from "@/lib/i18n"

/**
 * Letters that currently have a data file (server-side only — reads the data dir).
 * Returns uppercase letters, e.g. ["A"].
 */
export function getAvailableLetters(): string[] {
  try {
    const dir = path.join(process.cwd(), "data", "letters")
    return fs
      .readdirSync(dir)
      .filter((f) => /^[a-z]\.json$/.test(f))
      .map((f) => f[0].toUpperCase())
  } catch {
    return []
  }
}

/**
 * Load the data for a single letter (e.g. "A" -> data/letters/a.json).
 * Returns null if no data file exists for that letter yet.
 */
export async function getLetter(letter: string, lang: Lang = "en"): Promise<LetterData | null> {
  const key = letter.toLowerCase()
  if (!/^[a-z]$/.test(key)) return null

  // Swahili content lives in data/letters/sw/. Letters with no Swahili data yet
  // (e.g. Q, X — not native to Swahili) fall back to the English file.
  if (lang === "sw") {
    try {
      const mod = await import(`../data/letters/sw/${key}.json`)
      return mod.default as unknown as LetterData
    } catch {
      // fall through to English
    }
  }

  try {
    const mod = await import(`../data/letters/${key}.json`)
    // JSON is structurally validated by the LetterData shape; cast through unknown
    // because resolveJsonModule widens literal unions (e.g. reward "type").
    return mod.default as unknown as LetterData
  } catch {
    return null
  }
}
