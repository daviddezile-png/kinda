"use client"

// Modern, layered, slightly-3D animated background. Aurora gradient blobs +
// large drifting depth shapes that parallax toward the pointer for a sense of
// depth (CSS-3D, no WebGL). Render as the first child of a `relative` container;
// put real content in a sibling with `relative z-10`.

import { useEffect } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { Decor, type DecorName } from "@/components/ui/Decor"

interface FloatItem {
  decor: DecorName
  left: string
  top: string
  size: number
  depth: number // 0 = far (moves little), 1 = near (moves lots)
  anim: string
  delay: string
}

const ITEMS: FloatItem[] = [
  { decor: "star", left: "6%", top: "16%", size: 60, depth: 0.9, anim: "animate-float3d", delay: "0s" },
  { decor: "cloud", left: "76%", top: "10%", size: 92, depth: 0.3, anim: "animate-float-slow", delay: "0.6s" },
  { decor: "balloon", left: "86%", top: "58%", size: 78, depth: 0.8, anim: "animate-float3d", delay: "1.2s" },
  { decor: "kite", left: "8%", top: "70%", size: 76, depth: 0.5, anim: "animate-float-slow", delay: "0.3s" },
  { decor: "sparkle", left: "46%", top: "8%", size: 46, depth: 1, anim: "animate-twinkle", delay: "0.2s" },
  { decor: "moon", left: "30%", top: "82%", size: 68, depth: 0.6, anim: "animate-float3d", delay: "1s" },
  { decor: "butterfly", left: "62%", top: "78%", size: 64, depth: 0.95, anim: "animate-float3d", delay: "0.8s" },
  { decor: "sun", left: "16%", top: "42%", size: 62, depth: 0.5, anim: "animate-float-slow", delay: "0.4s" },
  { decor: "sparkle", left: "52%", top: "50%", size: 40, depth: 0.4, anim: "animate-twinkle", delay: "0.5s" },
]

export function PlayfulBackground() {
  // Pointer position normalised to [-1, 1].
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 60, damping: 18 })
  const sy = useSpring(py, { stiffness: 60, damping: 18 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      px.set((e.clientX / window.innerWidth) * 2 - 1)
      py.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener("pointermove", onMove)
    return () => window.removeEventListener("pointermove", onMove)
  }, [px, py])

  return (
    <div aria-hidden className="scene-3d pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Aurora gradient blobs */}
      <div className="animate-aurora absolute -left-24 -top-24 h-96 w-96 rounded-full bg-pink-300/40 blur-3xl" />
      <div className="animate-aurora absolute -right-24 top-0 h-96 w-96 rounded-full bg-sky-300/40 blur-3xl" style={{ animationDelay: "3s" }} />
      <div className="animate-aurora absolute bottom-[-6rem] left-1/3 h-96 w-96 rounded-full bg-amber-200/50 blur-3xl" style={{ animationDelay: "6s" }} />
      <div className="animate-aurora absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-violet-300/40 blur-3xl" style={{ animationDelay: "9s" }} />

      {/* Parallax depth shapes */}
      <div className="preserve-3d absolute inset-0">
        {ITEMS.map((it, i) => (
          <Parallax key={i} sx={sx} sy={sy} item={it} />
        ))}
      </div>
    </div>
  )
}

function Parallax({
  sx,
  sy,
  item,
}: {
  sx: ReturnType<typeof useSpring>
  sy: ReturnType<typeof useSpring>
  item: FloatItem
}) {
  const range = 36 * item.depth
  const x = useTransform(sx, [-1, 1], [-range, range])
  const y = useTransform(sy, [-1, 1], [-range, range])
  return (
    <motion.span
      style={{ left: item.left, top: item.top, x, y, animationDelay: item.delay }}
      className={`absolute opacity-80 drop-shadow-lg ${item.anim}`}
    >
      <Decor name={item.decor} size={item.size} />
    </motion.span>
  )
}
