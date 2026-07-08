"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { DiscoverAllClient } from "@/components/discover/DiscoverAllClient"
import type { GalleryFrame } from "@/components/discover/DiscoverGallery"

interface DiscoverAllRunnerProps {
  images: GalleryFrame[]
  /** Server action recording this Journey's completion (module/itemIds are the
   *  caller's concern — Word Journey and Animal Journey each record their own). */
  onFinish: () => Promise<void>
  /** Where to send the child once they finish touring every picture. */
  redirectTo?: string
}

// Bridges a (server) Journey gallery page to the client flow: when the child
// has toured every picture, record it done and return to the Journey picker
// (or wherever `redirectTo` says). Shared by both Word Journey and Animal
// Journey — DiscoverAllClient/DiscoverGallery are already generic over
// `GalleryFrame[]`.
export function DiscoverAllRunner({ images, onFinish, redirectTo = "/student/journey" }: DiscoverAllRunnerProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  return (
    <DiscoverAllClient
      images={images}
      onComplete={() =>
        startTransition(async () => {
          await onFinish()
          router.push(redirectTo)
        })
      }
    />
  )
}
