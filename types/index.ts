// Shared types for Kinda. See elimu-yangu-specs/03-LETTER-DATA-STRUCTURE.md

export interface LetterWord {
  word: string
  image: string
  audio: string
}

export interface GuideDot {
  x: number
  y: number
}

export interface TracingSection {
  id: string
  path: string
  guideDots: GuideDot[]
  reward: string
}

export interface TracingData {
  canvasWidth?: number
  canvasHeight?: number
  // Legacy per-stroke data (letter A). Newer letters use glyph-based coverage
  // tracing, so these are optional.
  sections?: TracingSection[]
  transformImage?: string
  transformSound?: string
}

export type RewardType = "food" | "toy"

export interface Reward {
  id: string
  type: RewardType
  name: string
  image: string
  /** Transparent emoji fallback when there is no no-background artwork. */
  emoji?: string
  characterState: string
}

export interface Distractor {
  id: string
  image: string
  word: string
}

export interface LyricsLine {
  line: string
  blankWord: string
  choices: string[]
  timestamp: number
}

export interface Song {
  lyrics: string
  audio: string
  lyricsLines: LyricsLine[]
}

export interface CharacterSpeech {
  intro: string
  touchPrompt: string
  celebration: string
  lowercaseIntro: string
}

export interface BuildWordItem {
  word: string
  image: string
  audio: string
  extraLetters: string[]
}

export interface MatchPictureRound {
  letter: string
  correctImage: string
  correctWord: string
}

export interface LetterGames {
  memory_cards: { pairs: LetterWord[] }
  letter_puzzle: { svgPath: string; pieces: number }
  feed_character: { correctItems: LetterWord[] }
  build_word: { words: BuildWordItem[] }
  match_picture: { rounds: MatchPictureRound[] }
}

export interface LetterData {
  letter: string
  lowercase: string
  color: string
  backgroundColor: string
  letterAudio: string
  characterSpeech: CharacterSpeech
  words: LetterWord[]
  song: Song
  tracing: {
    uppercase: TracingData
    lowercase: TracingData
  }
  games: LetterGames
  distractors: Distractor[]
  rewards: Reward[]
}

// Step 0 "Discover" / See & Know (12-STEP0-DISCOVER-MODIFICATION.md).
// Independent from tracing (Step 3) — object recognition, no letters/writing.
export interface DiscoveryImage {
  image: string
  audioEn?: string
  audioSw?: string
}

export interface DiscoveryWord {
  word: string
  images: DiscoveryImage[] // 2–3 sequential pictures (object, action, reaction)
  quizDistractors: string[] // words of OTHER objects for the "What did you see?" quiz
}

// Mascot ("Madam") animation states. Each maps to a flip-book of 3D-character
// PNG frames under public/images/character/3d/ (see scripts/gen-3d-character.py
// and components/character/Character3D.tsx).
export type CharacterState =
  | "welcome"
  | "idle"
  | "teaching"
  | "pointing"
  | "sad"
  | "happy"
  | "excited"
  | "celebrating"
  | "nom_nom"
  | "watching"

// A selectable image used in recognition / game rounds.
export interface ImageItem {
  id?: string
  word: string
  image: string
  audio?: string
  isCorrect: boolean
}
