"use client"

import { useEffect } from "react"

// Registers the offline/caching service worker (public/sw.js). Mounted once in
// the root layout; renders nothing. Dev is excluded so hot-reload never fights
// a stale cache.
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // Offline support is progressive enhancement — never break the app.
      })
  }, [])

  return null
}
