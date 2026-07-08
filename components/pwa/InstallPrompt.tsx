"use client"

import { useEffect, useState } from "react"
import { Decor } from "@/components/ui/Decor"

// Chromium fires this before showing its own install banner; capturing it lets
// us offer a friendly "Add Kinda to your device" button instead. Safari/iOS
// never fires it, so there we show the share-sheet instructions.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [installed, setInstalled] = useState(true) // assume installed until we know

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari's non-standard flag
      (navigator as unknown as { standalone?: boolean }).standalone === true
    // Deliberate set-on-mount: display-mode/UA are client-only signals.
    /* eslint-disable react-hooks/set-state-in-effect */
    setInstalled(standalone)
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
    /* eslint-enable react-hooks/set-state-in-effect */

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    const onInstalled = () => setInstalled(true)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  if (installed || (!deferred && !isIOS)) return null

  return (
    <div className="glass-card mx-auto flex max-w-md flex-col items-center gap-3 rounded-3xl p-6 text-center">
      <Decor name="backpack" size={44} />
      <p className="text-lg font-black text-gray-700">Take Kinda everywhere</p>
      {deferred ? (
        <button
          type="button"
          onClick={async () => {
            await deferred.prompt()
            setDeferred(null)
          }}
          className="btn-press rounded-full bg-linear-to-r from-[#ff6b9d] to-[#ffc24a] px-8 py-3 text-lg font-bold text-white shadow-lg"
        >
          Install the app
        </button>
      ) : (
        <p className="text-sm font-bold text-gray-500">
          Tap the Share button, then &ldquo;Add to Home Screen&rdquo; to install
          Kinda like an app — it even works offline.
        </p>
      )}
    </div>
  )
}
