# REWARD SYSTEM, AUDIO SYSTEM & PWA
## Specifications

---

# PART 1 — REWARD SYSTEM
## `/src/components/rewards/`

---

## RewardSystem Component

```typescript
// src/components/rewards/RewardSystem.tsx
"use client"
import { useState, forwardRef, useImperativeHandle } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Howl } from "howler"
import { ALL_REWARDS } from "@/data/rewards"
import type { Reward } from "@/types"

interface RewardSystemRef {
  giveReward: () => void
}

interface RewardSystemProps {
  onRewardGiven: (reward: Reward) => void
  chestRef: React.RefObject<{ shake: () => void }>
}

export const RewardSystem = forwardRef<RewardSystemRef, RewardSystemProps>(
  ({ onRewardGiven, chestRef }, ref) => {
    const [activeReward, setActiveReward] = useState<Reward | null>(null)
    const [isAnimating, setIsAnimating] = useState(false)

    useImperativeHandle(ref, () => ({
      giveReward: () => {
        if (isAnimating) return
        
        // Pick random reward
        const reward = ALL_REWARDS[Math.floor(Math.random() * ALL_REWARDS.length)]
        setActiveReward(reward)
        setIsAnimating(true)
        
        // Play reward sound
        new Howl({ src: [reward.sound] }).play()
        
        // After 2 seconds, send to chest
        setTimeout(() => {
          setActiveReward(null)
          setIsAnimating(false)
          chestRef.current?.shake()
          onRewardGiven(reward)
        }, 2000)
      }
    }))

    return (
      <AnimatePresence>
        {activeReward && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: "45vw", y: "-45vh", scale: 0.1 }}
            transition={{ exit: { duration: 0.5 } }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1.0] }}
              transition={{ duration: 0.4, times: [0, 0.6, 1] }}
            >
              <img
                src={activeReward.image}
                alt={activeReward.name}
                className="w-40 h-40 object-contain drop-shadow-2xl"
              />
              <p className="text-center text-2xl font-bold mt-2" style={{ color: "#FF6B6B" }}>
                {activeReward.name}!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)
```

---

## RewardChest Component

```typescript
// src/components/rewards/RewardChest.tsx
"use client"
import { useState, forwardRef, useImperativeHandle } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Reward } from "@/types"

interface RewardChestRef {
  shake: () => void
}

interface RewardChestProps {
  rewards: Reward[]
}

export const RewardChest = forwardRef<RewardChestRef, RewardChestProps>(
  ({ rewards }, ref) => {
    const [isShaking, setIsShaking] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    useImperativeHandle(ref, () => ({
      shake: () => {
        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 600)
      }
    }))

    return (
      <>
        {/* Chest button — top right corner */}
        <motion.button
          className="fixed top-4 right-4 z-40 bg-yellow-400 rounded-full p-3 shadow-lg"
          animate={isShaking ? {
            rotate: [-5, 5, -5, 5, -3, 3, 0],
            transition: { duration: 0.6 }
          } : {}}
          onClick={() => setIsOpen(true)}
          whileTap={{ scale: 0.9 }}
        >
          <span className="text-2xl">🎒</span>
          {rewards.length > 0 && (
            <motion.span
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              key={rewards.length}
            >
              {rewards.length}
            </motion.span>
          )}
        </motion.button>

        {/* Open chest modal */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            >
              <motion.div
                className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-2xl font-black text-center mb-4">🎒 Your Rewards!</h2>
                
                {rewards.length === 0 ? (
                  <p className="text-center text-gray-400">No rewards yet! Keep playing!</p>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {rewards.map((reward, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex flex-col items-center"
                      >
                        <motion.img
                          src={reward.image}
                          alt={reward.name}
                          className="w-12 h-12 object-contain"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 1, repeat: Infinity, delay: index * 0.1 }}
                        />
                        <span className="text-xs text-gray-500 mt-1">{reward.name}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="mt-4 w-full py-3 bg-yellow-400 rounded-full font-bold text-lg"
                >
                  Keep Playing! 🎮
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }
)
```

---

# PART 2 — AUDIO SYSTEM

## Global Audio Files Structure

```
/public/audio/
  /letters/
    /a/
      letter-a.mp3          ← "A" spoken
      apple.mp3             ← "Apple" spoken
      ant.mp3               ← "Ant" spoken
      arrow.mp3             ← "Arrow" spoken
    /b/
      letter-b.mp3
      ball.mp3
      banana.mp3
      bird.mp3
    ... (all 26 letters)

  /songs/
    a-song.mp3              ← Suno AI song for A
    b-song.mp3
    ... (all 26 songs)

  /speech/
    /step1/
      touch-the-letter.mp3
      well-done.mp3
      you-learned-letter.mp3
      big-and-small.mp3
    /step2/
      touch-picture-starts-with-a.mp3  (one per letter)
      yes-apple-starts-with-a.mp3      (one per word per letter)
      try-again.mp3
      amazing-you-got-it.mp3
    /step3/
      trace-the-letter.mp3
      great-stroke.mp3
      keep-going.mp3
      you-wrote-it.mp3
      now-write-small.mp3
    /games/
      find-matching-pairs.mp3
      put-pieces-together.mp3
      feed-me-things-starting-with.mp3
      tap-all-the-a.mp3
      build-the-word.mp3
      draw-a-line.mp3
      catch-in-bucket.mp3
      sing-along-with-me.mp3

  /rewards/
    crunch.mp3              ← candy
    vroom.mp3               ← car
    slurp.mp3               ← ice cream
    pop.mp3                 ← lollipop
    squeeze.mp3             ← teddy bear
    bounce.mp3              ← ball
    mmm.mp3                 ← cake
    crunch2.mp3             ← chips
    nom-nom.mp3             ← character eating

  /feedback/
    correct.mp3             ← general correct sound
    wrong-soft.mp3          ← gentle wrong answer sound
    celebration.mp3         ← game complete fanfare
    star-earn.mp3           ← earning a star

  /sfx/
    pencil-writing.mp3      ← tracing sound (loops)
    card-flip.mp3
    puzzle-snap.mp3
    match-found.mp3
    bubble-pop.mp3
    countdown-beep.mp3
    splash.mp3
    page-turn.mp3
```

## ElevenLabs Script — Record All These

```
LETTERS (say each clearly):
A, B, C, D, E, F, G, H, I, J, K, L, M, 
N, O, P, Q, R, S, T, U, V, W, X, Y, Z

WORDS (one per recording):
Apple, Ant, Arrow
Ball, Banana, Bird
Cat, Car, Cup
Dog, Duck, Door
Egg, Elephant, Eye
Fish, Frog, Flag
Goat, Grapes, Gate
Hat, Horse, House
Ice Cream, Igloo, Insect
Juice, Jacket, Jar
Kite, Key, Kangaroo
Lion, Leaf, Lamp
Mango, Monkey, Moon
Nest, Nurse, Net
Orange, Owl, Ocean
Pineapple, Pig, Pen
Queen, Quilt, Question Mark
Rain, Rabbit, Ring
Sun, Snake, Star
Tree, Tiger, Train
Umbrella, Uncle, Up
Van, Vase, Violin
Water, Wolf, Wind
X-ray, Xylophone, Box
Yellow, Yak, Yarn
Zebra, Zoo, Zip

INSTRUCTIONS:
"Look! This is the letter A — A is for Apple!"
"Touch the letter A!"
"Well done! You learned the letter A!"
"Big A... and small a!"
"Now let's write the letter A! Trace the dots with your finger!"
"Great stroke! Keep going!"
"Congratulations! You wrote the letter A!"
"Now write the small letter a!"
"Okay, try again! You can do it!"
"Touch the picture that starts with A!"
"Yes! Apple starts with A!"
"Try again!"
"Amazing! You got them all!"
"Find the matching pairs!"
"Great match!"
"You found them all! Amazing!"
"Put the pieces together to make the letter A!"
"You built the letter A! Wonderful!"
"Feed me things that start with A!"
"Mmm yummy! That starts with A!"
"No no! That does not start with A!"
"My tummy is full! Great job!"
"Tap all the letter A's you can find!"
"Build the word Apple!"
"You built the word Apple! Well done!"
"Draw a line from the letter to its picture!"
"Catch things that start with A in the bucket!"
"The bucket is full! Excellent!"
"Sing along with me!"
"You are a superstar learner!"
"Amazing! Well done! Excellent! Brilliant! Great job! Wonderful! You did it! Super star!"
```

---

# PART 3 — PWA & OFFLINE MODE

## next-pwa Configuration

```javascript
// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      // Cache all images
      urlPattern: /^https?.*\.(png|jpg|jpeg|svg|gif|webp)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "images-cache",
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      // Cache all audio files
      urlPattern: /^https?.*\.(mp3|wav|ogg)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "audio-cache",
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      // Cache API routes with network-first
      urlPattern: /^https?.*\/api\/.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
      },
    },
  ],
})

module.exports = withPWA({
  // your next.js config
})
```

## Offline Progress Sync

```typescript
// src/lib/offlineSync.ts
import { openDB } from "idb"  // npm install idb

const DB_NAME = "elimu-yangu-offline"
const STORE_NAME = "pending-progress"

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true })
    }
  })
}

// Save progress locally when offline
export async function saveProgressOffline(data: {
  studentId: string
  module: string
  itemId: string
  step: number
  stars: number
  timeSpent: number
}) {
  const db = await getDB()
  await db.add(STORE_NAME, { ...data, timestamp: Date.now() })
}

// Sync when back online
export async function syncOfflineProgress() {
  const db = await getDB()
  const pending = await db.getAll(STORE_NAME)
  
  for (const item of pending) {
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })
      await db.delete(STORE_NAME, item.id)
    } catch {
      // Still offline, keep in store
      break
    }
  }
}

// Listen for online event
if (typeof window !== "undefined") {
  window.addEventListener("online", syncOfflineProgress)
}
```

## Web App Manifest

```json
// public/manifest.json
{
  "name": "Kinda",
  "short_name": "Elimu",
  "description": "Learning app for Tanzanian children",
  "start_url": "/student",
  "display": "standalone",
  "background_color": "#FFF3E0",
  "theme_color": "#FF6B6B",
  "orientation": "landscape",
  "icons": [
    { "src": "/icons/icon-72.png", "sizes": "72x72", "type": "image/png" },
    { "src": "/icons/icon-96.png", "sizes": "96x96", "type": "image/png" },
    { "src": "/icons/icon-128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
