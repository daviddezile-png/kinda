"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { Character3D } from "@/components/character/Character3D";
import { Picture } from "@/components/ui/Picture";
import { Decor } from "@/components/ui/Decor";
import { playVoice, playInstruction, stopVoice, isSpeaking, onSpeakingChange } from "@/lib/audio";

// The picture slides in the SAME direction as the child's gesture / arrow, so
// motion always matches intent: going forward (dir = +1) the next picture comes
// in from the RIGHT and the old one leaves to the LEFT; going back (dir = -1)
// it's mirrored. `custom` (the current direction) drives these.
const slideVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? 240 : -240, opacity: 0, scale: 0.94 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? -240 : 240, opacity: 0, scale: 0.96 }),
};

export interface GalleryFrame {
  image: string;
  word: string;
  /** "thing" = the object alone — the teacher introduces it (her own picture
   *  shown, object hidden) before it is revealed. "action" = the object in a
   *  scene, already introduced, shown directly with its own line. */
  kind: "thing" | "action";
  audio: string;
}

interface DiscoverGalleryProps {
  frames: GalleryFrame[];
  onAllSeen: () => void;
  /** Optional spoken "here is what we will do" line, played once before the
   *  picture tour starts, so it is never cut off by the first picture's name. */
  introSrc?: string;
}

// Pause between naming a picture and moving to the next one, while auto-playing.
// Kept generous so a child has time to really look at the picture before it moves on.
const AFTER_NAME_PAUSE_MS = 4000;

// Let the slide-in animation finish before the voice starts naming it, so the
// child hears the word once the picture is actually sitting still on screen.
const IMAGE_ENTER_DELAY_MS = 1000;

// How long the teacher's introduction holds after she finishes saying "This is
// a/an X" before the picture is revealed — a beat to let the line land.
const INTRO_REVEAL_PAUSE_MS = 900;

// How fast the teacher's two introduction poses swap — slow and calm, never a
// fast flip-book, since this is a held "listen to me" moment, not an action.
const INTRO_FRAME_MS = 1400;

// The auto tour goes through every picture ONCE, then hands off to `onAllSeen`
// (the celebration) on its own — it never loops by itself. The child can watch
// it all again only by pressing the repeat button on the celebration screen.
const REQUIRED_LAPS = 1;

// px of drag that counts as a deliberate swipe — the touch/mouse manual-step gesture.
const SWIPE_DISTANCE = 55;

// Max gap between the two taps of a double-tap that STOPS the tour — small
// enough that an ordinary single tap never accidentally pauses.
const DOUBLE_TAP_MS = 300;

// Accumulated horizontal wheel delta (a two-finger touchpad swipe) that counts
// as one deliberate step — a swipe arrives as a burst of small deltaX events.
const WHEEL_SWIPE_DISTANCE = 40;

// Level 0 "See, Hear & Know". Tours EVERY picture in the system, one large
// picture per screen. Each "thing" picture is introduced by the teacher first
// ("This is an apple" — her own picture shown, the object hidden) and only
// revealed once she's finished; "action" pictures (the object in a scene) are
// shown directly with their own line, since the object was just introduced.
// The child is in control of the pace:
//   • double-tap the picture to PAUSE (a single tap then resumes the auto-move),
//   • swipe the picture left/right to step through at their own speed,
//   • or use the ← / → arrow keys / a two-finger touchpad swipe (desktop).
// No on-screen arrow buttons at any screen size — swipe/tap/keys are the
// navigation, and pictures always slide left-to-right to match the teacher's
// pointing hand.
// A progress bar fills as pictures are met; once every one has been seen the
// icon-only "ready" button appears so they can move on.
export function DiscoverGallery({
  frames,
  onAllSeen,
  introSrc,
}: DiscoverGalleryProps) {
  // Hold the tour until the intro line has finished, so voices never overlap.
  const [ready, setReady] = useState(!introSrc);
  const [f, setF] = useState(0);
  // +1 = moving forward (next), -1 = back (prev). Drives the slide direction so
  // the picture always animates the same way the child swiped / pressed.
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  // True during the beat AFTER the teacher finishes introducing a "thing" and
  // BEFORE its picture is revealed — she holds a pointing pose that directs the
  // child's eye to where the picture is about to appear ("look over here").
  const [directing, setDirecting] = useState(false);
  // The teacher's flip-book only plays while she is actually talking; she
  // holds a still pose between lines instead of cycling continuously.
  const [speaking, setSpeaking] = useState(isSpeaking);
  useEffect(() => onSpeakingChange(setSpeaking), []);
  // Which frame index has had its picture revealed (only meaningful for
  // "thing" frames — "action" frames have nothing to hide, so they render
  // straight away). `sub` below derives the current intro/reveal phase from
  // this instead of tracking it as its own state.
  const [revealedFrame, setRevealedFrame] = useState<number | null>(
    frames[0]?.kind === "action" ? 0 : null,
  );
  const [seen, setSeen] = useState<boolean[]>(() =>
    frames.map((_, k) => k === 0),
  );

  // Read the latest `paused` inside the (stale-closure) audio callback.
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Read the latest `onAllSeen` inside the audio callback without making it
  // an effect dependency — the parent doesn't memoize it, so putting it in
  // the deps array would restart the naming timers on every parent re-render.
  const onAllSeenRef = useRef(onAllSeen);
  useEffect(() => {
    onAllSeenRef.current = onAllSeen;
  }, [onAllSeen]);

  // Counts full automatic passes through the tour, so the hands-off loop can
  // stop itself after REQUIRED_LAPS instead of cycling forever.
  const lapsRef = useRef(0);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = () => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const speakTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearSpeakTimer = () => {
    if (speakTimer.current !== null) {
      clearTimeout(speakTimer.current);
      speakTimer.current = null;
    }
  };

  const markSeen = useCallback((idx: number) => {
    setSeen((s) => (s[idx] ? s : s.map((v, k) => (k === idx ? true : v))));
  }, []);

  const step = useCallback(
    (delta: number) => {
      clearTimer();
      setDirecting(false); // leaving this frame — drop any held pointing pose
      setDirection(delta >= 0 ? 1 : -1); // slide the way we're moving
      setF((prev) => {
        const idx = (prev + delta + frames.length) % frames.length;
        markSeen(idx);
        return idx;
      });
    },
    [frames.length, markSeen],
  );

  const goNext = useCallback(() => step(1), [step]);
  const goPrev = useCallback(() => step(-1), [step]);

  // Move on after a picture's been named — unless that picture was the last
  // one of a lap and the tour has now gone all the way through REQUIRED_LAPS
  // times, in which case hand off to `onAllSeen` instead of looping again.
  // A single mid-tour encouragement plays as the second lap begins, so the
  // tour reads less like a flashcard drill and more like a teacher talking.
  const advanceOrFinish = useCallback(() => {
    const wasLastOfLap = f === frames.length - 1;
    if (wasLastOfLap) lapsRef.current += 1;
    if (lapsRef.current >= REQUIRED_LAPS) onAllSeenRef.current();
    else if (wasLastOfLap && lapsRef.current === 1) {
      playVoice("/audio/instructions/step0/great-looking.mp3", goNext);
    } else {
      goNext();
    }
  }, [f, frames.length, goNext]);

  // Play the "what we will do" intro once, then release the tour.
  useEffect(() => {
    if (!introSrc) return;
    playVoice(introSrc, () => setReady(true));
    // playVoice always calls back (even on a missing file), so we always release.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drive the current frame: a "thing" picture is introduced by the teacher
  // first (object hidden) and only revealed once she's finished speaking; an
  // "action" picture is shown directly and named as it appears. Either way,
  // when auto-playing, the next frame is queued once the reveal has had its
  // look-at-it pause.
  useEffect(() => {
    if (!ready) return;
    clearTimer();
    clearSpeakTimer();
    const frame = frames[f];
    if (!frame) return;

    if (frame.kind === "thing") {
      speakTimer.current = setTimeout(() => {
        playVoice(frame.audio, () => {
          // She's said "This is an apple" — now point to where it will appear.
          setDirecting(true);
          timer.current = setTimeout(() => {
            setDirecting(false);
            setRevealedFrame(f);
            if (!pausedRef.current)
              timer.current = setTimeout(advanceOrFinish, AFTER_NAME_PAUSE_MS);
          }, INTRO_REVEAL_PAUSE_MS);
        });
      }, IMAGE_ENTER_DELAY_MS);
    } else {
      speakTimer.current = setTimeout(() => {
        playVoice(frame.audio, () => {
          if (!pausedRef.current)
            timer.current = setTimeout(advanceOrFinish, AFTER_NAME_PAUSE_MS);
        });
      }, IMAGE_ENTER_DELAY_MS);
    }

    return () => {
      stopVoice();
      clearTimer();
      clearSpeakTimer();
    };
  }, [f, ready, frames, advanceOrFinish]);

  // Tap the picture: pause the auto-move, or resume it if already paused.
  // (Only reachable during "reveal" — there's nothing to tap during the
  // teacher's introduction.)
  const togglePause = useCallback(() => {
    setPaused((p) => {
      const next = !p;
      if (next)
        clearTimer(); // pausing — cancel any queued advance
      else timer.current = setTimeout(advanceOrFinish, AFTER_NAME_PAUSE_MS); // resuming — carry on
      return next;
    });
  }, [advanceOrFinish]);

  // Stepping with the arrows always hands control to the child (pause auto-move).
  const handlePrev = useCallback(() => {
    setPaused(true);
    goPrev();
  }, [goPrev]);
  const handleNext = useCallback(() => {
    setPaused(true);
    goNext();
  }, [goNext]);

  // Swipe the picture — the only way to step through manually (no arrow
  // buttons at any size). Distinguishes a drag from a tap so togglePause
  // doesn't fire after a swipe.
  const dragging = useRef(false);
  // Swipe LEFT (fling the current picture away to the left) advances to the
  // next one — the standard carousel gesture, and the picture then slides the
  // same way the finger moved. Swipe right goes back.
  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const swipe = info.offset.x;
      if (swipe < -SWIPE_DISTANCE) handleNext();
      else if (swipe > SWIPE_DISTANCE) handlePrev();
      setTimeout(() => (dragging.current = false), 0);
    },
    [handleNext, handlePrev],
  );

  // Stopping the tour needs a deliberate DOUBLE tap — a single stray tap (or the
  // click that ends a swipe) must never pause it. Once stopped, a single tap
  // resumes, matching the spoken "tap the picture to keep going" hint.
  const lastTap = useRef(0);
  const handlePictureTap = useCallback(() => {
    if (dragging.current) return; // this "click" was really the end of a swipe
    if (pausedRef.current) {
      lastTap.current = 0;
      togglePause(); // already stopped — one tap continues
      return;
    }
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      togglePause(); // second tap of a double-tap — stop the tour
    } else {
      lastTap.current = now; // first tap — wait to see if a second follows
    }
  }, [togglePause]);

  // Extra manual navigation for older children / desktop: the ← / → arrow keys
  // and a two-finger horizontal touchpad swipe just step through the pictures.
  // Unlike tapping the picture, these do NOT stop the tour — they only jump to
  // another picture and the auto-play carries on from there.
  useEffect(() => {
    if (!ready) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };

    // A two-finger horizontal touchpad swipe arrives as a stream of wheel events
    // carrying deltaX; accumulate until one direction clears the threshold, fire
    // a single step, then ignore the rest of that gesture until the wheel settles.
    let accX = 0;
    let cooling = false;
    let settle: ReturnType<typeof setTimeout> | null = null;
    let cooldown: ReturnType<typeof setTimeout> | null = null;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical scroll — leave it
      e.preventDefault();
      if (settle) clearTimeout(settle);
      settle = setTimeout(() => (accX = 0), 200);
      if (cooling) return;
      accX += e.deltaX;
      if (accX > WHEEL_SWIPE_DISTANCE || accX < -WHEEL_SWIPE_DISTANCE) {
        if (accX > 0) goNext();
        else goPrev();
        accX = 0;
        cooling = true;
        cooldown = setTimeout(() => (cooling = false), 400);
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      if (settle) clearTimeout(settle);
      if (cooldown) clearTimeout(cooldown);
    };
  }, [ready, goNext, goPrev]);

  const current = frames[f];
  const seenCount = seen.filter(Boolean).length;
  const allSeen = seenCount >= frames.length;
  const showingIntro = current?.kind === "thing" && revealedFrame !== f;

  // When the child pauses the tour, stay quiet for a moment first — nothing
  // plays immediately. Only if they stay paused do we gently step in: what
  // happened at 5s, then how to continue at 10s and 15s ("tap to keep going" /
  // "or swipe to the next picture").
  useEffect(() => {
    if (!paused || allSeen || showingIntro) return;
    const cues: [number, string][] = [
      [5000, "step0/paused"],
      [10000, "step0/paused-tap"],
      [15000, "step0/paused-swipe"],
    ];
    const ids = cues.map(([ms, clip]) =>
      setTimeout(() => playInstruction(clip), ms),
    );
    return () => ids.forEach(clearTimeout);
  }, [paused, allSeen, showingIntro]);

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-3">
      <div className="relative flex w-full flex-1 items-center justify-center">
        {/* Big picture / teacher introduction — tap to pause/resume, swipe to step.
            No chevron buttons at any screen size — swipe/tap is the only nav. */}
        <div className="relative flex h-[56vh] w-full items-center justify-center overflow-hidden sm:h-[64vh]">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            {showingIntro ? (
              <motion.div
                key={`intro-${f}`}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  {directing ? (
                    // Held "look over here" gesture directing to the incoming
                    // picture (which slides in from the right on a forward step) —
                    // a sign that makes the reveal feel like a real teacher.
                    <Character3D state="pointing" pose={2} flip size="min(46vh, 46vw)" />
                  ) : (
                    <Character3D
                      state="teaching"
                      maxFrames={2}
                      frameMs={INTRO_FRAME_MS}
                      size="min(46vh, 46vw)"
                      animate={speaking}
                    />
                  )}
                </motion.div>
              </motion.div>
            ) : (
              <motion.button
                key={`pic-${f}`}
                type="button"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragStart={() => (dragging.current = true)}
                onDragEnd={handleDragEnd}
                onClick={handlePictureTap}
                aria-label={`${current?.word ?? ""} — swipe for the next picture, ${paused ? "tap to keep going" : "double tap to stop"}`}
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.25 },
                }}
                whileTap={{ scale: 0.98 }}
                className="flex cursor-pointer touch-pan-y items-center justify-center rounded-4xl outline-none"
              >
                <Picture
                  src={current?.image}
                  alt={current?.word ?? ""}
                  className="pointer-events-none max-h-[52vh] w-auto max-w-[92vw] rounded-4xl object-contain drop-shadow-2xl select-none sm:max-h-[62vh]"
                />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Paused cue — a plain pulsing dot at bottom-center (no icon/glyph)
              telling the child a tap will keep the tour going. */}
          <AnimatePresence>
            {paused && !allSeen && !showingIntro && (
              <motion.span
                aria-hidden
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: [1, 1.15, 1] }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ scale: { duration: 1.1, repeat: Infinity, ease: "easeInOut" } }}
                className="pointer-events-none absolute bottom-3 h-5 w-5 rounded-full bg-[#4CAF50] shadow-lg ring-4 ring-white/80"
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Continue: appears only once every picture has been seen. Icon-only. */}
      <div className="grid h-20 place-items-center">
        {allSeen && (
          <motion.button
            type="button"
            onClick={onAllSeen}
            aria-label="I have seen them all — keep going"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.9 }}
            className="grid h-20 w-20 place-items-center rounded-full bg-linear-to-br from-[#4CAF50] to-[#2e9e4f] shadow-lg ring-4 ring-green-200"
          >
            <motion.span
              animate={{ scale: [1, 1.12, 1] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Decor name="star" size={40} />
            </motion.span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
