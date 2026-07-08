import { actionImagesFor, imageFor } from "@/lib/wordImages"
import { aloneAudioFor, actionAudioFor } from "@/lib/discoverPhrases"

// Every distinct object we have artwork for, grouped by its starting letter.
// Level 0 tours the whole set one picture at a time, so the child meets every
// object before the next stage. Images resolve through lib/wordImages
// (/images/things — transparent PNGs).
//
// Each word is a "thing" entry ("This is a/an X" — the teacher speaks this
// BEFORE the picture is revealed, see DiscoverGallery), optionally followed by
// an "action" entry (the object in a scene, its own line, shown directly).
// Voice lines are resolved by lib/discoverPhrases and recorded under
// /public/audio/discover.
//
// Words are only listed here when a transparent thing-picture exists — art
// still missing for some friends (lion's giraffe, tiger, …) stays out until
// their picture is added.

export interface LetterImage {
  word: string
  image: string
  audio: string
  /** "thing" = the object alone (teacher introduces it before it's shown);
   *  "action" = the object in a scene (already introduced, shown directly). */
  kind: "thing" | "action"
}

// Every word here must have a matching action scene (lib/wordImages ACTIONS) —
// a "thing" alone with no action image is dropped rather than shown bare.
const WORDS_BY_LETTER: Record<string, string[]> = {
  A: ["Apple", "Ant", "Airplane"],
  B: ["Ball", "Banana", "Bird", "Bed", "Bread"],
  C: ["Cat", "Car", "Chicken", "Chocolate", "Coconut"],
  D: ["Dog", "Door", "Duck"],
  E: ["Egg", "Elephant"],
  F: ["Fish", "Flower", "Frog"],
  G: ["Goat", "Gate", "Guava", "Glass"],
  H: ["Hen", "Hat", "House"],
  I: ["Ice cream"],
  J: ["Juice", "Jacket"],
  K: ["Key", "Kite"],
  L: ["Lollipop", "Lion"],
  M: ["Mango", "Milk"],
  N: ["Net"],
  O: ["Orange", "Owl"],
  P: ["Pineapple", "Pen", "Papaya"],
  Q: ["Queen"],
  R: ["Rice", "Rabbit"],
  S: ["Shoe", "Spoon", "Sun"],
  T: ["Tree", "Table", "Tea", "Tomato", "Toothbrush"],
  U: ["Umbrella"],
  V: ["Van"],
  W: ["Water", "Watermelon", "Window"],
  X: ["X-ray"],
  Y: ["Yolk", "Yam"],
  Z: ["Zebra", "Zip"],
}

/** Uppercase letters that have at least one picture. */
export function lettersWithImages(): string[] {
  return Object.keys(WORDS_BY_LETTER)
}

/** All pictures for a letter that actually resolve to a real file. */
export function imagesForLetter(letter: string): LetterImage[] {
  const words = WORDS_BY_LETTER[letter.toUpperCase()] ?? []
  return words
    .map((word) => ({ word, image: imageFor(word) ?? "", audio: aloneAudioFor(word), kind: "thing" as const }))
    .filter((it) => it.image !== "")
}

// Every distinct picture in the system, flattened in letter order (all letters
// when no order is given). Level 0 tours this whole set one picture at a time so
// the child meets every object before moving on. Each thing is followed by its
// ACTION scene when one exists (lollipop → eating a lollipop), with its own
// "the child is eating a lollipop" line. Entries whose file is missing are
// dropped by imagesForLetter, so nothing renders blank.
export function allLetterImages(order?: string[]): LetterImage[] {
  const letters = (order?.length ? order : lettersWithImages()).map((l) => l.toUpperCase())
  const seen = new Set<string>()
  const out: LetterImage[] = []
  for (const letter of letters) {
    for (const img of imagesForLetter(letter)) {
      if (seen.has(img.word)) continue
      seen.add(img.word)
      out.push(img)
      const actionAudio = actionAudioFor(img.word)
      for (const action of actionImagesFor(img.word)) {
        out.push({ ...img, image: action, kind: "action", audio: actionAudio ?? img.audio })
      }
    }
  }
  return out
}
