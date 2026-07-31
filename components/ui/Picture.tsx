"use client"

import { useState } from "react"
import { imageFor, imageAlternatesFor } from "@/lib/wordImages"
import { cn } from "@/lib/utils"

interface PictureProps {
  src?: string
  alt: string
  className?: string
  /**
   * @deprecated Emoji/icon fallbacks are no longer rendered — we only ever show
   * real artwork. These props are accepted so existing call sites keep working,
   * but are ignored. When no image is available the picture is simply omitted.
   */
  emoji?: string
  /** @deprecated see `emoji`. */
  emojiClassName?: string
}

// Renders a real image when one is available, in priority order:
//   1. the explicit `src` from the data,
//   2. a real file matched to the word (lib/wordImages),
//   3. alternate shots of the same object (photo versions of the cutouts).
// Each <img> that fails to load advances to the next candidate. If no real
// image is available we render nothing (a blank, correctly-sized box) rather
// than substituting an emoji or icon — the product only shows real pictures.
export function Picture({ src, alt, className }: PictureProps) {
  const candidates = [src, imageFor(alt), ...imageAlternatesFor(alt)].filter(Boolean) as string[]
  const candidateKey = candidates.join("|")
  const [fallback, setFallback] = useState({ key: candidateKey, idx: 0 })
  const idx = fallback.key === candidateKey ? fallback.idx : 0

  const current = candidates[idx]

  if (!current) {
    // No real artwork — reserve the space but show nothing (no emoji/icon).
    return <span aria-hidden className={cn("block", className)} />
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      onError={() =>
        setFallback((state) => ({
          key: candidateKey,
          idx: state.key === candidateKey ? state.idx + 1 : 1,
        }))
      }
      className={className}
    />
  )
}
