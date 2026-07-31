// Word-building module ("Words" world) — the child joins letters into whole
// words, pronounces them, writes them, and reads them, up to five simple words
// per letter. Every word here MUST have real artwork (the product only shows
// real pictures — see components/ui/Picture.tsx / lib/wordImages.ts), so a
// letter's set is only as long as the pictures we actually have (a few letters
// have just 1–3). Audio for each word is a /audio/words/<slug>.mp3 clip
// (generate any missing ones with scripts/gen-words-audio.py). Colours cycle a
// calm palette that matches the letters/numbers worlds.

export interface WordSet {
  /** Capital letter this set belongs to. */
  letter: string
  color: string
  bg: string
  /** Simple words that start with the letter — lowercase; picture + voice each. */
  words: string[]
}

// Words per letter — short, simple, and every one has real artwork on disk.
// To add more: drop the PNG into public/images/things, add a line to
// lib/wordImages.ts, extend the list here, and re-run scripts/gen-words-audio.py.
const WORDS_BY_LETTER: Record<string, string[]> = {
  A: ["ant", "apple", "avocado", "airplane", "antelope"],
  B: ["ball", "banana", "bird", "bed", "bread"],
  C: ["cat", "car", "cup", "cow", "candy"],
  D: ["dog", "duck", "door", "dolphin", "donkey"],
  E: ["egg", "eagle", "elephant"],
  F: ["fish", "frog", "fox", "flower", "flamingo"],
  G: ["goat", "gate", "glass", "guava", "goose"],
  H: ["hat", "hen", "house", "horse", "honey"],
  I: ["iguana", "icecream"],
  J: ["juice", "jacket", "jaguar", "jellyfish"],
  K: ["key", "kite", "koala", "kitten", "kangaroo"],
  L: ["lion", "lemon", "lamb", "lizard", "lollipop"],
  M: ["mango", "milk", "mouse", "mosquito"],
  N: ["net", "newt"],
  O: ["owl", "orange", "oil", "octopus", "ostrich"],
  P: ["pen", "puppy", "papaya", "parrot", "penguin"],
  Q: ["queen", "quail", "quacker"],
  R: ["rat", "rice", "rabbit", "rooster"],
  S: ["sun", "shoe", "snake", "spoon", "spider"],
  T: ["tree", "tiger", "table", "tomato", "turtle"],
  U: ["urial", "umbrella"],
  V: ["van", "vole", "viper", "vulture"],
  W: ["water", "wolf", "whale", "wasp", "window"],
  X: ["xray"],
  Y: ["yam", "yak", "yolk", "yogurt"],
  Z: ["zebra", "zip", "zonkey", "zorro"],
}

const PALETTE: Array<[string, string]> = [
  ["#FF6B6B", "#FFE3E3"],
  ["#4C6EF5", "#DBE4FF"],
  ["#12B886", "#C3FAE8"],
  ["#F783AC", "#FFDEEB"],
  ["#F59F00", "#FFF3BF"],
  ["#7048E8", "#E5DBFF"],
  ["#1098AD", "#C5F6FA"],
  ["#E8590C", "#FFE8CC"],
]

export const WORD_SETS: WordSet[] = Object.entries(WORDS_BY_LETTER).map(
  ([letter, words], i) => {
    const [color, bg] = PALETTE[i % PALETTE.length]
    return { letter, color, bg, words }
  },
)

const BY_LETTER: Record<string, WordSet> = Object.fromEntries(
  WORD_SETS.map((s) => [s.letter, s]),
)

/** The letters that have a word set, in order — drives the Words map. */
export const WORD_LETTERS: string[] = WORD_SETS.map((s) => s.letter)

/** The word set for a letter (case-insensitive), or undefined if none yet. */
export function wordSetFor(letter: string): WordSet | undefined {
  return BY_LETTER[letter.toUpperCase()]
}

/** Just the words for a letter (empty if none). */
export function wordsForLetter(letter: string): string[] {
  return wordSetFor(letter)?.words ?? []
}
