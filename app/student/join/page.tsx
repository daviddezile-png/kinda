import Link from "next/link"
import { PlayfulBackground } from "@/components/ui/PlayfulBackground"
import { Decor } from "@/components/ui/Decor"
import { JoinForm } from "@/components/student/JoinForm"

// First screen on a fresh student device: the teacher enters the class code
// (from the teacher dashboard) to bind this device to their class. After that,
// children just tap their face.
export default function JoinPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <PlayfulBackground />
      <Link
        href="/teacher"
        className="btn-press glass-card absolute right-4 top-4 z-10 rounded-full px-5 py-2 text-sm font-bold text-gray-500"
      >
        Teacher login
      </Link>

      <div className="relative z-10 flex flex-col items-center gap-5 text-center">
        <Decor name="apple" size={64} />
        <div>
          <h1 className="text-3xl font-black text-gray-700">Open your class</h1>
          <p className="mt-1 text-sm text-gray-400">Ask your teacher for the class code.</p>
        </div>
        <JoinForm />
      </div>
    </div>
  )
}
