# LETTER DATA STRUCTURE
## JSON files for all 26 letters

---

## LOCATION
All letter JSON files live in `/src/data/letters/`
One file per letter: `a.json`, `b.json` ... `z.json`

---

## COMPLETE JSON STRUCTURE (Example: Letter A)

```json
{
  "letter": "A",
  "lowercase": "a",
  "color": "#FF6B6B",
  "backgroundColor": "#FFF3E0",
  "letterAudio": "/audio/letters/a/letter-a.mp3",
  "characterSpeech": {
    "intro": "/audio/speech/a/intro.mp3",
    "touchPrompt": "/audio/speech/a/touch-prompt.mp3",
    "celebration": "/audio/speech/a/celebration.mp3",
    "lowercaseIntro": "/audio/speech/a/lowercase-intro.mp3"
  },
  "words": [
    {
      "word": "Apple",
      "image": "/images/letters/a/apple.png",
      "audio": "/audio/letters/a/apple.mp3"
    },
    {
      "word": "Ant",
      "image": "/images/letters/a/ant.png",
      "audio": "/audio/letters/a/ant.mp3"
    },
    {
      "word": "Arrow",
      "image": "/images/letters/a/arrow.png",
      "audio": "/audio/letters/a/arrow.mp3"
    }
  ],
  "song": {
    "lyrics": "A is for Apple, yummy yummy, A is for Apple, crunch crunch, Letter A, Letter A, I love you!",
    "audio": "/audio/songs/a-song.mp3",
    "lyricsLines": [
      {
        "line": "A is for Apple, yummy ___",
        "blankWord": "yummy",
        "choices": ["yummy", "scary", "loud"],
        "timestamp": 2.5
      },
      {
        "line": "A is for Apple, crunch ___",
        "blankWord": "crunch",
        "choices": ["crunch", "splash", "beep"],
        "timestamp": 6.0
      }
    ]
  },
  "tracing": {
    "uppercase": {
      "canvasWidth": 300,
      "canvasHeight": 300,
      "sections": [
        {
          "id": "left_stroke",
          "path": "M 150 20 L 80 280",
          "guideDots": [
            { "x": 150, "y": 20 },
            { "x": 115, "y": 150 },
            { "x": 80, "y": 280 }
          ],
          "reward": "candy"
        },
        {
          "id": "right_stroke",
          "path": "M 150 20 L 220 280",
          "guideDots": [
            { "x": 150, "y": 20 },
            { "x": 185, "y": 150 },
            { "x": 220, "y": 280 }
          ],
          "reward": "car"
        },
        {
          "id": "middle_stroke",
          "path": "M 100 160 L 200 160",
          "guideDots": [
            { "x": 100, "y": 160 },
            { "x": 150, "y": 160 },
            { "x": 200, "y": 160 }
          ],
          "reward": "ice_cream"
        }
      ],
      "transformImage": "/images/letters/a/apple.png",
      "transformSound": "/audio/rewards/nom-nom.mp3"
    },
    "lowercase": {
      "canvasWidth": 200,
      "canvasHeight": 200,
      "sections": [
        {
          "id": "circle",
          "path": "M 120 60 A 50 50 0 1 0 120 61",
          "guideDots": [
            { "x": 120, "y": 10 },
            { "x": 70, "y": 60 },
            { "x": 120, "y": 110 },
            { "x": 170, "y": 60 }
          ],
          "reward": "candy"
        },
        {
          "id": "stick",
          "path": "M 170 10 L 170 120",
          "guideDots": [
            { "x": 170, "y": 10 },
            { "x": 170, "y": 60 },
            { "x": 170, "y": 120 }
          ],
          "reward": "car"
        }
      ]
    }
  },
  "games": {
    "memory_cards": {
      "pairs": [
        {
          "id": "apple",
          "image": "/images/letters/a/apple.png",
          "word": "Apple",
          "audio": "/audio/letters/a/apple.mp3"
        },
        {
          "id": "ant",
          "image": "/images/letters/a/ant.png",
          "word": "Ant",
          "audio": "/audio/letters/a/ant.mp3"
        },
        {
          "id": "arrow",
          "image": "/images/letters/a/arrow.png",
          "word": "Arrow",
          "audio": "/audio/letters/a/arrow.mp3"
        }
      ]
    },
    "letter_puzzle": {
      "svgPath": "M 150 20 L 80 280 L 220 280 M 100 160 L 200 160",
      "pieces": 4
    },
    "feed_character": {
      "correctItems": [
        { "id": "apple", "image": "/images/letters/a/apple.png", "word": "Apple" },
        { "id": "ant", "image": "/images/letters/a/ant.png", "word": "Ant" },
        { "id": "arrow", "image": "/images/letters/a/arrow.png", "word": "Arrow" }
      ]
    },
    "build_word": {
      "words": [
        {
          "word": "APPLE",
          "image": "/images/letters/a/apple.png",
          "audio": "/audio/letters/a/apple.mp3",
          "extraLetters": ["B", "C", "D", "F"]
        },
        {
          "word": "ANT",
          "image": "/images/letters/a/ant.png",
          "audio": "/audio/letters/a/ant.mp3",
          "extraLetters": ["B", "C", "D", "F"]
        }
      ]
    },
    "match_picture": {
      "rounds": [
        {
          "letter": "A",
          "correctImage": "/images/letters/a/apple.png",
          "correctWord": "Apple"
        },
        {
          "letter": "A",
          "correctImage": "/images/letters/a/ant.png",
          "correctWord": "Ant"
        },
        {
          "letter": "A",
          "correctImage": "/images/letters/a/arrow.png",
          "correctWord": "Arrow"
        }
      ]
    }
  },
  "distractors": [
    { "id": "ball", "image": "/images/distractors/ball.png", "word": "Ball" },
    { "id": "cat", "image": "/images/distractors/cat.png", "word": "Cat" },
    { "id": "dog", "image": "/images/distractors/dog.png", "word": "Dog" },
    { "id": "elephant", "image": "/images/distractors/elephant.png", "word": "Elephant" },
    { "id": "fish", "image": "/images/distractors/fish.png", "word": "Fish" }
  ],
  "rewards": [
    {
      "id": "candy",
      "type": "food",
      "name": "Candy",
      "image": "/images/rewards/candy.png",
      "sound": "/audio/rewards/crunch.mp3",
      "characterState": "nom_nom"
    },
    {
      "id": "car",
      "type": "toy",
      "name": "Toy Car",
      "image": "/images/rewards/car.png",
      "sound": "/audio/rewards/vroom.mp3",
      "characterState": "excited"
    },
    {
      "id": "ice_cream",
      "type": "food",
      "name": "Ice Cream",
      "image": "/images/rewards/ice-cream.png",
      "sound": "/audio/rewards/slurp.mp3",
      "characterState": "nom_nom"
    }
  ]
}
```

---

## ALL 26 LETTERS — WORD LIST

```typescript
// src/data/letters/wordList.ts
export const LETTER_WORDS = {
  A: { words: ["Apple", "Ant", "Arrow"], color: "#FF6B6B", bg: "#FFF3E0" },
  B: { words: ["Ball", "Banana", "Bird"], color: "#4ECDC4", bg: "#E8F8F7" },
  C: { words: ["Cat", "Car", "Cup"], color: "#45B7D1", bg: "#E8F4F8" },
  D: { words: ["Dog", "Duck", "Door"], color: "#96CEB4", bg: "#F0F9F4" },
  E: { words: ["Egg", "Elephant", "Eye"], color: "#FFEAA7", bg: "#FFFDE7" },
  F: { words: ["Fish", "Frog", "Flag"], color: "#DDA0DD", bg: "#F8F0FF" },
  G: { words: ["Goat", "Grapes", "Gate"], color: "#98D8C8", bg: "#F0FBF8" },
  H: { words: ["Hat", "Horse", "House"], color: "#F7DC6F", bg: "#FFFDE7" },
  I: { words: ["Ice Cream", "Igloo", "Insect"], color: "#85C1E9", bg: "#EBF5FB" },
  J: { words: ["Juice", "Jacket", "Jar"], color: "#F0B27A", bg: "#FEF9E7" },
  K: { words: ["Kite", "Key", "Kangaroo"], color: "#82E0AA", bg: "#EAFAF1" },
  L: { words: ["Lion", "Leaf", "Lamp"], color: "#F1948A", bg: "#FDEDEC" },
  M: { words: ["Mango", "Monkey", "Moon"], color: "#BB8FCE", bg: "#F5EEF8" },
  N: { words: ["Nest", "Nurse", "Net"], color: "#73C6B6", bg: "#E8F8F5" },
  O: { words: ["Orange", "Owl", "Ocean"], color: "#F0A500", bg: "#FEF9E7" },
  P: { words: ["Pineapple", "Pig", "Pen"], color: "#EC407A", bg: "#FCE4EC" },
  Q: { words: ["Queen", "Quilt", "Question Mark"], color: "#7E57C2", bg: "#EDE7F6" },
  R: { words: ["Rain", "Rabbit", "Ring"], color: "#26C6DA", bg: "#E0F7FA" },
  S: { words: ["Sun", "Snake", "Star"], color: "#FFCA28", bg: "#FFF8E1" },
  T: { words: ["Tree", "Tiger", "Train"], color: "#66BB6A", bg: "#E8F5E9" },
  U: { words: ["Umbrella", "Uncle", "Up"], color: "#5C6BC0", bg: "#E8EAF6" },
  V: { words: ["Van", "Vase", "Violin"], color: "#EF5350", bg: "#FFEBEE" },
  W: { words: ["Water", "Wolf", "Wind"], color: "#42A5F5", bg: "#E3F2FD" },
  X: { words: ["X-ray", "Xylophone", "Box"], color: "#AB47BC", bg: "#F3E5F5" },
  Y: { words: ["Yellow", "Yak", "Yarn"], color: "#FFD54F", bg: "#FFF8E1" },
  Z: { words: ["Zebra", "Zoo", "Zip"], color: "#26A69A", bg: "#E0F2F1" },
}
```

---

## DISTRACTOR LIST (Wrong answer images — shared across all letters)

```typescript
// src/data/distractors.ts
export const DISTRACTORS = [
  { id: "airplane", image: "/images/distractors/airplane.png", word: "Airplane" },
  { id: "basket", image: "/images/distractors/basket.png", word: "Basket" },
  { id: "candle", image: "/images/distractors/candle.png", word: "Candle" },
  { id: "desk", image: "/images/distractors/desk.png", word: "Desk" },
  { id: "fork", image: "/images/distractors/fork.png", word: "Fork" },
  { id: "glove", image: "/images/distractors/glove.png", word: "Glove" },
  { id: "hammer", image: "/images/distractors/hammer.png", word: "Hammer" },
  { id: "iron", image: "/images/distractors/iron.png", word: "Iron" },
  { id: "jug", image: "/images/distractors/jug.png", word: "Jug" },
  { id: "knife", image: "/images/distractors/knife.png", word: "Knife" },
  { id: "lock", image: "/images/distractors/lock.png", word: "Lock" },
  { id: "map", image: "/images/distractors/map.png", word: "Map" },
  { id: "nail", image: "/images/distractors/nail.png", word: "Nail" },
  { id: "oven", image: "/images/distractors/oven.png", word: "Oven" },
  { id: "paint", image: "/images/distractors/paint.png", word: "Paint" },
  { id: "rope", image: "/images/distractors/rope.png", word: "Rope" },
  { id: "sock", image: "/images/distractors/sock.png", word: "Sock" },
  { id: "table", image: "/images/distractors/table.png", word: "Table" },
  { id: "wall", image: "/images/distractors/wall.png", word: "Wall" },
  { id: "zipper", image: "/images/distractors/zipper.png", word: "Zipper" },
]
```

---

## TYPESCRIPT TYPES FOR LETTER DATA

```typescript
// src/types/index.ts

export interface LetterWord {
  word: string
  image: string
  audio: string
}

export interface TracingSection {
  id: string
  path: string
  guideDots: { x: number; y: number }[]
  reward: string
}

export interface TracingData {
  canvasWidth: number
  canvasHeight: number
  sections: TracingSection[]
  transformImage?: string
  transformSound?: string
}

export interface Reward {
  id: string
  type: "food" | "toy"
  name: string
  image: string
  sound: string
  characterState: string
}

export interface LetterData {
  letter: string
  lowercase: string
  color: string
  backgroundColor: string
  letterAudio: string
  characterSpeech: {
    intro: string
    touchPrompt: string
    celebration: string
    lowercaseIntro: string
  }
  words: LetterWord[]
  song: {
    lyrics: string
    audio: string
    lyricsLines: {
      line: string
      blankWord: string
      choices: string[]
      timestamp: number
    }[]
  }
  tracing: {
    uppercase: TracingData
    lowercase: TracingData
  }
  games: {
    memory_cards: { pairs: LetterWord[] }
    letter_puzzle: { svgPath: string; pieces: number }
    feed_character: { correctItems: LetterWord[] }
    build_word: { words: { word: string; image: string; audio: string; extraLetters: string[] }[] }
    match_picture: { rounds: { letter: string; correctImage: string; correctWord: string }[] }
  }
  distractors: { id: string; image: string; word: string }[]
  rewards: Reward[]
}
```
