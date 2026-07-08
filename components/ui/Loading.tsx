"use client"

import { motion } from "framer-motion"
import { Decor, type DecorName } from "@/components/ui/Decor"

const ORBIT: DecorName[] = ["balloon", "star", "butterfly", "bow", "sparkle", "music"]

// A big, joyful 3D-ish loading scene: a bouncing hero illustration with little
// friends orbiting it, a pulsing glow, and a shimmering message.
export function Loading({ message = "Getting ready…", hero = "balloon" }: { message?: string; hero?: DecorName }) {
  return (
    <div className="scene-3d flex flex-1 flex-col items-center justify-center gap-8 py-16">
      <div className="preserve-3d relative h-44 w-44">
        {/* soft pulsing platform */}
        <motion.div
          className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50 blur-md"
          animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* hero */}
        <motion.div
          className="animate-pulse-glow absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ y: [0, -22, 0], rotateY: [0, 18, -18, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Decor name={hero} size={80} />
        </motion.div>
        {/* orbiting friends */}
        {ORBIT.map((e, i) => (
          <motion.span
            key={e}
            className="absolute left-1/2 top-1/2"
            style={{ transformOrigin: "0 0" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 6 + i * 0.4, repeat: Infinity, ease: "linear" }}
          >
            <span style={{ display: "inline-block", transform: `translate(80px,0) rotate(${i * 60}deg)` }}>
              <Decor name={e} size={30} />
            </span>
          </motion.span>
        ))}
      </div>

      <motion.p
        className="shimmer-text text-2xl font-black"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        {message}
      </motion.p>

      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-3 w-3 rounded-full bg-pink-400"
            animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  )
}
