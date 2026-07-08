"use client"

import { useActionState } from "react"
import { joinByCode, type JoinState } from "@/app/student/join/actions"

export function JoinForm() {
  const [state, action, pending] = useActionState<JoinState, FormData>(joinByCode, {})

  return (
    <form action={action} className="w-full max-w-sm space-y-4">
      <input
        name="code"
        autoFocus
        autoComplete="off"
        autoCapitalize="characters"
        placeholder="CLASS CODE"
        className="w-full rounded-2xl border-2 border-gray-200 bg-white/90 px-5 py-4 text-center text-2xl font-black uppercase tracking-[0.3em] text-gray-700 outline-none focus:border-indigo-300"
      />
      {state.error && <p className="text-center text-sm font-bold text-rose-500">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-linear-to-r from-[#ff6b9d] to-[#ff8a5b] py-3 text-lg font-bold text-white shadow-lg disabled:opacity-60"
      >
        {pending ? "Opening…" : "Open my class"}
      </button>
    </form>
  )
}
