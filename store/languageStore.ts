"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Lang } from "@/lib/i18n"

interface LanguageState {
  lang: Lang
  setLang: (lang: Lang) => void
  toggle: () => void
}

function writeCookie(lang: Lang) {
  if (typeof document !== "undefined") {
    document.cookie = `lang=${lang}; path=/; max-age=31536000; samesite=lax`
  }
}

export const useLanguage = create<LanguageState>()(
  persist(
    (set, get) => ({
      lang: "en",
      setLang: (lang) => {
        writeCookie(lang)
        set({ lang })
      },
      toggle: () => get().setLang(get().lang === "en" ? "sw" : "en"),
    }),
    {
      name: "kinda-lang",
      onRehydrateStorage: () => (state) => {
        // Keep the server-visible cookie in sync with the persisted choice.
        if (state) writeCookie(state.lang)
      },
    },
  ),
)
