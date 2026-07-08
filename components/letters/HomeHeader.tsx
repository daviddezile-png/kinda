"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/store/languageStore"
import { getPhrases } from "@/lib/i18n"
import { Character3D } from "@/components/character/Character3D"

const TITLE = "Kinda"

export function HomeHeader() {
  const t = getPhrases(useLanguage((s) => s.lang))
  return (
    <header className="mb-8 flex flex-col items-center text-center">
      <motion.div
        className="mb-2"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Character3D state="happy" size={96} />
      </motion.div>

      <h1 className="flex gap-1 text-6xl font-black tracking-tight">
        {TITLE.split("").map((char, i) => (
          <motion.span
            key={i}
            className="text-gradient inline-block"
            initial={{ y: -40, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 400, damping: 12 }}
            whileHover={{ scale: 1.2, rotate: -6 }}
          >
            {char}
          </motion.span>
        ))}
      </h1>

      <motion.p
        className="mt-3 text-lg font-bold text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {t.appTagline}
      </motion.p>
    </header>
  )
}
