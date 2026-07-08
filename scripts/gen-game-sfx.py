"""
KINDA — GAME / FEEDBACK / SFX SOUND SYNTHESIS
=============================================
Synthesizes the short non-speech cues the app plays through lib/playSound
(pops, chimes, a soft "wrong" tone, a pencil scratch...). These are NOT voice
lines — they are generated as waveforms (numpy) and encoded to mp3 (lameenc),
the same idea as scripts/gen-step1-audio.py's applause synth.

USE:  pip install numpy lameenc
      python scripts/gen-game-sfx.py
Safe to re-run — existing files are skipped. Delete one to regenerate it.
"""

import os
import sys

import numpy as np
import lameenc

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

SR = 44100
BASE = "./public/audio"


def tone(freq, dur, decay=8.0, kind="sine"):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    if kind == "sine":
        w = np.sin(2 * np.pi * freq * t)
    elif kind == "tri":
        w = 2 * np.abs(2 * (t * freq - np.floor(t * freq + 0.5))) - 1
    else:  # soft square
        w = np.sign(np.sin(2 * np.pi * freq * t)) * 0.6
    # a little shimmer from the octave harmonic
    w += 0.25 * np.sin(2 * np.pi * freq * 2 * t)
    env = np.exp(-t * decay)
    return w * env


def noise(dur, decay=12.0):
    n = int(SR * dur)
    x = np.random.default_rng(1).standard_normal(n)
    x = (x + np.roll(x, 1)) * 0.5  # tame the very top end
    return x * np.exp(-np.linspace(0, 1, n) * decay)


def seq(notes, gap=0.0):
    """notes: list of (freq, dur, decay). Concatenate with optional silence."""
    out = []
    for f, d, dc in notes:
        out.append(tone(f, d, dc))
        if gap:
            out.append(np.zeros(int(SR * gap)))
    return np.concatenate(out)


def chord(freqs, dur, decay=6.0):
    return sum(tone(f, dur, decay) for f in freqs) / len(freqs)


def mix(*arrays):
    """Overlay waveforms of different lengths (zero-padded to the longest)."""
    n = max(len(a) for a in arrays)
    out = np.zeros(n)
    for a in arrays:
        out[: len(a)] += a
    return out


# Note frequencies (a friendly C-major world)
C5, E5, G5, C6, E6, G6 = 523, 659, 784, 1046, 1318, 1568

SOUNDS = {
    # ── feedback ──
    "feedback/correct.mp3": lambda: seq([(C5, 0.12, 9), (E5, 0.12, 9), (G5, 0.22, 7)]),
    "feedback/wrong-soft.mp3": lambda: seq([(330, 0.16, 7), (247, 0.28, 6)]),
    "feedback/celebration.mp3": lambda: np.concatenate([
        seq([(C5, 0.12, 8), (E5, 0.12, 8), (G5, 0.12, 8), (C6, 0.30, 5)]),
        0.7 * chord([C5, E5, G5, C6], 0.5, 5),
    ]),
    # ── games ──
    "games/pop.mp3": lambda: tone(700, 0.12, 30) * np.linspace(0.6, 1.2, int(SR * 0.12)),
    "games/card-flip.mp3": lambda: noise(0.18, 16) * np.hanning(int(SR * 0.18)),
    "games/match-found.mp3": lambda: seq([(G5, 0.12, 9), (C6, 0.22, 7)]),
    "games/countdown-beep.mp3": lambda: tone(880, 0.16, 10, "soft"),
    "games/puzzle-snap.mp3": lambda: mix(noise(0.05, 40), 0.5 * tone(1200, 0.05, 45)),
    "games/word-complete.mp3": lambda: seq([(C5, 0.11, 9), (E5, 0.11, 9), (G5, 0.11, 9), (C6, 0.26, 6)]),
    # ── sfx ──
    "sfx/touch.mp3": lambda: tone(1000, 0.07, 26),
    "sfx/splash.mp3": lambda: mix(noise(0.35, 9), 0.3 * tone(200, 0.2, 10)),
    "sfx/pencil-writing.mp3": lambda: (
        noise(0.6, 2.5) * (0.5 + 0.5 * np.sin(2 * np.pi * 18 * np.linspace(0, 0.6, int(SR * 0.6))))
    ),
}


def encode_mp3(path, data):
    data = data / max(1e-9, np.max(np.abs(data)))
    pcm = (data * 0.85 * 32767).astype(np.int16)
    enc = lameenc.Encoder()
    enc.set_bit_rate(128)
    enc.set_in_sample_rate(SR)
    enc.set_channels(1)
    enc.set_quality(2)
    mp3 = enc.encode(pcm.tobytes()) + enc.flush()
    with open(path, "wb") as f:
        f.write(mp3)


def main():
    made = skipped = 0
    for rel, fn in SOUNDS.items():
        full = os.path.join(BASE, rel)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        if os.path.exists(full):
            print(f"SKIP {rel}")
            skipped += 1
            continue
        encode_mp3(full, fn().astype(np.float64))
        print(f"OK   {rel}")
        made += 1
    print(f"\ndone: {made} written, {skipped} skipped")


if __name__ == "__main__":
    main()
