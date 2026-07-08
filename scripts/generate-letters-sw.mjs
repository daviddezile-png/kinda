// Generates Swahili letter data (data/letters/sw/{a..z}.json).
// Q and X are not native to Swahili, so they are skipped and fall back to the
// English data at runtime. Re-run with: node scripts/generate-letters-sw.mjs
//
// Swahili words share the English artwork pool (lib/wordImages.ts) via the
// SW_ART table below (Embe → mango, Mbwa → dog, …). Words with no artwork get
// image "" — <Picture> renders nothing rather than firing a 404 — and are
// ordered after art-backed words so the tracing/transform image is always real.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join } from "node:path"

// ── Artwork map, parsed from lib/wordImages.ts (single source of truth) ──
const wordImagesSrc = readFileSync(join(process.cwd(), "lib", "wordImages.ts"), "utf8")
const ART = {}
for (const m of wordImagesSrc.matchAll(/^\s*"?([a-z0-9 -]+)"?:\s*"(\/images\/image\/[^"]+)"/gm)) {
  ART[m[1]] = m[2]
}

// Swahili word → English artwork key in lib/wordImages.ts.
const SW_ART = {
  Aiskrimu: "icecream", Chai: "tea", Chungwa: "orange", Dirisha: "window",
  Embe: "mango", Eropleni: "airplane", Funguo: "key", Gari: "car", Jua: "sun",
  Kuku: "hen", Kalamu: "pen", Mbwa: "dog", Mti: "tree", Mpira: "ball",
  Nyumba: "house", Nazi: "coconut", Paka: "cat", Parachichi: "avocado",
  Samaki: "fish", Tofaa: "apple", Ua: "flower", Ufunguo: "key", Viatu: "shoe",
  Yai: "egg", Zebra: "zebra",
}

function artFor(word) {
  const key = SW_ART[word]
  if (!key) return ""
  const img = ART[key]
  if (!img) throw new Error(`SW_ART "${word}" → "${key}" not in lib/wordImages.ts`)
  if (!existsSync(join(process.cwd(), "public", img))) throw new Error(`Missing on disk: ${img}`)
  return img
}

// Colours mirror the English set so a letter looks the same in both languages.
const STYLE = {
  A: ["#FF6B6B", "#FFF3E0"], B: ["#4ECDC4", "#E8F8F7"], C: ["#45B7D1", "#E8F4F8"],
  D: ["#96CEB4", "#F0F9F4"], E: ["#E8B23A", "#FFFDE7"], F: ["#DDA0DD", "#F8F0FF"],
  G: ["#5BBFA6", "#F0FBF8"], H: ["#D4AC0D", "#FFFDE7"], I: ["#5DADE2", "#EBF5FB"],
  J: ["#E59866", "#FEF9E7"], K: ["#52BE80", "#EAFAF1"], L: ["#EC7063", "#FDEDEC"],
  M: ["#A569BD", "#F5EEF8"], N: ["#48C9B0", "#E8F8F5"], O: ["#F0A500", "#FEF9E7"],
  P: ["#EC407A", "#FCE4EC"], R: ["#26C6DA", "#E0F7FA"], S: ["#E8A90C", "#FFF8E1"],
  T: ["#66BB6A", "#E8F5E9"], U: ["#5C6BC0", "#E8EAF6"], V: ["#EF5350", "#FFEBEE"],
  W: ["#42A5F5", "#E3F2FD"], Y: ["#D4A60A", "#FFF8E1"], Z: ["#26A69A", "#E0F2F1"],
}

// Art-backed words first — the first word doubles as the tracing reward image.
const WORDS_SW = {
  A: ["Aiskrimu", "Asali", "Askari"],
  B: ["Bata", "Bendera", "Baiskeli"],
  C: ["Chai", "Chungwa", "Chura"],
  D: ["Dirisha", "Duka", "Daftari"],
  E: ["Embe", "Eropleni", "Elimu"],
  F: ["Funguo", "Farasi", "Fisi"],
  G: ["Gari", "Gitaa", "Glasi"],
  H: ["Hema", "Hospitali", "Herufi"],
  I: ["Inzi", "Ikulu", "Injini"],
  J: ["Jua", "Jani", "Jiko"],
  K: ["Kuku", "Kalamu", "Kiti"],
  L: ["Limau", "Lori", "Leso"],
  M: ["Mbwa", "Mti", "Mpira"],
  N: ["Nyumba", "Nazi", "Nyoka"],
  O: ["Ofisi", "Oveni", "Orodha"],
  P: ["Paka", "Parachichi", "Pesa"],
  R: ["Redio", "Rangi", "Reli"],
  S: ["Samaki", "Saa", "Simba"],
  T: ["Tofaa", "Tembo", "Treni"],
  U: ["Ua", "Ufunguo", "Uma"],
  V: ["Viatu", "Vitabu", "Vikombe"],
  W: ["Wimbo", "Watoto", "Wingu"],
  Y: ["Yai", "Yoyo", "Yungi"],
  Z: ["Zebra", "Zawadi", "Ziwa"],
}

// Shared wrong-answer pool: everyday objects with Swahili names whose artwork
// exists (paths via the English art map, so nothing here can 404).
const SW_POOL = [
  ["Nyanya", "tomato"], ["Chumvi", "salt"], ["Kijiko", "spoon"], ["Kofia", "hat"],
  ["Kiatu", "shoe"], ["Meza", "table"], ["Mlango", "door"], ["Maziwa", "milk"],
  ["Mwavuli", "umbrella"], ["Mswaki", "toothbrush"], ["Geti", "gate"],
  ["Koti", "jacket"], ["Kishada", "kite"], ["Peremende", "candy"],
].map(([word, key]) => ({ word, image: ART[key] }))

const REWARDS = [
  { id: "candy", type: "food", name: "Peremende", image: ART.candy, sound: "/audio/rewards/crunch.mp3", characterState: "nom_nom" },
  { id: "car", type: "toy", name: "Gari", image: ART.car, sound: "/audio/rewards/vroom.mp3", characterState: "excited" },
  { id: "ice_cream", type: "food", name: "Aiskrimu", image: ART.icecream, sound: "/audio/rewards/slurp.mp3", characterState: "nom_nom" },
]

const slug = (w) => w.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

function buildLetter(L) {
  const lower = L.toLowerCase()
  const [color, bg] = STYLE[L]
  const words = WORDS_SW[L]
  const first = words[0]
  const wordObjs = words.map((w) => ({
    word: w,
    image: artFor(w),
    audio: `/audio/sw/letters/${lower}/${slug(w)}.mp3`,
  }))
  const artWords = wordObjs.filter((w) => w.image !== "")

  const pool = SW_POOL.filter((d) => d.word[0].toUpperCase() !== L)
  const distractors = pool.slice(0, 5).map((d) => ({ id: slug(d.word), word: d.word, image: d.image }))

  // Picture-driven games only ever see art-backed content; pad memory pairs
  // from the pool so it is a real game even when the letter has little art.
  const memoryPairs = [...artWords]
  for (const d of pool) {
    if (memoryPairs.length >= 3) break
    memoryPairs.push({ word: d.word, image: d.image, audio: `/audio/sw/words/${slug(d.word)}.mp3` })
  }

  // Prefer art-backed words for build-word; fall back to the letter's words.
  const buildSource = (artWords.length ? artWords : wordObjs).slice(0, 2)
  const buildWords = buildSource.map((w) => ({
    word: w.word.toUpperCase().replace(/[^A-Z]/g, ""),
    image: w.image,
    audio: w.audio,
    extraLetters: ["B", "K", "M", "S", "T", "L"].filter((x) => x !== L).slice(0, 4),
  }))

  return {
    letter: L,
    lowercase: lower,
    color,
    backgroundColor: bg,
    letterAudio: `/audio/sw/letters/${lower}/letter-${lower}.mp3`,
    characterSpeech: {
      intro: `/audio/sw/speech/${lower}/intro.mp3`,
      touchPrompt: `/audio/sw/speech/${lower}/touch-prompt.mp3`,
      celebration: `/audio/sw/speech/${lower}/celebration.mp3`,
      lowercaseIntro: `/audio/sw/speech/${lower}/lowercase-intro.mp3`,
    },
    words: wordObjs,
    song: {
      lyrics: `${L} ni ya ${first}! ${L}, ${L}, ${L}! Tujifunze herufi ${L}!`,
      audio: `/audio/sw/songs/${lower}-song.mp3`,
      lyricsLines: [
        { line: `${L} ni ya ___`, blankWord: first, choices: [first, pool[0].word, pool[1].word], timestamp: 2.5 },
        { line: `Herufi ${L}, tuimbe ___`, blankWord: "pamoja", choices: ["pamoja", "peke", "kimya"], timestamp: 6.0 },
      ],
    },
    tracing: {
      uppercase: {
        canvasWidth: 320,
        canvasHeight: 320,
        transformImage: (artWords[0] ?? memoryPairs[0]).image,
        transformSound: "/audio/rewards/nom-nom.mp3",
      },
      lowercase: { canvasWidth: 320, canvasHeight: 320 },
    },
    games: {
      memory_cards: { pairs: memoryPairs },
      letter_puzzle: { svgPath: "", pieces: 4 },
      // Only art-backed items can fall/be fed — GameSelector skips the game
      // for letters where this is empty.
      feed_character: { correctItems: artWords },
      build_word: { words: buildWords },
      match_picture: {
        rounds: artWords.map((w) => ({ letter: L, correctImage: w.image, correctWord: w.word })),
      },
    },
    distractors,
    rewards: REWARDS,
  }
}

const dir = join(process.cwd(), "data", "letters", "sw")
mkdirSync(dir, { recursive: true })

let count = 0
for (const L of Object.keys(WORDS_SW)) {
  writeFileSync(join(dir, `${L.toLowerCase()}.json`), JSON.stringify(buildLetter(L), null, 2) + "\n", "utf8")
  count++
}
console.log(`Generated ${count} Swahili letter files in data/letters/sw/ (Q, X fall back to English)`)
