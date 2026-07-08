"use client"

import { useActionState, useState } from "react"
import { setTeacherPassword, type ActionState } from "@/app/admin/actions"
import { PasswordField } from "@/components/ui/PasswordField"

// Inline "set a new password" control on a teacher's roster row — collapsed by
// default so the row stays compact; expands into a small form on click.
export function TeacherPasswordReset({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<ActionState, FormData>(setTeacherPassword, {})

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-bold text-indigo-600 shadow"
      >
        Reset password
      </button>
    )
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <PasswordField
        name="newPassword"
        placeholder="New password"
        required
        minLength={6}
        autoComplete="new-password"
        className="w-40 rounded-2xl border-2 border-gray-200 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-indigo-300"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-indigo-500 px-4 py-1.5 text-xs font-bold text-white shadow disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-500"
      >
        Cancel
      </button>
      {state.ok && <span className="text-xs font-bold text-emerald-600">Changed ✓</span>}
      {state.error && <span className="text-xs font-bold text-rose-500">{state.error}</span>}
    </form>
  )
}
