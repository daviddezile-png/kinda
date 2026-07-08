import type { DecorName } from "@/components/ui/Decor"

// The Numbers & Counting module: 1–10, taught mostly by voice + touch.
// Counting objects come in two flavours the games mix freely:
//  - decor art (transparent 3D-Pixar PNGs, ideal for tap-to-count rows), and
//  - real photos already in /public/images (so the child counts *things they
//    have met* in the letter lessons — cats, ducks, elephants…).

export interface CountObject {
  /** Singular name — used for slugs and aria labels. */
  name: string
  /** Spoken plural, matching the generated "how many …" voice line slug. */
  plural: string
  /** Decor art name (transparent PNG) — set for decor objects. */
  decor?: DecorName
  /** Photo path under /public — set for photo objects. */
  image?: string
}

export interface NumberData {
  value: number
  word: string
  color: string
  bg: string
  /** The number's own counting object, used in the teach/count-along phases. */
  object: CountObject
}

// Real object cut-outs from the letter lessons (/images/things — transparent
// single-subject images the child already knows by name). House rule:
// teaching/counting content uses these REAL images only — the decor art was
// too abstract/cluttered for counting (David, July 2026). Every `plural` must
// have a matching generated "howmany/{plural}.mp3" line.
export const PHOTO_OBJECTS: CountObject[] = [
  { name: "cat", plural: "cats", image: "/images/things/cat.png" },
  { name: "dog", plural: "dogs", image: "/images/things/dog.png" },
  { name: "duck", plural: "ducks", image: "/images/things/duck.png" },
  { name: "rabbit", plural: "rabbits", image: "/images/things/rabbit.png" },
  { name: "elephant", plural: "elephants", image: "/images/things/elephant.png" },
  { name: "lion", plural: "lions", image: "/images/things/lion.png" },
  { name: "bee", plural: "bees", image: "/images/things/bee.png" },
  { name: "fish", plural: "fish", image: "/images/things/fish.png" },
  { name: "frog", plural: "frogs", image: "/images/things/frog.png" },
  { name: "bird", plural: "birds", image: "/images/things/bird.png" },
  { name: "apple", plural: "apples", image: "/images/things/apple.png" },
  { name: "banana", plural: "bananas", image: "/images/things/banana.png" },
  { name: "orange", plural: "oranges", image: "/images/things/orange.png" },
  { name: "mango", plural: "mangoes", image: "/images/things/mango.png" },
  { name: "egg", plural: "eggs", image: "/images/things/egg.png" },
  { name: "flower", plural: "flowers", image: "/images/things/flower.png" },
  { name: "ball", plural: "balls", image: "/images/things/ball.png" },
  { name: "car", plural: "cars", image: "/images/things/car.png" },
  { name: "cup", plural: "cups", image: "/images/things/cup.png" },
  { name: "tree", plural: "trees", image: "/images/things/tree.png" },
  { name: "sun", plural: "suns", image: "/images/things/sun2.png" },
]

export const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five",
  "six", "seven", "eight", "nine", "ten",
]

// Same joyful palette family the letter cards use.
const PALETTE: { color: string; bg: string }[] = [
  { color: "#FF6B6B", bg: "#FFE3E3" },
  { color: "#F59F00", bg: "#FFF3BF" },
  { color: "#40C057", bg: "#D3F9D8" },
  { color: "#22B8CF", bg: "#C5F6FA" },
  { color: "#4C6EF5", bg: "#DBE4FF" },
  { color: "#AE3EC9", bg: "#F3D9FA" },
  { color: "#E64980", bg: "#FFDEEB" },
  { color: "#12B886", bg: "#C3FAE8" },
  { color: "#FD7E14", bg: "#FFE8CC" },
  { color: "#7950F2", bg: "#E5DBFF" },
]

// Each number's own counting object (teach/count-along/tap-exactly). The
// spoken "tap-exactly" and "there-are" lines bake these plurals in — keep in
// sync with scripts/gen-numbers-audio.py PRIMARY.
const PRIMARY: string[] = [
  "lion", "cat", "duck", "rabbit", "apple",
  "banana", "fish", "flower", "frog", "bird",
]

export const NUMBERS: NumberData[] = Array.from({ length: 10 }, (_, i) => {
  const value = i + 1
  return {
    value,
    word: NUMBER_WORDS[value],
    ...PALETTE[i],
    object: PHOTO_OBJECTS.find((o) => o.name === PRIMARY[i]) ?? PHOTO_OBJECTS[i],
  }
})

export function numberByValue(value: number): NumberData | undefined {
  return NUMBERS.find((n) => n.value === value)
}

/** `count` distinct wrong answers near `value`, all within 1–10. */
export function nearbyNumbers(value: number, count: number): number[] {
  const pool = NUMBERS.map((n) => n.value).filter((v) => v !== value)
  // Prefer neighbours (harder, more instructive) but keep it shuffled.
  const sorted = pool.sort((a, b) => Math.abs(a - value) - Math.abs(b - value))
  const near = sorted.slice(0, Math.min(count + 2, sorted.length))
  for (let i = near.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[near[i], near[j]] = [near[j], near[i]]
  }
  return near.slice(0, count)
}
