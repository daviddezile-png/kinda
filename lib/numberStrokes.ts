// Digit stroke paths in the same 100-unit viewBox the letter strokes use
// (lib/letterStrokes.ts) — simplified schoolbook forms, drawn the way a
// teacher writes them on the board. Multi-stroke digits (4) use subpaths;
// the guide hand jumps between subpaths exactly like multi-stroke letters.
export const NUMBER_STROKES: Record<string, string> = {
  "0": "M50 12 Q28 12 28 50 Q28 88 50 88 Q72 88 72 50 Q72 12 50 12",
  "1": "M36 26 L54 13 L54 90",
  "2": "M30 30 Q30 12 50 12 Q70 12 70 30 Q70 44 52 58 L30 88 L72 88",
  "3": "M32 24 Q38 11 52 12 Q70 14 68 31 Q66 44 50 48 Q68 52 70 68 Q70 88 51 89 Q34 90 30 76",
  "4": "M58 13 L27 60 L78 60 M62 34 L62 90",
  "5": "M68 13 L34 13 L31 46 Q43 40 53 42 Q70 46 70 64 Q70 88 48 88 Q33 88 30 75",
  "6": "M60 13 Q40 28 34 52 Q29 88 51 88 Q70 88 70 68 Q70 50 52 50 Q38 50 34 61",
  "7": "M28 15 L72 15 L44 90",
  "8": "M50 48 Q31 44 32 28 Q34 12 50 12 Q66 12 68 28 Q69 44 50 48 Q29 53 29 69 Q29 88 50 88 Q71 88 71 69 Q71 53 50 48",
  "9": "M68 32 Q68 12 50 12 Q32 12 32 32 Q32 52 50 52 Q68 52 68 32 M68 32 L68 64 Q68 85 52 90",
}

/** The digits a number is written with, in writing order ("10" → ["1","0"]). */
export function digitsOf(value: number): string[] {
  return String(value).split("")
}
