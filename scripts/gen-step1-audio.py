"""
Step-1 lesson & finale audio — voice lines (gTTS, same voice as
generate_voices_free.py) plus a synthesized hand-clap/applause sound
(numpy -> WAV; applause is not speech, so it can't come from TTS).

Run from the repo root:  python scripts/gen-step1-audio.py
Safe to re-run — existing files are skipped.
"""

import os
import sys
import wave

import numpy as np

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

OUTPUT_BASE = "./public/audio"

VOICE_LINES = {
    # Step 1 — the rebuilt lesson flow
    "instructions/step1/touch-small-letter.mp3": "Now touch the small letter!",
    "instructions/step1/clap-your-hands.mp3": "Hooray! You did it! Clap your hands!",
    # Step 3 writing: the solo "test" trace after the guided one.
    "instructions/step3/write-yourself.mp3": "Now, write it all by yourself! You can do it!",
    # Celebration: two buttons below — name BOTH, not just "the star".
    "instructions/step1/finish-buttons.mp3": (
        "You did it! Touch the round arrow to do this letter again, "
        "or touch the star to go to the next one!"
    ),
    "instructions/step1/find-the-picture.mp3": "Now, a little game! Find the picture!",
    # Letters the original generator skipped (Q and X)
    "instructions/step1/q-is-for.mp3": "Q is for",
    "instructions/step1/x-is-for.mp3": "X is for",
    "instructions/step1/learned-q.mp3": "Great job! You learned the letter Q!",
    "instructions/step1/learned-x.mp3": "Great job! You learned the letter X!",
    "instructions/step2/touch-picture-q.mp3": "Touch the picture that starts with Q!",
    "instructions/step2/touch-picture-x.mp3": "Touch the picture that starts with X!",
    "letters/names/q.mp3": "Q",
    "letters/names/x.mp3": "X",
    "letters/sounds/q.mp3": "kwuh",
    "letters/sounds/x.mp3": "ks",
    # Finale — after the child finishes ALL letters
    "instructions/finale/all-letters.mp3": "Hooray! Hooray! You have learned all of your letters!",
    "instructions/finale/so-proud.mp3": "I am so proud of you! You are a superstar learner!",
    "instructions/finale/big-clap.mp3": "Give yourself a big, big clap! Well done!",
    "instructions/finale/see-you.mp3": "Keep practising, and see you next time!",
}


def gen_voice(text: str, rel_path: str) -> bool:
    from gtts import gTTS

    full = os.path.join(OUTPUT_BASE, rel_path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    try:
        gTTS(text=text, lang="en", slow=False, tld="com.au").save(full)
        return True
    except Exception as e:
        print(f"  ERROR {rel_path}: {e}")
        return False


# ── Applause synthesis ────────────────────────────────────────────────────
# A clap is a short burst of noise with a very fast decay; applause is many
# claps at random times from several "people" (band-limited noise, slight
# pitch/level variation), under a slow swell-and-fade envelope.

SR = 22050


def one_clap(rng, dur=0.045):
    n = int(SR * dur)
    noise = rng.standard_normal(n)
    # crude band-pass: difference kills lows, then a 2-tap average tames highs
    noise = np.diff(noise, prepend=0.0)
    noise = (noise + np.roll(noise, 1)) * 0.5
    env = np.exp(-np.linspace(0, 1, n) * rng.uniform(38, 60))
    return noise * env


def applause(seconds: float, people: int, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    total = np.zeros(int(SR * seconds))
    for _ in range(people):
        t = rng.uniform(0.0, 0.25)  # each person joins in quickly
        rate = rng.uniform(3.5, 5.0)  # claps per second
        level = rng.uniform(0.4, 1.0)
        while t < seconds - 0.08:
            c = one_clap(rng) * level * rng.uniform(0.6, 1.0)
            i = int(t * SR)
            total[i : i + len(c)] += c[: len(total) - i]
            t += rng.uniform(0.7, 1.3) / rate
    # swell in, fade out
    n = len(total)
    env = np.minimum(1.0, np.linspace(0, 8, n))  # fast swell
    fade = int(SR * min(0.8, seconds / 4))
    env[-fade:] *= np.linspace(1, 0, fade)
    total *= env
    total /= max(1e-9, np.max(np.abs(total)))
    return (total * 0.85 * 32767).astype(np.int16)


def write_wav(rel_path: str, data: np.ndarray) -> None:
    full = os.path.join(OUTPUT_BASE, rel_path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with wave.open(full, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def main():
    made = skipped = failed = 0
    for rel, text in VOICE_LINES.items():
        if os.path.exists(os.path.join(OUTPUT_BASE, rel)):
            skipped += 1
            continue
        ok = gen_voice(text, rel)
        made += ok
        failed += not ok
        print(f"{'OK  ' if ok else 'FAIL'} {rel}")

    for rel, secs, people, seed in [
        ("feedback/applause.wav", 4.5, 14, 7),
        ("feedback/clap-short.wav", 1.8, 6, 11),
    ]:
        if os.path.exists(os.path.join(OUTPUT_BASE, rel)):
            skipped += 1
            continue
        write_wav(rel, applause(secs, people, seed))
        made += 1
        print(f"OK   {rel}")

    print(f"\ndone: {made} written, {skipped} skipped, {failed} failed")


if __name__ == "__main__":
    main()
