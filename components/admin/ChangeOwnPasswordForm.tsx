"use client"

import { useActionState } from "react"
import { changeOwnPassword, type ActionState } from "@/app/admin/actions"
import { PasswordField } from "@/components/ui/PasswordField"

const input =
  "w-full rounded-2xl border-2 border-gray-200 px-4 py-2.5 text-gray-700 outline-none focus:border-indigo-300"

export function ChangeOwnPasswordForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(changeOwnPassword, {})

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <PasswordField
          name="currentPassword"
          placeholder="Current password"
          required
          autoComplete="current-password"
          className={input}
        />
        <PasswordField
          name="newPassword"
          placeholder="New password"
          required
          minLength={6}
          autoComplete="new-password"
          className={input}
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-linear-to-r from-indigo-400 to-violet-500 px-6 py-2.5 font-bold text-white shadow disabled:opacity-60"
        >
          {pending ? "Saving…" : "Change my password"}
        </button>
        {state.ok && <span className="font-bold text-emerald-600">Changed ✓</span>}
        {state.error && <span className="font-bold text-rose-500">{state.error}</span>}
      </div>
    </form>
  )
}
