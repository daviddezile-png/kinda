// The animal/fruit characters a child picks as their profile ("who am I").
// Stored on Student.avatar as the character `id`. Rendering goes through
// <Picture> (components/ui/Picture.tsx), which shows `image` when present and
// falls back to a matching emoji, so a missing file still renders a friendly
// face. Add a character by dropping art in /public/images and adding a row here.

export interface Character {
  id: string
  label: string
  image: string
  /** Emoji shown if the image is missing (else <Picture> derives one). */
  emoji?: string
}

// Profile pictures are ANIMALS ONLY, and only ones with transparent-background
// artwork under /images/things (house rule — no fruit/objects as "who am I").
export const CHARACTERS: Character[] = [
  { id: "cat", label: "Cat", image: "/images/things/cat.png", emoji: "🐱" },
  { id: "dog", label: "Dog", image: "/images/things/dog.png", emoji: "🐶" },
  { id: "duck", label: "Duck", image: "/images/things/duck.png", emoji: "🦆" },
  { id: "elephant", label: "Elephant", image: "/images/things/elephant.png", emoji: "🐘" },
  { id: "fish", label: "Fish", image: "/images/things/fish.png", emoji: "🐟" },
  { id: "frog", label: "Frog", image: "/images/things/frog.png", emoji: "🐸" },
  { id: "giraffe", label: "Giraffe", image: "/images/things/giraffe.png", emoji: "🦒" },
  { id: "goat", label: "Goat", image: "/images/things/goat.png", emoji: "🐐" },
  { id: "hen", label: "Hen", image: "/images/things/hen.png", emoji: "🐔" },
  { id: "lion", label: "Lion", image: "/images/things/lion.png", emoji: "🦁" },
  { id: "owl", label: "Owl", image: "/images/things/owl.png", emoji: "🦉" },
  { id: "penguin", label: "Penguin", image: "/images/things/penguin.png", emoji: "🐧" },
  { id: "rabbit", label: "Rabbit", image: "/images/things/rabbit.png", emoji: "🐰" },
  { id: "tiger", label: "Tiger", image: "/images/things/tiger.png", emoji: "🐯" },
  { id: "zebra", label: "Zebra", image: "/images/things/zebra.png", emoji: "🦓" },
  { id: "butterfly", label: "Butterfly", image: "/images/things/butterfly.png", emoji: "🦋" },
]

// Old fruit avatar ids some students still have saved in the DB. Profiles must
// only ever SHOW animals, so each legacy fruit id resolves to a fixed animal
// (stable per id, so the child keeps seeing the same character every day).
const LEGACY_TO_ANIMAL: Record<string, string> = {
  apple: "cat",
  banana: "giraffe",
  mango: "lion",
  orange: "tiger",
  avocado: "frog",
}

const BY_ID = new Map(CHARACTERS.map((c) => [c.id, c]))
for (const [legacy, animal] of Object.entries(LEGACY_TO_ANIMAL)) {
  const ch = BY_ID.get(animal)
  if (ch) BY_ID.set(legacy, ch)
}

/** Look up a character by id (the value stored on Student.avatar). */
export function characterById(id?: string | null): Character | undefined {
  return id ? BY_ID.get(id) : undefined
}

export const DEFAULT_CHARACTER = CHARACTERS[0]
