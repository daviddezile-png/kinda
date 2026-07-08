"use client"

import { useActionState, useEffect, useRef } from "react"
import { createSchool, type ActionState } from "@/app/admin/actions"

const input =
  "w-full rounded-2xl border-2 border-gray-200 px-4 py-2.5 text-gray-700 outline-none focus:border-indigo-300"

export function CreateSchoolForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createSchool, {})
  const formRef = useRef<HTMLFormElement>(null)

  // Clear the fields after a successful create so the next school is quick.
  useEffect(() => {
    if (state.ok) formRef.current?.reset()
  }, [state.ok])

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" className={input} placeholder="School name" required />
        <input name="email" type="email" className={input} placeholder="School email" required />
      </div>
      <input name="phone" className={input} placeholder="Phone (optional)" />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-linear-to-r from-emerald-400 to-teal-500 px-6 py-2.5 font-bold text-white shadow disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add school"}
        </button>
        {state.ok && <span className="font-bold text-emerald-600">Added ✓</span>}
        {state.error && <span className="font-bold text-rose-500">{state.error}</span>}
      </div>
    </form>
  )
}
