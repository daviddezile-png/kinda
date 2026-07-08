"use client"

import { useActionState, useState } from "react"
import { createTeacher, type ActionState } from "@/app/admin/actions"
import { PasswordField } from "@/components/ui/PasswordField"
import { SearchableSelect } from "@/components/ui/SearchableSelect"

interface SchoolOption {
  id: string
  name: string
}

const input =
  "w-full rounded-2xl border-2 border-gray-200 px-4 py-2.5 text-gray-700 outline-none focus:border-indigo-300"

export function CreateTeacherForm({ schools }: { schools: SchoolOption[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createTeacher, {})
  // Remounting the whole form on every successful submit clears every field —
  // including the SearchableSelect's own internal query/selection state, which
  // a plain form.reset() wouldn't touch since that's React state, not DOM input
  // state. useActionState returns a new `state` object on each dispatch, so
  // comparing identity (react.dev's "storing information from previous
  // renders" pattern — plain state, not a ref) reliably fires once per
  // submission, including repeat successes.
  const [formKey, setFormKey] = useState(0)
  const [prevState, setPrevState] = useState(state)
  if (state !== prevState) {
    setPrevState(state)
    if (state.ok) setFormKey((k) => k + 1)
  }

  if (schools.length === 0) {
    return <p className="text-sm text-gray-400">Add a school first, then you can create its teachers.</p>
  }

  return (
    <form key={formKey} action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" className={input} placeholder="Teacher name" required />
        <input name="email" type="email" className={input} placeholder="Teacher email" required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <PasswordField
          name="password"
          placeholder="Temporary password"
          required
          minLength={6}
          autoComplete="new-password"
          className={input}
        />
        <SearchableSelect
          name="schoolId"
          options={schools.map((s) => ({ value: s.id, label: s.name }))}
          placeholder="Search school…"
          required
          className={input}
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-linear-to-r from-indigo-400 to-violet-500 px-6 py-2.5 font-bold text-white shadow disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create teacher"}
        </button>
        {state.ok && <span className="font-bold text-emerald-600">Created ✓</span>}
        {state.error && <span className="font-bold text-rose-500">{state.error}</span>}
      </div>
    </form>
  )
}
