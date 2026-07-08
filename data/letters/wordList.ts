// Word + color reference for all 26 letters (03-LETTER-DATA-STRUCTURE.md).
// Mirrors scripts/generate-letters.mjs: only words with real artwork in
// lib/wordImages.ts are listed, so letters have 1–3 words each.
export interface LetterWordEntry {
  words: string[]
  color: string
  bg: string
}

export const LETTER_WORDS: Record<string, LetterWordEntry> = {
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
