import type { Distractor } from "@/types"

// Wrong-answer images shared across all letters (03-LETTER-DATA-STRUCTURE.md).
// Games (FeedCharacter, CatchBucket, MatchPicture, RecognitionGame) filter this
// pool to items whose word does NOT start with the target letter, so a broad,
// varied set of everyday objects works best. Each `image` points at a real photo
// under /public/images/image; <Picture> falls back to an emoji if a file is ever
// missing. The "eat-<food>" shots double as the object picture for those foods.
export const DISTRACTORS: Distractor[] = [
  { id: "bread", word: "Bread", image: "/images/actions/eat-bread.jpg" },
  { id: "candy", word: "Candy", image: "/images/things/candy.png" },
  { id: "chocolate", word: "Chocolate", image: "/images/actions/eat-chocolate.jpg" },
  { id: "coconut", word: "Coconut", image: "/images/actions/man-cut-coconut.jpg" },
  { id: "guava", word: "Guava", image: "/images/actions/eat-guava.jpg" },
  { id: "papaya", word: "Papaya", image: "/images/actions/mother-prepare-papaya.jpg" },
  { id: "tomato", word: "Tomato", image: "/images/things/tomato.png" },
  { id: "salt", word: "Salt", image: "/images/things/salt.png" },
  { id: "yolk", word: "Yolk", image: "/images/things/yolk.png" },
  { id: "tea", word: "Tea", image: "/images/things/tea.png" },
  { id: "milk", word: "Milk", image: "/images/things/milk.png" },
  { id: "hat", word: "Hat", image: "/images/things/hat.png" },
  { id: "shoe", word: "Shoe", image: "/images/things/shoe.png" },
  { id: "spoon", word: "Spoon", image: "/images/things/spoon.png" },
  { id: "pen", word: "Pen", image: "/images/things/pen.png" },
  { id: "table", word: "Table", image: "/images/things/table.png" },
  { id: "window", word: "Window", image: "/images/things/window.png" },
  { id: "door", word: "Door", image: "/images/things/door.png" },
  { id: "gate", word: "Gate", image: "/images/things/gate.png" },
  { id: "kite", word: "Kite", image: "/images/things/kite.png" },
  { id: "car", word: "Car", image: "/images/things/car.png" },
  { id: "jacket", word: "Jacket", image: "/images/things/jacket.png" },
  { id: "toothbrush", word: "Toothbrush", image: "/images/things/toothbrush.png" },
]
