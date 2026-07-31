// Stroke paths for each letter, in a 0–100 viewBox, written in natural
// formation order (where a child's hand should travel from start to end).
// `M` commands are pen-ups between separate strokes. Used by TracingCanvas to
// animate a guiding hand along the writing path and to build the coverage mask.

export const LETTER_STROKES: Record<string, string> = {
  // Uppercase
  A: "M20 90 L50 14 L80 90 M33 60 L67 60",
  B: "M28 14 L28 90 M28 14 Q70 14 70 38 Q70 52 28 52 M28 52 Q74 52 74 71 Q74 90 28 90",
  C: "M74 32 Q42 10 30 50 Q42 90 74 68",
  D: "M28 14 L28 90 M28 14 Q74 22 74 52 Q74 86 28 90",
  E: "M30 14 L30 90 M30 14 L70 14 M30 52 L64 52 M30 90 L70 90",
  F: "M30 14 L30 90 M30 14 L70 14 M30 52 L64 52",
  G: "M74 32 Q42 10 30 50 Q42 90 74 68 L74 54 L56 54",
  H: "M28 14 L28 90 M72 14 L72 90 M28 52 L72 52",
  I: "M50 14 L50 90 M36 14 L64 14 M36 90 L64 90",
  J: "M66 14 L66 74 Q66 92 46 90 Q32 88 32 74",
  K: "M28 14 L28 90 M70 14 L30 54 M40 48 L72 90",
  L: "M32 14 L32 90 L70 90",
  M: "M22 90 L22 14 L50 58 L78 14 L78 90",
  N: "M26 90 L26 14 L74 90 L74 14",
  O: "M50 12 Q22 12 22 51 Q22 90 50 90 Q78 90 78 51 Q78 12 50 12",
  P: "M28 14 L28 90 M28 14 Q72 14 72 37 Q72 56 28 56",
  Q: "M50 12 Q22 12 22 51 Q22 88 50 88 Q78 88 78 51 Q78 12 50 12 M58 68 L80 92",
  R: "M28 14 L28 90 M28 14 Q72 14 72 37 Q72 56 28 56 M46 56 L72 90",
  S: "M72 28 Q40 8 32 34 Q28 52 55 55 Q82 60 70 80 Q54 96 28 78",
  T: "M20 16 L80 16 M50 16 L50 90",
  U: "M26 14 L26 68 Q26 90 50 90 Q74 90 74 68 L74 14",
  V: "M22 14 L50 90 L78 14",
  W: "M18 14 L34 90 L50 42 L66 90 L82 14",
  X: "M26 14 L74 90 M74 14 L26 90",
  Y: "M26 14 L50 52 L74 14 M50 52 L50 90",
  Z: "M26 16 L74 16 L26 90 L74 90",

  // Lowercase
  a: "M68 54 Q68 50 50 50 Q34 50 34 68 Q34 86 50 86 Q68 86 68 68 M68 50 L68 90",
  b: "M32 12 L32 90 M32 62 Q72 48 72 72 Q72 94 32 86",
  c: "M72 58 Q44 46 40 68 Q44 90 72 80",
  d: "M72 12 L72 90 M72 62 Q32 48 32 72 Q32 94 72 86",
  e: "M38 72 L72 72 Q72 52 50 52 Q34 54 38 74 Q44 92 72 82",
  f: "M70 18 Q50 10 50 34 L50 90 M34 50 L66 50",
  g: "M72 52 Q44 46 40 66 Q42 84 64 80 Q72 78 72 60 L72 90 Q70 100 44 96",
  h: "M32 12 L32 90 M32 60 Q70 46 70 72 L70 90",
  i: "M50 46 L50 90 M50 28 L50 33",
  j: "M58 46 L58 90 Q56 100 40 96 M58 28 L58 33",
  k: "M34 12 L34 90 M66 50 L38 70 M46 64 L68 90",
  l: "M50 12 L50 90",
  m: "M28 90 L28 50 M28 58 Q44 46 50 60 L50 90 M50 58 Q66 46 72 60 L72 90",
  n: "M32 90 L32 50 M32 58 Q70 46 70 72 L70 90",
  o: "M50 50 Q32 50 32 70 Q32 90 50 90 Q68 90 68 70 Q68 50 50 50",
  p: "M32 50 L32 98 M32 60 Q72 46 72 72 Q72 94 32 84",
  q: "M72 50 L72 98 M72 60 Q32 46 32 72 Q32 94 72 84",
  r: "M36 90 L36 50 M36 60 Q56 47 70 52",
  s: "M70 56 Q46 46 42 60 Q42 71 58 72 Q74 74 66 84 Q52 93 34 82",
  t: "M50 26 L50 82 Q50 92 66 88 M34 48 L64 48",
  u: "M32 50 L32 78 Q32 91 50 90 Q68 89 68 76 L68 50 M68 60 L68 90",
  v: "M32 50 L50 90 L68 50",
  w: "M28 50 L40 90 L50 64 L60 90 L72 50",
  x: "M35 50 L68 90 M68 50 L35 90",
  y: "M32 50 L50 84 M68 50 L50 84 L40 98",
  z: "M35 50 L68 50 L35 90 L68 90",
}

/** First point of a path (where the hand should start). */
export function strokeStart(path: string): { x: number; y: number } | null {
  const m = path.match(/M\s*([\d.]+)[ ,]+([\d.]+)/)
  return m ? { x: Number(m[1]), y: Number(m[2]) } : null
}
