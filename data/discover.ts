import type { DiscoveryWord } from "@/types"

// Word Journey ("See & Know") content, keyed by uppercase letter. Centralised
// here (like data/distractors.ts) instead of per-letter JSON so the realistic
// photo sets the content author dropped in /public/images can be wired up in
// one place. The Word Journey is a standalone exploration mode (see
// /student/journey), independent of the letters/numbers progression.
//
// Each word shows 2–3 large pictures (object → action → reaction). NO text/letter
// is shown to the child; `word` is only used for the quiz alt text + audio.
// `audioEn` on each picture points at the matching recording under
// /public/audio/discover (…-alone = the object, …-action = it in a sentence).
export const DISCOVER: Record<string, DiscoveryWord> = {
  A: { word: "Apple", images: [
    { image: "/images/things/apple.png", audioEn: "/audio/discover/apple-alone.mp3" },
    { image: "/images/actions/eat-apple.jpg", audioEn: "/audio/discover/apple-action.mp3" },
  ], quizDistractors: ["Banana", "Fish"] },

  B: { word: "Banana", images: [
    { image: "/images/things/banana.png", audioEn: "/audio/discover/banana-alone.mp3" },
    { image: "/images/actions/banana-monkey-eat.png", audioEn: "/audio/discover/banana-action.mp3" },
  ], quizDistractors: ["Mango", "Dog"] },

  C: { word: "Chicken", images: [
    { image: "/images/things/hen.png", audioEn: "/audio/discover/chicken-alone.mp3" },
  ], quizDistractors: ["Apple", "Fish"] },

  D: { word: "Dog", images: [
    { image: "/images/things/dog.png", audioEn: "/audio/discover/dog-alone.mp3" },
    { image: "/images/actions/dog-run.png", audioEn: "/audio/discover/dog-action.mp3" },
  ], quizDistractors: ["Apple", "Fish"] },

  E: { word: "Egg", images: [
    { image: "/images/things/egg.png", audioEn: "/audio/discover/egg-alone.mp3" },
    { image: "/images/actions/hen-laying-egg.png", audioEn: "/audio/discover/egg-action.mp3" },
  ], quizDistractors: ["Banana", "Mango"] },

  F: { word: "Fish", images: [
    { image: "/images/things/fish.png", audioEn: "/audio/discover/fish-alone.mp3" },
    { image: "/images/actions/swim-fish.jpg", audioEn: "/audio/discover/fish-action.mp3" },
  ], quizDistractors: ["Apple", "Goat"] },

  G: { word: "Goat", images: [
    { image: "/images/things/goat.png", audioEn: "/audio/discover/goat-alone.mp3" },
  ], quizDistractors: ["Mango", "Fish"] },

  H: { word: "House", images: [
    { image: "/images/things/house.png", audioEn: "/audio/discover/house-alone.mp3" },
  ], quizDistractors: ["Mango", "Dog"] },

  I: { word: "Ice cream", images: [
    { image: "/images/things/icecream.png", audioEn: "/audio/discover/icecream-alone.mp3" },
    { image: "/images/actions/eat-icecream.jpg", audioEn: "/audio/discover/icecream-action.mp3" },
     // reaction: the child enjoying it
  ], quizDistractors: ["Banana", "Fish"] },

  J: { word: "Juice", images: [
    { image: "/images/things/juice.png", audioEn: "/audio/discover/juice-alone.mp3" },
    { image: "/images/actions/drink-juice.jpg", audioEn: "/audio/discover/juice-action.mp3" },
    { image: "/images/actions/drink-juice-2.png" }, // reaction: another sip, no narration
  ], quizDistractors: ["Apple", "Goat"] },

  K: { word: "Key", images: [
    { image: "/images/things/key.png", audioEn: "/audio/discover/key-alone.mp3" },
    { image: "/images/actions/open-door-key.jpg", audioEn: "/audio/discover/key-action.mp3" },
  ], quizDistractors: ["Apple", "Fish"] },

  L: { word: "Lollipop", images: [
    { image: "/images/things/lollipop.png", audioEn: "/audio/discover/lollipop-alone.mp3" },
    { image: "/images/actions/eat-lollipop-2.png" }, // action: licking it (no recording yet)
  ], quizDistractors: ["Fish", "Dog"] },

  M: { word: "Mango", images: [
    { image: "/images/things/mango.png", audioEn: "/audio/discover/mango-alone.mp3" },
    { image: "/images/actions/eat-mango.jpg", audioEn: "/audio/discover/mango-action.mp3" },
  ], quizDistractors: ["Banana", "Fish"] },

  N: { word: "Net", images: [
    { image: "/images/things/mosquito-net.png", audioEn: "/audio/discover/net-alone.mp3" },
    { image: "/images/things/fishing-net.png", audioEn: "/audio/discover/net-action.mp3" },
    { image: "/images/actions/cath-fish-net.jpg" }, // action: catching fish with it
  ], quizDistractors: ["Apple", "Dog"] },

  O: { word: "Orange", images: [
    { image: "/images/things/orange.png", audioEn: "/audio/discover/orange-alone.mp3" },
  ], quizDistractors: ["Banana", "Fish"] },

  P: { word: "Pineapple", images: [
    { image: "/images/things/pineapple.png", audioEn: "/audio/discover/pineapple-alone.mp3" },
    { image: "/images/actions/eat-pineapple.jpg", audioEn: "/audio/discover/pineapple-action.mp3" },
  ], quizDistractors: ["Mango", "Dog"] },

  Q: { word: "Queen", images: [
    { image: "/images/things/queen.png", audioEn: "/audio/discover/queen-alone.mp3" },
  ], quizDistractors: ["Apple", "Fish"] },

  R: { word: "Rice", images: [
    { image: "/images/things/rice.png", audioEn: "/audio/discover/rice-alone.mp3" },
    { image: "/images/actions/family-eat-rice.jpg", audioEn: "/audio/discover/rice-action.mp3" },
  ], quizDistractors: ["Mango", "Fish"] },

  S: { word: "Sun", images: [
    { image: "/images/things/sun.jpg", audioEn: "/audio/discover/sun-alone.mp3" },
    { image: "/images/actions/looking-sun.png", audioEn: "/audio/discover/sun-action.mp3" },
  ], quizDistractors: ["Apple", "Dog"] },

  T: { word: "Tree", images: [
    { image: "/images/things/tree.png", audioEn: "/audio/discover/tree-alone.mp3" },
    { image: "/images/things/bird.png", audioEn: "/audio/discover/tree-action.mp3" },
  ], quizDistractors: ["Sun", "Fish"] },

  U: { word: "Umbrella", images: [
    { image: "/images/things/umbrella.png", audioEn: "/audio/discover/umbrella-alone.mp3" },
    { image: "/images/actions/child-umbrella.jpg", audioEn: "/audio/discover/umbrella-action.mp3" },
  ], quizDistractors: ["Mango", "Fish"] },

  V: { word: "Van", images: [
    { image: "/images/things/van.png", audioEn: "/audio/discover/van-alone.mp3" },
    { image: "/images/actions/van-move.png", audioEn: "/audio/discover/van-action.mp3" },
  ], quizDistractors: ["Apple", "Goat"] },

  W: { word: "Water", images: [
    { image: "/images/things/water.png", audioEn: "/audio/discover/water-alone.mp3" },
    { image: "/images/actions/drink-water.jpg", audioEn: "/audio/discover/water-action.mp3" },
  ], quizDistractors: ["Mango", "Dog"] },

  X: { word: "X-ray", images: [
    { image: "/images/things/x-ray.png", audioEn: "/audio/discover/xray-alone.mp3" },
  ], quizDistractors: ["Apple", "Sun"] },

  Y: { word: "Yolk", images: [
    { image: "/images/things/yolk.png", audioEn: "/audio/words/yolk.mp3" },
    { image: "/images/things/egg.png", audioEn: "/audio/discover/egg-alone.mp3" },
  ], quizDistractors: ["Mango", "Fish"] },

  Z: { word: "Zebra", images: [
    { image: "/images/things/zebra.png", audioEn: "/audio/discover/zebra-alone.mp3" },
  ], quizDistractors: ["Apple", "Banana"] },
}

export interface DiscoverItem extends DiscoveryWord {
  letter: string // uppercase
}

// Every item that has Discover content, in the given order (falls back to all).
// Used by the Word Journey gallery so the child tours ALL items in one sitting
// (item → item in action → next item) instead of one letter at a time.
export function discoverItems(order?: string[]): DiscoverItem[] {
  const letters = (order?.length ? order : Object.keys(DISCOVER)).map((l) => l.toUpperCase())
  const seen = new Set<string>()
  const items: DiscoverItem[] = []
  for (const letter of letters) {
    const word = DISCOVER[letter]
    if (word && !seen.has(letter)) {
      seen.add(letter)
      items.push({ letter, ...word })
    }
  }
  return items
}
