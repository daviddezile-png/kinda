import Link from "next/link"
import { PlayfulBackground } from "@/components/ui/PlayfulBackground"
import { MuteToggle } from "@/components/ui/MuteToggle"
import { Decor } from "@/components/ui/Decor"
import { WordsPathClient } from "@/components/words/WordsPathClient"

// The Words map — join letters into whole words, one letter's set at a time.
// A free-exploration world (like the Journey / Numbers map): per-child progress
// lives on the device, no class gating.
export default function WordsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden pb-16">
      <PlayfulBackground />

      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/student" className="rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-gray-600 shadow">
          <span className="inline-flex items-center gap-1.5">
            <Decor name="home" size={18} />
          </span>
        </Link>
        <h1 className="shimmer-text text-3xl font-black sm:text-4xl">Words</h1>
        <MuteToggle className="h-11 w-11 shrink-0" />
      </header>

      <main className="relative z-10 px-4 pt-4 sm:px-8">
        <WordsPathClient />
      </main>
    </div>
  )
}
