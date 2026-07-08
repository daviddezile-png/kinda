import { prisma } from "./prisma"

// Short, human-friendly class join codes. A student device types this to open
// its class (see /student/join), so we avoid ambiguous characters (no I/L/O/0/1)
// to keep it easy to read off a printed card or whiteboard.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

function randomCode(len = 6): string {
  let s = ""
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return s
}

/** A class code guaranteed unique in the DB. */
export async function uniqueClassCode(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = randomCode()
    const existing = await prisma.class.findUnique({ where: { code } })
    if (!existing) return code
  }
  // Astronomically unlikely to get here; a longer code all but guarantees it.
  return randomCode(9)
}

/** Normalise user input to match stored codes (uppercase, no spaces). */
export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "")
}
