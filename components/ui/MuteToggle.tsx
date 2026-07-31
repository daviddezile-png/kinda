"use client"

import { useSyncExternalStore } from "react"
import { motion } from "framer-motion"
import { Volume2, VolumeX } from "lucide-react"
import { isMuted, toggleMuted, onMuteChange } from "@/lib/audio"

// Replaces the top-corner mascot on the discovery screens with a single
// sound on/off toggle — a real control (not decoration), still icon-only
// since a pre-reading child can't read "mute"/"unmute" text.
export function MuteToggle({ className }: { className?: string }) {
  const muted = useSyncExternalStore(onMuteChange, isMuted, () => false)

  return (
    <motion.button
      type="button"
      onClick={() => toggleMuted()}
      aria-label={muted ? "Unmute the voice" : "Mute the voice"}
      whileTap={{ scale: 0.9 }}
      className={`grid h-14 w-14 cursor-pointer place-items-center rounded-full bg-white/70 shadow ${className ?? ""}`}
    >
      {muted ? (
        <VolumeX size={28} strokeWidth={2.5} className="text-slate-500" />
      ) : (
        <Volume2 size={28} strokeWidth={2.5} className="text-slate-700" />
      )}
    </motion.button>
  )
}
