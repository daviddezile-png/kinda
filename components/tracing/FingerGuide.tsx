"use client";

import { useEffect } from "react";

interface FingerGuideProps {
  path: string;
  width: number;
  height: number;
  isPlaying: boolean;
  onComplete: () => void;
}

// Animates the hand-holding-a-pen guide along the trace path to show the child
// how to draw. The image's pen tip sits at ≈0.7% across / ≈6.9% down (top-left),
// so the 54×61 image is offset by (-0.4, -4.2) to land that exact nib — not the
// middle of the hand — on the stroke path.
export function FingerGuide({
  path,
  width,
  height,
  isPlaying,
  onComplete,
}: FingerGuideProps) {
  useEffect(() => {
    if (!isPlaying) return;
    const t = setTimeout(onComplete, 3000);
    return () => clearTimeout(t);
  }, [isPlaying, onComplete, path]);

  if (!isPlaying) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-10"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
    >
      <image href="/images/decor/write-guide-hand.png" x={-0.4} y={-4.2} width={54} height={61}>
        <animateMotion dur="2.5s" repeatCount="1" fill="freeze" path={path} />
      </image>
    </svg>
  );
}
