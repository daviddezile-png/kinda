import { notFound } from "next/navigation"
import { wordSetFor } from "@/data/words"
import { WordLessonClient } from "@/components/words/WordLessonClient"

interface WordLetterPageProps {
  params: Promise<{ letter: string }>
}

// One letter's word-building lesson (join → say → write → read → games).
export default async function WordLetterPage({ params }: WordLetterPageProps) {
  const { letter } = await params
  const set = wordSetFor(letter)
  if (!set) notFound()

  return <WordLessonClient set={set} />
}
