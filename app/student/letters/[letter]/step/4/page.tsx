import { cookies } from "next/headers"
import { getLetter } from "@/lib/letters"
import { getPhrases, type Lang } from "@/lib/i18n"
import { GameSelector } from "@/components/games/GameSelector"

interface Step4PageProps {
  params: Promise<{ letter: string }>
}

export default async function Step4Page({ params }: Step4PageProps) {
  const { letter } = await params
  const lang: Lang = (await cookies()).get("lang")?.value === "sw" ? "sw" : "en"
  const letterData = await getLetter(letter, lang)

  if (!letterData) {
    return (
      <div className="flex min-h-screen items-center justify-center text-2xl font-black text-gray-500">
        {getPhrases(lang).letterNotFound}
      </div>
    )
  }

  return <GameSelector letterData={letterData} />
}
