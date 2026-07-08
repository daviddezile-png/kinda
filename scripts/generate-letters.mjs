// One-shot generator for all 26 letter data files (data/letters/{a..z}.json).
// Re-run with: node scripts/generate-letters.mjs
//
// Every word listed here MUST have real artwork: images resolve through
// lib/wordImages.ts (parsed below so there is one source of truth). Words with
// no art never enter the data, so no page ever renders a blank picture or a
// broken /images/... link. Word audio comes from /public/audio/words.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join } from "node:path"

// ── Artwork map, parsed from lib/wordImages.ts (single source of truth) ──
const wordImagesSrc = readFileSync(join(process.cwd(), "lib", "wordImages.ts"), "utf8")
const ART = {}
for (const m of wordImagesSrc.matchAll(/^\s*"?([a-z0-9 -]+)"?:\s*"(\/images\/image\/[^"]+)"/gm)) {
  ART[m[1]] = m[2]
}

const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
const artFor = (word) => ART[norm(word)] ?? ART[norm(word).split(" ")[0]]

function assertArt(word) {
  const img = artFor(word)
  if (!img) throw new Error(`No artwork for "${word}" — add it to lib/wordImages.ts first`)
  const file = join(process.cwd(), "public", img)
  if (!existsSync(file)) throw new Error(`Artwork file missing on disk: ${img}`)
  return img
}

// ── Letter → words. Only words with real artwork (see lib/wordImages.ts). ──
const LETTER_WORDS = {
  A: { words: ["Apple", "Ant", "Airplane"], color: "#FF6B6B", bg: "#FFF3E0" },
  B: { words: ["Ball", "Banana", "Bird"], color: "#4ECDC4", bg: "#E8F8F7" },
  C: { words: ["Cat", "Car", "Coconut"], color: "#45B7D1", bg: "#E8F4F8" },
  D: { words: ["Dog", "Door"], color: "#96CEB4", bg: "#F0F9F4" },
  E: { words: ["Egg"], color: "#E8B23A", bg: "#FFFDE7" },
  F: { words: ["Fish", "Flower"], color: "#DDA0DD", bg: "#F8F0FF" },
  G: { words: ["Goat", "Gate", "Guava"], color: "#5BBFA6", bg: "#F0FBF8" },
  H: { words: ["Hat", "Hen", "House"], color: "#D4AC0D", bg: "#FFFDE7" },
  I: { words: ["Ice Cream"], color: "#5DADE2", bg: "#EBF5FB" },
  J: { words: ["Juice", "Jacket"], color: "#E59866", bg: "#FEF9E7" },
  K: { words: ["Kite", "Key"], color: "#52BE80", bg: "#EAFAF1" },
  L: { words: ["Lollipop"], color: "#EC7063", bg: "#FDEDEC" },
  M: { words: ["Mango", "Milk"], color: "#A569BD", bg: "#F5EEF8" },
  N: { words: ["Net"], color: "#48C9B0", bg: "#E8F8F5" },
  O: { words: ["Orange"], color: "#F0A500", bg: "#FEF9E7" },
  P: { words: ["Pineapple", "Pen", "Papaya"], color: "#EC407A", bg: "#FCE4EC" },
  Q: { words: ["Queen"], color: "#7E57C2", bg: "#EDE7F6" },
  R: { words: ["Rice"], color: "#26C6DA", bg: "#E0F7FA" },
  S: { words: ["Sun", "Salt", "Shoe"], color: "#E8A90C", bg: "#FFF8E1" },
  T: { words: ["Tree", "Table", "Tomato"], color: "#66BB6A", bg: "#E8F5E9" },
  U: { words: ["Umbrella"], color: "#5C6BC0", bg: "#E8EAF6" },
  V: { words: ["Van"], color: "#EF5350", bg: "#FFEBEE" },
  W: { words: ["Water", "Watermelon", "Window"], color: "#42A5F5", bg: "#E3F2FD" },
  X: { words: ["X-ray"], color: "#AB47BC", bg: "#F3E5F5" },
  Y: { words: ["Yolk"], color: "#D4A60A", bg: "#FFF8E1" },
  Z: { words: ["Zebra", "Zip"], color: "#26A69A", bg: "#E0F2F1" },
}

// Shared wrong-answer / filler pool. Everything here has real artwork and a
// recording under /audio/words, so any game can borrow from it safely.
const POOL_WORDS = [
  "Bread", "Candy", "Chocolate", "Tomato", "Salt", "Yolk", "Tea", "Milk",
  "Hat", "Shoe", "Spoon", "Pen", "Table", "Window", "Door", "Gate", "Kite",
  "Car", "Jacket", "Toothbrush", "Bed", "Avocado", "Coconut", "Papaya",
]

const slug = (w) => w.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
const rotate = (arr, n) => arr.map((_, i) => arr[(i + n) % arr.length])

const wordObj = (w) => ({
  word: w,
  image: assertArt(w),
  audio: `/audio/words/${slug(w)}.mp3`,
})

const REWARDS = [
  { id: "candy", type: "food", name: "Candy", image: assertArt("Candy"), sound: "/audio/feedback/rewards/crunch.mp3", characterState: "nom_nom" },
  { id: "car", type: "toy", name: "Toy Car", image: assertArt("Car"), sound: "/audio/feedback/rewards/vroom.mp3", characterState: "excited" },
  { id: "ice_cream", type: "food", name: "Ice Cream", image: assertArt("Ice Cream"), sound: "/audio/feedback/rewards/slurp.mp3", characterState: "nom_nom" },
]

function buildLetter(L) {
  const lower = L.toLowerCase()
  const { words, color, bg } = LETTER_WORDS[L]
  const wordObjs = words.map(wordObj)
  const first = words[0]

  const pool = POOL_WORDS.filter((w) => w[0].toUpperCase() !== L)
  const distractors = pool.slice(0, 5).map((w) => ({ id: slug(w), word: w, image: assertArt(w) }))

  // Memory needs at least 3 pairs to be a real game — pad short letters from
  // the shared pool (matching pairs don't have to start with the letter).
  const memoryPairs = [...wordObjs]
  for (const w of pool) {
    if (memoryPairs.length >= 3) break
    memoryPairs.push(wordObj(w))
  }

  // Build-word wants short, letters-only words; fall back to the first word
  // with spaces/hyphens stripped (e.g. "X-ray" → "XRAY").
  const buildable = words.filter((w) => /^[A-Za-z]+$/.test(w) && w.length <= 6).slice(0, 2)
  const buildSource = buildable.length ? buildable : [first]
  const buildWords = buildSource.map((w) => ({
    word: w.toUpperCase().replace(/[^A-Z]/g, ""),
    image: assertArt(w),
    audio: `/audio/words/${slug(w)}.mp3`,
    extraLetters: ["B", "C", "D", "F", "M", "S"].filter((x) => x !== L).slice(0, 4),
  }))

  return {
    letter: L,
    lowercase: lower,
    color,
    backgroundColor: bg,
    letterAudio: `/audio/letters/names/${lower}.mp3`,
    characterSpeech: {
      intro: `/audio/speech/${lower}/intro.mp3`,
      touchPrompt: `/audio/speech/${lower}/touch-prompt.mp3`,
      celebration: `/audio/speech/${lower}/celebration.mp3`,
      lowercaseIntro: `/audio/speech/${lower}/lowercase-intro.mp3`,
    },
    words: wordObjs,
    song: {
      lyrics: `${L} is for ${first}! ${L}, ${L}, ${L}! Let's learn the letter ${L}!`,
      audio: `/audio/songs/${lower}-song.mp3`,
      lyricsLines: [
        // First blank is the word itself — the child picks the thing they just
        // learned. Choice order varies per letter so "first option" never wins.
        {
          line: `${L} is for ___`,
          blankWord: first,
          choices: rotate([first, pool[0], pool[1]], L.charCodeAt(0) % 3),
          timestamp: 2.5,
        },
        { line: `Letter ${L}, let's all ___`, blankWord: "sing", choices: ["sing", "cry", "sleep"], timestamp: 6.0 },
      ],
    },
    tracing: {
      uppercase: {
        canvasWidth: 320,
        canvasHeight: 320,
        transformImage: wordObjs[0].image,
        transformSound: "/audio/feedback/rewards/nom-nom.mp3",
      },
      lowercase: { canvasWidth: 320, canvasHeight: 320 },
    },
    games: {
      memory_cards: { pairs: memoryPairs },
      letter_puzzle: { svgPath: "", pieces: 4 },
      feed_character: { correctItems: wordObjs },
      build_word: { words: buildWords },
      match_picture: {
        rounds: wordObjs.map((w) => ({ letter: L, correctImage: w.image, correctWord: w.word })),
      },
    },
    distractors,
    rewards: REWARDS,
  }
}

const dir = join(process.cwd(), "data", "letters")
mkdirSync(dir, { recursive: true })

let count = 0
for (const L of Object.keys(LETTER_WORDS)) {
  writeFileSync(join(dir, `${L.toLowerCase()}.json`), JSON.stringify(buildLetter(L), null, 2) + "\n", "utf8")
  count++
}
console.log(`Generated ${count} letter files in data/letters/ — every image is real artwork`)
