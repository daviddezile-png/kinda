"use client"

import { useCallback, useEffect, useRef } from "react"
import { Howl } from "howler"
import { Decor } from "@/components/ui/Decor"
import { strokeStart } from "@/lib/letterStrokes"

const SIZE = 320
const VB = 100 // viewBox units the stroke paths use
const DEMO_DUR = 6 // seconds for the hand to travel the whole glyph — slow
// enough that a small child can actually follow the nib with their finger.
const REWARD_AT = 0.3
const COMPLETE_AT = 0.55

interface Pointish {
  clientX: number
  clientY: number
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
 * Glyph-agnostic stroke tracing (extracted from the letters' TracingCanvas so
 * numbers can write too). The glyph is a dotted outline; the write-guide-hand
 * image travels start → end showing the writing direction while a colored
 * trail draws itself. The child traces on a transparent layer on top;
 * completion is coverage-based, and colour only lands on the stroke band.
 */
export function StrokeCanvas({ path, color, glyphKey, clearLabel, guide = true, onReward, onComplete }: StrokeCanvasProps) {
  const start = strokeStart(path)

  const drawRef = useRef<HTMLCanvasElement>(null)
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

  // Build the coverage mask by rasterising the stroke path (scaled to the canvas).
  useEffect(() => {
    const mask = document.createElement("canvas")
    mask.width = SIZE
    mask.height = SIZE
    const mctx = mask.getContext("2d")
    if (mctx) {
      mctx.save()
      mctx.scale(SIZE / VB, SIZE / VB)
      mctx.lineWidth = 15
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
    drawRef.current?.getContext("2d")?.clearRect(0, 0, SIZE, SIZE)
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
    const dctx = drawRef.current?.getContext("2d")
    if (!dctx || maskCount.current === 0) return
    const data = dctx.getImageData(0, 0, SIZE, SIZE).data
    let covered = 0
    for (const i of maskIdx.current) {
      if (data[i] > 0) covered++
    }
    const coverage = covered / maskCount.current
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
    const dctx = drawRef.current?.getContext("2d")
    if (!dctx) return
    isDrawing.current = true
    lastPt.current = null
    dctx.lineWidth = SIZE * 0.085
    dctx.lineCap = "round"
    dctx.lineJoin = "round"
    dctx.strokeStyle = color
  }

  const moveDraw = (e: Pointish) => {
    if (!isDrawing.current) return
    const dctx = drawRef.current?.getContext("2d")
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
    if (now - lastSample.current > 180) {
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
    drawRef.current?.getContext("2d")?.clearRect(0, 0, SIZE, SIZE)
    rewarded.current = false
    completed.current = false
  }

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
          {/* faint dotted outline of the whole glyph */}
          <path
            d={path}
            fill="none"
            stroke="rgba(0,0,0,0.16)"
            strokeWidth={9}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="0.1 7"
          />
          {/* colored trail that draws as the hand travels (guided rounds only) */}
          {guide && (
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
                repeatCount="indefinite"
              />
            </path>
          )}
          {/* start marker (guided rounds only) */}
          {guide && start && (
            <circle cx={start.x} cy={start.y} r={3.5} fill="#22c55e">
              <animate attributeName="r" values="3;5.5;3" dur="1s" repeatCount="indefinite" />
            </circle>
          )}
          {/* the guiding hand-with-pen travelling start → end (guided rounds
              only). The nib in the art sits at ≈0.7% across / ≈6.9% down
              (top-left), so we offset the 28×32 image by (-0.2, -2.2) to land
              that exact tip on the path — not the pen shaft. The hand stays
              upright (no rotate — a spinning hand reads badly). */}
          {guide && (
            <image href="/images/decor/write-guide-hand.png" x={-0.2} y={-2.2} width={28} height={32}>
              <animateMotion dur={`${DEMO_DUR}s`} repeatCount="indefinite" path={path} />
            </image>
          )}
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
