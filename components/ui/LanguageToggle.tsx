"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useLanguage } from "@/store/languageStore"
import { getPhrases, type Lang } from "@/lib/i18n"

const OPTIONS: Lang[] = ["en", "sw"]

export function LanguageToggle() {
  const router = useRouter()
  const lang = useLanguage((s) => s.lang)
  const setLang = useLanguage((s) => s.setLang)
  const t = getPhrases(lang)

  const choose = (l: Lang) => {
    if (l === lang) return
    setLang(l)
    router.refresh() // re-render server content (letter labels) in the new language
  }

  return (
    <div className="mx-auto mb-8 flex w-fit items-center gap-1 rounded-full bg-white/70 p-1 shadow ring-1 ring-black/5">
      {OPTIONS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          className="relative rounded-full px-5 py-2 text-sm font-bold"
        >
          {lang === l && (
            <motion.span
              layoutId="langpill"
              className="absolute inset-0 rounded-full bg-[#ff6b9d]"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className={`relative z-10 ${lang === l ? "text-white" : "text-gray-500"}`}>
            {l === "en" ? t.english : t.swahili}
          </span>
        </button>
      ))}
    </div>
  )
}
