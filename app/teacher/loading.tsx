import { PlayfulBackground } from "@/components/ui/PlayfulBackground"
import { Loading } from "@/components/ui/Loading"

export default function TeacherLoading() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <PlayfulBackground />
      <div className="relative z-10 flex flex-1">
        <Loading message="Opening your class…" hero="apple" />
      </div>
    </div>
  )
}
