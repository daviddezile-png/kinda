import type { GalleryFrame } from "@/components/discover/DiscoverGallery"

// The Animal Journey's picture set — every animal we have real cut-out art
// for (/public/images/things), toured the same voice-first way as the Word
// Journey ("This is a/an X."). `slug` matches the generated audio file under
// /public/audio/discover/animals/{slug}-alone.mp3 (scripts/gen-animal-journey-audio.py).
export interface AnimalItem {
  name: string
  slug: string
  image: string
}

export const ANIMALS: AnimalItem[] = [
  { name: "Ant", slug: "ant", image: "/images/things/ant.png" },
  { name: "Bear", slug: "bear", image: "/images/things/bear.png" },
  { name: "Bee", slug: "bee", image: "/images/things/bee.png" },
  { name: "Bird", slug: "bird", image: "/images/things/bird.png" },
  { name: "Butterfly", slug: "butterfly", image: "/images/things/butterfly.png" },
  { name: "Cat", slug: "cat", image: "/images/things/cat.png" },
  { name: "Cow", slug: "cow", image: "/images/things/cow.png" },
  { name: "Crocodile", slug: "crocodile", image: "/images/things/crocodile.png" },
  { name: "Dog", slug: "dog", image: "/images/things/dog.png" },
  { name: "Dolphin", slug: "dolphin", image: "/images/things/dolphin.png" },
  { name: "Donkey", slug: "donkey", image: "/images/things/donkey.png" },
  { name: "Duck", slug: "duck", image: "/images/things/duck.png" },
  { name: "Eagle", slug: "eagle", image: "/images/things/eagle.png" },
  { name: "Elephant", slug: "elephant", image: "/images/things/elephant.png" },
  { name: "Fish", slug: "fish", image: "/images/things/fish.png" },
  { name: "Flamingo", slug: "flamingo", image: "/images/things/flamingo.png" },
  { name: "Fox", slug: "fox", image: "/images/things/fox.png" },
  { name: "Frog", slug: "frog", image: "/images/things/frog.png" },
  { name: "Giraffe", slug: "giraffe", image: "/images/things/giraffe.png" },
  { name: "Goat", slug: "goat", image: "/images/things/goat.png" },
  { name: "Goose", slug: "goose", image: "/images/things/goose.png" },
  { name: "Gorilla", slug: "gorilla", image: "/images/things/gorilla.png" },
  { name: "Hen", slug: "hen", image: "/images/things/hen.png" },
  { name: "Hippopotamus", slug: "hippopotamus", image: "/images/things/hippopotamus.png" },
  { name: "Horse", slug: "horse", image: "/images/things/horse.png" },
  { name: "Hyena", slug: "hyena", image: "/images/things/hyena.png" },
  { name: "Iguana", slug: "iguana", image: "/images/things/iguana.png" },
  { name: "Jaguar", slug: "jaguar", image: "/images/things/jaguar.png" },
  { name: "Jellyfish", slug: "jellyfish", image: "/images/things/jellyfish.png" },
  { name: "Kangaroo", slug: "kangaroo", image: "/images/things/kangaroo.png" },
  { name: "Koala", slug: "koala", image: "/images/things/koala.png" },
  { name: "Lamb", slug: "lamb", image: "/images/things/lamb.png" },
  { name: "Leopard", slug: "leopard", image: "/images/things/leopard.png" },
  { name: "Lion", slug: "lion", image: "/images/things/lion.png" },
  { name: "Lizard", slug: "lizard", image: "/images/things/lizard.png" },
  { name: "Monkey", slug: "monkey", image: "/images/things/vervet-monkey.png" },
  { name: "Mouse", slug: "mouse", image: "/images/things/mouse.png" },
  { name: "Octopus", slug: "octopus", image: "/images/things/octopus.png" },
  { name: "Ostrich", slug: "ostrich", image: "/images/things/ostrich.png" },
  { name: "Owl", slug: "owl", image: "/images/things/owl.png" },
  { name: "Parrot", slug: "parrot", image: "/images/things/parrot.png" },
  { name: "Penguin", slug: "penguin", image: "/images/things/penguin.png" },
  { name: "Rabbit", slug: "rabbit", image: "/images/things/rabbit.png" },
  { name: "Rat", slug: "rat", image: "/images/things/rat.png" },
  { name: "Rhinoceros", slug: "rhinoceros", image: "/images/things/rhinoceros.png" },
  { name: "Rooster", slug: "rooster", image: "/images/things/rooster.png" },
  { name: "Sheep", slug: "sheep", image: "/images/things/sheep.png" },
  { name: "Snail", slug: "snail", image: "/images/things/snail.png" },
  { name: "Snake", slug: "snake", image: "/images/things/snake.png" },
  { name: "Spider", slug: "spider", image: "/images/things/spider.png" },
  { name: "Tiger", slug: "tiger", image: "/images/things/tiger.png" },
  { name: "Turkey", slug: "turkey", image: "/images/things/turkey.png" },
  { name: "Turtle", slug: "turtle", image: "/images/things/turtle.png" },
  { name: "Vulture", slug: "vulture", image: "/images/things/vulture.png" },
  { name: "Warthog", slug: "warthog", image: "/images/things/warthog.png" },
  { name: "Wasp", slug: "wasp", image: "/images/things/wasp.png" },
  { name: "Whale", slug: "whale", image: "/images/things/whale.png" },
  { name: "Wolf", slug: "wolf", image: "/images/things/wolf.png" },
  { name: "Yak", slug: "yak", image: "/images/things/yak.png" },
  { name: "Zebra", slug: "zebra", image: "/images/things/zebra.png" },
]

/** The whole Animal Journey as gallery frames — every animal is a "thing"
 *  (the teacher introduces it before the picture is revealed), voiced by
 *  scripts/gen-animal-journey-audio.py, same "This is a/an X." pattern as the
 *  Word Journey (lib/discoverPhrases.ts). */
export function animalJourneyFrames(): GalleryFrame[] {
  return ANIMALS.map((a) => ({
    image: a.image,
    word: a.name,
    kind: "thing",
    audio: `/audio/discover/animals/${a.slug}-alone.mp3`,
  }))
}
