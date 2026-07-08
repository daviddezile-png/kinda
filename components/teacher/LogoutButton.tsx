"use client"

import { signOut } from "next-auth/react"

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/auth/login" })}
      className="rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-gray-500 shadow transition-transform active:scale-95"
    >
      Logout
    </button>
  )
}
