import type { Reward } from "@/types"

// Shared gift pool used across all letters and games (07-STEP4-GAMES.md).
// Gifts must read cleanly when they pop up over the scene, so every entry uses a
// real transparent (no-background) PNG that exists on disk, and its `name`
// resolves to a recorded word clip (/public/audio/words) so the teacher can
// announce it — "You get an apple!". We never fall back to an emoji/icon, so a
// gift without real artwork is simply left out of the pool.
export const ALL_REWARDS: Reward[] = [
  { id: "apple_gift", type: "food", name: "Apple", image: "/images/things/apple.png", characterState: "nom_nom" },
  { id: "banana_gift", type: "food", name: "Banana", image: "/images/things/banana.png", characterState: "nom_nom" },
  { id: "ice_cream", type: "food", name: "Ice Cream", image: "/images/things/icecream.png", characterState: "nom_nom" },
  { id: "candy", type: "food", name: "Candy", image: "/images/things/candy.png", characterState: "nom_nom" },
  { id: "lollipop", type: "food", name: "Lollipop", image: "/images/things/lollipop.png", characterState: "nom_nom" },
  { id: "mango_gift", type: "food", name: "Mango", image: "/images/things/mango.png", characterState: "nom_nom" },
  { id: "orange_gift", type: "food", name: "Orange", image: "/images/things/orange.png", characterState: "nom_nom" },
]
