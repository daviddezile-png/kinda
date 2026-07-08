import { cn } from "@/lib/utils"

// A decorative illustration — the generated 3D-Pixar art that replaced the app's
// UI emojis (stars, clouds, balloons, a home, a heart…). Files live in
// public/images/decor/ and are produced by scripts/gen-decor.py. Purely
// decorative, so always aria-hidden; pass a `label` only if the image conveys
// meaning that isn't already in nearby text.
export type DecorName =
  | "star"
  | "cloud"
  | "balloon"
  | "kite"
  | "sparkle"
  | "butterfly"
  | "moon"
  | "sun"
  | "home"
  | "apple"
  | "party"
  | "music"
  | "backpack"
  | "lock"
  | "gift"
  | "bow"
  | "heart"
  | "controller"
  | "bucket"
  | "star_badge"
  | "sound-on"
  | "sound-off"
  | "repeat"
  // "pointing-hand" was removed — house rule: tap/finger cues use the 👆
  // emoji, never that generated image.
  | "eraser"
  | "timer"
  | "mystery"

interface DecorProps {
  name: DecorName
  /** Rendered box in px (square). */
  size?: number
  className?: string
  style?: React.CSSProperties
  /** Accessible label if the image carries meaning; omit for pure decoration. */
  label?: string
}

export function Decor({ name, size = 48, className, style, label }: DecorProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/images/decor/${name}.png`}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      draggable={false}
      width={size}
      height={size}
      className={cn("pointer-events-none inline-block select-none object-contain", className)}
      style={{ width: size, height: size, ...style }}
    />
  )
}
