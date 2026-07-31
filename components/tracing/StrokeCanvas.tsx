"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Howl } from "howler"
import { Decor } from "@/components/ui/Decor"

const SIZE = 320
const VB = 100 // viewBox units the stroke paths use
const DEMO_DUR = 5 // seconds for the hand to travel the whole glyph — slow
// enough that a small child can follow the nib, brisk enough not to bore.
// Easier + snappier than before: reward early, finish at just under half
// coverage so a child's rough trace still "counts".
const REWARD_AT = 0.25
const COMPLETE_AT = 0.45
// How far AHEAD of the child's coverage the green guide dot sits, so it leads
// the hand onward (like a teacher's finger) instead of sitting under it.
const LEAD = 0.1

interface Pointish {
  clientX: number
  clientY: number
}

interface Pt {
  x: number
  y: number
}

// The drawing layer is read back (getImageData) on every coverage sample and on
// pen-up. Without `willReadFrequently` the browser keeps the canvas GPU-side and
// each readback forces a slow GPU→CPU copy — felt as a lag on the very first
// stroke. This hint keeps it CPU-side so sampling is cheap. Must be passed on
// the FIRST getContext for a canvas (later attrs are ignored), so every call
// goes through this helper.
const ctx2d = (canvas: HTMLCanvasElement | null | undefined): CanvasRenderingContext2D | null =>
  canvas?.getContext("2d", { willReadFrequently: true }) ?? null

// Fit a glyph into the card: parse the path's coordinates for a rough bounding
// box, then scale + translate so it sits CENTERED with padding in the 0–100
// viewBox. Fixes small letters rendering low/tiny and descenders (g, j, p, q, y)
// being clipped at the bottom. Every M/L/Q number is an (x,y) pair (Q's control
// points only make the box a touch generous, which is safe).
function fitTransform(path: string): { s: number; tx: number; ty: number } {
  const nums = (path.match(/-?\d*\.?\d+/g) ?? []).map(Number)
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i], y = nums[i + 1]
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  if (!isFinite(minX)) return { s: 1, tx: 0, ty: 0 }
  const w = Math.max(1, maxX - minX)
  const h = Math.max(1, maxY - minY)
  const PAD = 15
  const target = 100 - 2 * PAD // 70
  // Cap the upscale so an x-height letter doesn't balloon; never below fitting.
  const s = Math.min(target / w, target / h, 1.7)
  const tx = (100 - s * w) / 2 - s * minX
  const ty = (100 - s * h) / 2 - s * minY
  return { s, tx, ty }
}

interface StrokeCanvasProps {
  /** Stroke path in the shared 100-unit viewBox (letters or digits). */
  path: string
  color: string
  /** Remount key for the SMIL guide animation (e.g. the glyph itself). */
  glyphKey: string
  clearLabel: string
  /** Show the moving guide hand + self-drawing demo trail + start dot. Set
   *  false for a "write it yourself" test round — only the faint dotted outline
   *  of the glyph remains as a target; the child gets no live demonstration. */
  guide?: boolean
  onReward?: () => void
  onComplete: () => void
}

/**
 * Glyph-agnostic stroke tracing. The glyph is centered and shown as a dotted
 * outline. BEFORE the child touches, a guide hand demonstrates the stroke once
 * through (the demo trail draws in step with it). The MOMENT the child starts
 * writing the demo hand steps aside — it never overlaps their hand — and a green
 * dot leads just ahead of their progress, like a teacher's finger, until the
 * glyph is covered. Colour only lands on the stroke band; completion is
 * coverage-based and forgiving.
 */
export function StrokeCanvas({ path, color, glyphKey, clearLabel, guide = true, onReward, onComplete }: StrokeCanvasProps) {
  const fit = useMemo(() => fitTransform(path), [path])
  const transform = `translate(${fit.tx} ${fit.ty}) scale(${fit.s})`

  const drawRef = useRef<HTMLCanvasElement>(null)
  const guidePathRef = useRef<SVGPathElement>(null)
  const maskIdx = useRef<number[]>([])
  const maskCount = useRef(0)
  // Per-pixel "is this on the glyph stroke?" grid, for guiding the finger.
  const onPath = useRef<Uint8Array | null>(null)
  const isDrawing = useRef(false)
  const lastPt = useRef<{ x: number; y: number } | null>(null)
  const pencil = useRef<Howl | null>(null)
  const rewarded = useRef(false)
  const completed = useRef(false)
  const lastSample = useRef(0)

  // Once the child starts writing, the demo hand/trail steps aside so it never
  // covers their work; the green dot then leads them along the path.
  const [touched, setTouched] = useState(false)
  // Where the leading guide dot sits (path-local coords, inside the fit <g>).
  const [dot, setDot] = useState<Pt | null>(null)

  // Build the coverage mask by rasterising the CENTERED stroke path.
  useEffect(() => {
    const mask = document.createElement("canvas")
    mask.width = SIZE
    mask.height = SIZE
    const mctx = ctx2d(mask)
    if (mctx) {
      mctx.save()
      mctx.scale(SIZE / VB, SIZE / VB)
      mctx.translate(fit.tx, fit.ty)
      mctx.scale(fit.s, fit.s)
      // A forgiving band (~18 glyph-units wide regardless of the fit scale), so a
      // rough trace still lands on the path.
      mctx.lineWidth = 18 / fit.s
      mctx.lineCap = "round"
      mctx.lineJoin = "round"
      mctx.strokeStyle = "#000"
      mctx.stroke(new Path2D(path))
      mctx.restore()
      const data = mctx.getImageData(0, 0, SIZE, SIZE).data
      const idx: number[] = []
      const hit = new Uint8Array(SIZE * SIZE)
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 40) {
          idx.push(i)
          hit[(i - 3) / 4] = 1
        }
      }
      maskIdx.current = idx
      maskCount.current = idx.length
      onPath.current = hit
    }
    rewarded.current = false
    completed.current = false
    lastPt.current = null
    ctx2d(drawRef.current)?.clearRect(0, 0, SIZE, SIZE)
  }, [path, fit])

  // Start the leading dot at the glyph's start point (getPointAtLength(0)).
  useEffect(() => {
    const el = guidePathRef.current
    if (el) {
      const p = el.getPointAtLength(0)
      setDot({ x: p.x, y: p.y })
    }
  }, [path])

  useEffect(() => {
    pencil.current = new Howl({ src: ["/audio/sfx/pencil-writing.mp3"], loop: true, volume: 0.4 })
    return () => {
      pencil.current?.unload()
    }
  }, [])

  const toPoint = (e: Pointish) => {
    const c = drawRef.current
    if (!c) return { x: 0, y: 0 }
    const r = c.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * SIZE, y: ((e.clientY - r.top) / r.height) * SIZE }
  }

  const sampleCoverage = useCallback(() => {
    const dctx = ctx2d(drawRef.current)
    if (!dctx || maskCount.current === 0) return
    const data = dctx.getImageData(0, 0, SIZE, SIZE).data
    let covered = 0
    for (const i of maskIdx.current) {
      if (data[i] > 0) covered++
    }
    const coverage = covered / maskCount.current

    // Lead the green dot a little ahead of the child's progress, guiding them on.
    const el = guidePathRef.current
    if (el) {
      const progress = Math.min(1, coverage / COMPLETE_AT + LEAD)
      const L = el.getTotalLength()
      const p = el.getPointAtLength(progress * L)
      setDot({ x: p.x, y: p.y })
    }

    if (coverage >= REWARD_AT && !rewarded.current) {
      rewarded.current = true
      onReward?.()
    }
    if (coverage >= COMPLETE_AT && !completed.current) {
      completed.current = true
      onComplete()
    }
  }, [onComplete, onReward])

  // True only where the finger is over the glyph's stroke band, so colour is
  // laid down along the guide path and off-path drags leave nothing behind.
  const isOnPath = (x: number, y: number) => {
    const grid = onPath.current
    if (!grid) return false
    const xi = x | 0
    const yi = y | 0
    if (xi < 0 || yi < 0 || xi >= SIZE || yi >= SIZE) return false
    return grid[yi * SIZE + xi] === 1
  }

  const startDraw = () => {
    const dctx = ctx2d(drawRef.current)
    if (!dctx) return
    isDrawing.current = true
    lastPt.current = null
    // First touch: the demo hand steps aside so it never covers the child's work.
    if (!touched) setTouched(true)
    dctx.lineWidth = SIZE * 0.085
    dctx.lineCap = "round"
    dctx.lineJoin = "round"
    dctx.strokeStyle = color
  }

  const moveDraw = (e: Pointish) => {
    if (!isDrawing.current) return
    const dctx = ctx2d(drawRef.current)
    if (!dctx) return
    const p = toPoint(e)

    if (isOnPath(p.x, p.y)) {
      const prev = lastPt.current
      if (prev) {
        dctx.beginPath()
        dctx.moveTo(prev.x, prev.y)
        dctx.lineTo(p.x, p.y)
        dctx.stroke()
      }
      lastPt.current = p
      if (!pencil.current?.playing()) pencil.current?.play()
    } else {
      // Finger wandered off the glyph — lift the pen so no line is drawn
      // across the gap; tracing resumes when it returns to the path.
      lastPt.current = null
      pencil.current?.pause()
    }

    const now = Date.now()
    if (now - lastSample.current > 110) {
      lastSample.current = now
      sampleCoverage()
    }
  }

  const stopDraw = () => {
    if (!isDrawing.current) return
    isDrawing.current = false
    lastPt.current = null
    pencil.current?.stop()
    sampleCoverage()
  }

  const clear = () => {
    ctx2d(drawRef.current)?.clearRect(0, 0, SIZE, SIZE)
    rewarded.current = false
    completed.current = false
    setTouched(false)
    const el = guidePathRef.current
    if (el) {
      const p = el.getPointAtLength(0)
      setDot({ x: p.x, y: p.y })
    }
  }

  const showDemo = guide && !touched

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative overflow-hidden rounded-3xl border-4 border-white bg-white/80 shadow-lg"
        style={{ width: SIZE, height: SIZE }}
      >
        {/* Guide + animated hand (remounts per glyph via key to restart SMIL) */}
        <svg
          key={glyphKey}
          viewBox={`0 0 ${VB} ${VB}`}
          width={SIZE}
          height={SIZE}
          className="pointer-events-none absolute inset-0 z-0"
        >
          {/* Everything sits in the centering transform so the glyph fills the
              card and nothing is clipped. */}
          <g transform={transform}>
            {/* faint dotted outline of the whole glyph (also our length ruler) */}
            <path
              ref={guidePathRef}
              d={path}
              fill="none"
              stroke="rgba(0,0,0,0.16)"
              strokeWidth={9}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="0.1 7"
            />
            {/* colored trail that draws in step with the demo hand — shown only
                until the child starts writing, then it steps out of the way. */}
            {showDemo && (
              <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={100}
                strokeDasharray="100"
                strokeDashoffset="100"
                opacity={0.85}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="100"
                  to="0"
                  dur={`${DEMO_DUR}s`}
                  calcMode="linear"
                  repeatCount="indefinite"
                />
              </path>
            )}
            {/* the guiding hand-with-pen travelling start → end, ONLY during the
                demo (before the child writes) so it never covers their hand. The
                nib sits at ≈(0.7%, 6.9%) of the 28×32 art, so we offset by
                (-0.2,-2.2) to land the tip on the path. keyPoints/keyTimes force
                constant speed so the hand and the trail stay in lock-step. */}
            {showDemo && (
              <image href="/images/decor/write-guide-hand.png" x={-0.2} y={-2.2} width={28} height={32}>
                <animateMotion
                  dur={`${DEMO_DUR}s`}
                  repeatCount="indefinite"
                  path={path}
                  keyPoints="0;1"
                  keyTimes="0;1"
                  calcMode="linear"
                />
              </image>
            )}
            {/* green leading dot: marks the start, then leads just ahead of the
                child's progress like a teacher's finger. */}
            {guide && dot && (
              <circle cx={dot.x} cy={dot.y} r={3.5} fill="#22c55e">
                {!touched && <animate attributeName="r" values="3;5.5;3" dur="1s" repeatCount="indefinite" />}
              </circle>
            )}
          </g>
        </svg>

        {/* drawing layer */}
        <canvas
          ref={drawRef}
          width={SIZE}
          height={SIZE}
          className="absolute inset-0 z-10 touch-none"
          style={{ width: SIZE, height: SIZE }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            startDraw()
          }}
          onPointerMove={moveDraw}
          onPointerUp={stopDraw}
          onPointerLeave={stopDraw}
        />
      </div>

      <button
        type="button"
        onClick={clear}
        className="flex items-center gap-2 rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-gray-600 shadow"
      >
        <Decor name="eraser" size={18} /> {clearLabel}
      </button>
    </div>
  )
}
