"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { PlayfulBackground } from "@/components/ui/PlayfulBackground"
import { Decor } from "@/components/ui/Decor"
import { PasswordField } from "@/components/ui/PasswordField"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get("callbackUrl") || "/teacher"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await signIn("credentials", { email, password, redirect: false })
    setBusy(false)
    if (res?.error) {
      setError("That email or password didn't work.")
      return
    }
    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 40, rotateX: 12 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      style={{ transformPerspective: 1000 }}
      className="relative z-10 w-full max-w-sm rounded-3xl bg-white/80 p-8 shadow-[0_30px_60px_-15px_rgba(80,80,160,0.4)] backdrop-blur"
    >
      <div className="mb-6 text-center">
        <div className="flex justify-center">
          <Decor name="apple" size={56} />
        </div>
        <h1 className="mt-2 text-2xl font-black text-gray-700">Teacher Sign In</h1>
        <p className="text-sm text-gray-400">Kinda · Elimu Yangu</p>
      </div>

      <label className="mb-1 block text-sm font-bold text-gray-500">Email</label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4 w-full rounded-2xl border-2 border-gray-200 px-4 py-3 text-gray-700 outline-none focus:border-pink-300"
        placeholder="teacher@kinda.test"
      />

      <label className="mb-1 block text-sm font-bold text-gray-500">Password</label>
      <div className="mb-4">
        <PasswordField
          name="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 text-gray-700 outline-none focus:border-pink-300"
          placeholder="••••••••"
        />
      </div>

      {error && <p className="mb-3 text-sm font-bold text-red-500">{error}</p>}

      <motion.button
        type="submit"
        disabled={busy}
        whileTap={{ scale: 0.95 }}
        className="w-full rounded-full bg-linear-to-r from-[#ff6b9d] to-[#ff8a5b] py-3 text-lg font-bold text-white shadow-lg disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Sign In"}
      </motion.button>

      <Link
        href="/student/join"
        className="mt-4 block w-full rounded-full bg-white/70 py-2.5 text-center text-sm font-bold text-gray-500 shadow transition-transform active:scale-95"
      >
        I&apos;m a student →
      </Link>
    </motion.form>
  )
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <PlayfulBackground />
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
