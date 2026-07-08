import { cookies } from "next/headers"
import Link from "next/link"
import { getCurriculumForClass, defaultCurriculum } from "@/lib/curriculum"
import { PlayfulBackground } from "@/components/ui/PlayfulBackground"
import { MuteToggle } from "@/components/ui/MuteToggle"
import { Decor } from "@/components/ui/Decor"
import { NumbersPathClient } from "@/components/numbers/NumbersPathClient"

// The Numbers & Counting map. WHICH numbers (a subset of 1–10) and whether they
// unlock in order are the teacher's curriculum choices; per-child completion
// stays per-device (localStorage). We resolve the class config here (falling
// back to all 1–10 when a child reaches this map without a class cookie, e.g.
// the marketing demo).
export default async function NumbersPage() {
  const classId = (await cookies()).get("kinda_class")?.value
  const curriculum = classId ? await getCurriculumForClass(classId) : defaultCurriculum()

  return (
    <div className="relative min-h-screen overflow-hidden pb-16">
      <PlayfulBackground />

      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-8">
        <Link
          href="/student"
          className="rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-gray-600 shadow"
        >
          <span className="inline-flex items-center gap-1.5">
            <Decor name="home" size={18} />
          </span>
        </Link>
        <h1 className="shimmer-text text-3xl font-black sm:text-4xl">1 2 3</h1>
        <MuteToggle className="h-11 w-11 shrink-0" />
      </header>

      <main className="relative z-10 px-4 pt-4 sm:px-8">
        <NumbersPathClient numbers={curriculum.numbers} sequential={curriculum.sequential} />
      </main>
    </div>
  )
}
