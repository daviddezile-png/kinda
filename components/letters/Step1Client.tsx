"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Character3D } from "@/components/character/Character3D"
import { RewardSystem, type RewardSystemRef } from "@/components/rewards/RewardSystem"
import { RewardChest, type RewardChestRef } from "@/components/rewards/RewardChest"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { Decor } from "@/components/ui/Decor"
import { MuteToggle } from "@/components/ui/MuteToggle"
import { LetterCard } from "@/components/letters/LetterCard"
import { useStep1Store, PASS_GAMES, TOTAL_GAMES } from "@/store/gameStore"
import { useLanguage } from "@/store/languageStore"
import { getPhrases } from "@/lib/i18n"
import {
  playEncouraging,
  playInstruction,
  playVoice,
  speakCapitalLetter,
  speakSmallLetter,
  speakWord,
  stopVoice,
  whenUnlocked,
  isUnlocked,
} from "@/lib/audio"
import { playSound } from "@/lib/playSound"
import { imagesForLetter } from "@/data/letterImages"
import { DISTRACTORS } from "@/data/distractors"
import { letterVariant, otherLetters } from "@/lib/letterVariants"
import { ALL_REWARDS } from "@/data/rewards"
import { shuffle, randomFrom } from "@/lib/utils"
import { Picture } from "@/components/ui/Picture"
import { PlayfulBackground } from "@/components/ui/PlayfulBackground"
import { FinishButton } from "@/components/student/FinishButton"
import { BigButton } from "@/components/ui/BigButton"
import { Confetti } from "@/components/ui/Confetti"
import type { CharacterState, LetterData, Reward } from "@/types"

const LETTER_INDEX = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

// A short, attractive "you pressed it" cue (not a reward/gift sound). File may be
// absent — playSound swallows a 404, so touching still feels responsive silently.
const TOUCH_SFX = "/audio/sfx/touch.mp3"
const APPLAUSE = "/audio/feedback/applause-wav.wav"

// Timing that keeps voices from ever overlapping and gives the child room to
// respond. One person can't speak two lines at once, so every spoken line is
// separated from the next by at least SPEAK_GAP; after a "say it" / "touch it"
// prompt we wait LISTEN_GAP in silence for the child before nudging again.
const SPEAK_GAP = 2000 // breathing gap between two spoken lines (≤3s)
const LISTEN_GAP = 2500 // silence for the child to answer / touch (was 4s)

// The six games per letter: two on the CAPITAL letter, two on the SMALL letter,
// two on PICTURES that start with the letter. Each pair uses a different letter
// style so the child learns the shape, not one memorised image.
type GameKind = "capital" | "small" | "image"
const GAME_KINDS: GameKind[] = ["capital", "capital", "small", "small", "image", "image"]

interface Option {
  id: string
  image: string
  correct: boolean
  /** Spoken/aria label for the option. */
  label: string
}

interface Step1ClientProps {
  letterData: LetterData
}

// Level 1, ONE letter, fully voice-driven. Flow (each step advances when its
// voice line ends, backed by a fallback timer so missing audio never freezes):
//   teachCapital → touchCapital → teachSmall → touchSmall → toGames
//   → 6 games (win a gift each; a wrong answer costs one gift, once per game)
//   → tally (all gifts) → celebrate (claps). Win < 4 games ⇒ the letter repeats.
export function Step1Client({ letterData }: Step1ClientProps) {
  const rewardRef = useRef<RewardSystemRef>(null)
  const chestRef = useRef<RewardChestRef>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const started = useRef(false)
  // Forward reference so the celebration can restart the whole letter without a
  // useCallback dependency cycle.
  const restartRef = useRef<() => void>(() => {})

  const phase = useStep1Store((s) => s.phase)
  const earnedRewards = useStep1Store((s) => s.earnedRewards)
  const gamesWon = useStep1Store((s) => s.gamesWon)
  const setPhase = useStep1Store((s) => s.setPhase)
  const addReward = useStep1Store((s) => s.addReward)
  const removeReward = useStep1Store((s) => s.removeReward)
  const winGame = useStep1Store((s) => s.winGame)
  const reset = useStep1Store((s) => s.reset)
  const replay = useStep1Store((s) => s.replay)

  const [character, setCharacter] = useState<CharacterState>("idle")
  const [pointingAt, setPointingAt] = useState(false)
  const [canTouch, setCanTouch] = useState(false)
  const [gameIndex, setGameIndex] = useState(0)
  const [options, setOptions] = useState<Option[]>([])
  const [wrongPicks, setWrongPicks] = useState<string[]>([])
  const [canPick, setCanPick] = useState(false)
  // During the very first beat the teacher stands centre-stage with NO letter
  // shown yet (she introduces it first); then the card appears beside her.
  const [letterVisible, setLetterVisible] = useState(false)
  // On a fresh load/refresh the browser blocks audio until the child taps, so
  // we hold the lesson behind a gentle "tap to start" veil until then.
  const [locked, setLocked] = useState(false)
  // On the celebration screen, once it's time to move on the teacher switches to
  // the "pointing down" figure that directs the child to the button below.
  const [guideDown, setGuideDown] = useState(false)

  const lostThisGame = useRef(false)
  const giftQueue = useRef<Reward[]>([])
  // How many times the child has touched the big letter in the current touch
  // step (we ask three times: touch, again, one more), and a repeating nudge
  // that re-asks every LISTEN_GAP until they do.
  const touchCount = useRef(0)
  const reprompt = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearReprompt = useCallback(() => {
    if (reprompt.current !== null) {
      clearTimeout(reprompt.current)
      reprompt.current = null
    }
  }, [])
  // Forward ref so buildGame's skip-branch can recurse into the next game
  // without a useCallback dependency cycle (set from an effect below).
  const goToGameRef = useRef<(index: number) => void>(() => {})
  const earnedRef = useRef(earnedRewards)
  useEffect(() => {
    earnedRef.current = earnedRewards
  }, [earnedRewards])

  const t = getPhrases(useLanguage((s) => s.lang))
  const letter = letterData.letter.toUpperCase()
  const lower = letterData.lowercase
  const lowerKey = letter.toLowerCase()
  const letterNumber = LETTER_INDEX.indexOf(letter) + 1

  const pics = useMemo(() => imagesForLetter(letter), [letter])

  const schedule = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay)
    timers.current.push(id)
  }, [])

  // Run `fn` exactly once — when the voice line ends, or via the fallback timer.
  const once = useCallback(
    (fn: () => void, fallbackMs: number) => {
      let done = false
      const run = () => {
        if (done) return
        done = true
        fn()
      }
      schedule(run, fallbackMs)
      return run
    },
    [schedule],
  )

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  useEffect(() => {
    reset()
    return () => {
      timers.current.forEach(clearTimeout)
      if (reprompt.current !== null) clearTimeout(reprompt.current)
      stopVoice()
    }
  }, [reset])

  // Next gift to award — a per-letter shuffled queue so wins feel varied.
  const nextGift = useCallback((): Reward => {
    if (giftQueue.current.length === 0) giftQueue.current = shuffle(ALL_REWARDS)
    return giftQueue.current.shift() as Reward
  }, [])

  // ── Build one game's four options ────────────────────────────────────────
  const buildGame = useCallback(
    (index: number): Option[] | null => {
      const kind = GAME_KINDS[index]
      if (kind === "image") {
        if (pics.length === 0) return null
        const correct = randomFrom(pics)
        const wrong = shuffle(
          DISTRACTORS.filter((d) => !d.word.toUpperCase().startsWith(letter)),
        ).slice(0, 3)
        return shuffle([
          { id: "correct", image: correct.image, correct: true, label: correct.word },
          ...wrong.map((d, i) => ({ id: `w${i}`, image: d.image, correct: false, label: d.word })),
        ])
      }
      const c = kind === "capital" ? "upper" : "lower"
      // Two rounds of each case → style variant 1 then 2 (wraps if fewer exist).
      const styleIdx = index % 2 === 0 ? 1 : 2
      const shown = kind === "capital" ? letter : lower
      const correct: Option = {
        id: "correct",
        image: letterVariant(letter, c, styleIdx),
        correct: true,
        label: `letter ${shown}`,
      }
      const wrong = otherLetters(letter, c, 3).map((o, i) => ({
        id: `w${i}`,
        image: o.image,
        correct: false,
        label: `letter ${o.letter}`,
      }))
      return shuffle([correct, ...wrong])
    },
    [letter, lower, pics],
  )

  // ── Celebration (with repeat-or-continue decision) ───────────────────────
  const startCelebrate = useCallback(() => {
    setPhase("celebrate")
    setCharacter("celebrating")
    setPointingAt(false)
    setCanPick(false)
    setGuideDown(false)
    const passed = useStep1Store.getState().gamesWon >= PASS_GAMES
    // Others clap FOR the child (applause) — we never tell the child to clap. The
    // spoken lines wait until the applause has finished, then follow one after
    // another; when it's time to move on the teacher points DOWN at the button.
    playSound(
      APPLAUSE,
      0.9,
      once(
        () =>
          playInstruction(
            `step1/learned-${lowerKey}`,
            once(() => {
              if (passed) {
                schedule(() => {
                  setGuideDown(true) // teacher points down at the two buttons
                  // Two buttons sit below: the round arrow repeats the letter,
                  // the star moves on. Name BOTH (not just "tap the star").
                  playInstruction("step1/finish-buttons")
                }, SPEAK_GAP)
              } else {
                // Not enough games won — learn the whole letter again.
                schedule(
                  () =>
                    playInstruction(
                      "step1/try-again-letter",
                      once(() => restartRef.current(), 5000),
                    ),
                  SPEAK_GAP,
                )
              }
            }, 5000),
          ),
        6000,
      ),
    )
  }, [lowerKey, once, schedule, setPhase])

  // ── Gift tally, then celebration ─────────────────────────────────────────
  const startTally = useCallback(() => {
    setPhase("tally")
    setCharacter("happy")
    setPointingAt(false)
    setCanPick(false)
    // "Look at all the gifts you collected! I am so proud of you!"
    playInstruction("step1/look-gifts", once(startCelebrate, 6000))
  }, [once, setPhase, startCelebrate])

  // Forward refs so handlePick / handleLetterTouch can reach the next phase
  // without a useCallback dependency cycle (set from effects below).
  const startTeachSmallRef = useRef<() => void>(() => {})
  const startGamesIntroRef = useRef<() => void>(() => {})
  // The instruction to repeat while the child hasn't answered the current game.
  const gamePromptRef = useRef<string>("")

  // ── Voice helpers — one voice at a time, always a gap between lines ───────
  // Speak one line, then run `next` after a breathing gap (never overlapping).
  const sayThen = useCallback(
    (path: string, next?: () => void, gap = SPEAK_GAP, fallback = 3000) => {
      playInstruction(path, once(() => { if (next) schedule(next, gap) }, fallback))
    },
    [once, schedule],
  )

  // Speak the case-letter name ("Capital letter D" / "Small letter d"), gap, next.
  const sayLetterThen = useCallback(
    (upper: boolean, next: () => void, gap = SPEAK_GAP) => {
      const speak = upper ? speakCapitalLetter : speakSmallLetter
      speak(upper ? letter : lower, once(() => schedule(next, gap), 2500))
    },
    [letter, lower, once, schedule],
  )

  // One "you say it" turn: prompt → gap → the letter → LISTEN_GAP (child speaks) → next.
  const sayTurn = useCallback(
    (upper: boolean, promptPath: string, next: () => void) => {
      playInstruction(
        promptPath,
        once(() => schedule(() => {
          const speak = upper ? speakCapitalLetter : speakSmallLetter
          speak(upper ? letter : lower, once(() => schedule(next, LISTEN_GAP), 2500))
        }, SPEAK_GAP), 3000),
      )
    },
    [letter, lower, once, schedule],
  )

  // Re-ask the same line every LISTEN_GAP until cleared — used whenever we are
  // waiting on the child to touch/answer, so a stuck child is gently nudged.
  const armReprompt = useCallback(
    (path: string) => {
      clearReprompt()
      const again = () => {
        playInstruction(path, once(() => { reprompt.current = setTimeout(again, LISTEN_GAP) }, 2500))
      }
      reprompt.current = setTimeout(again, LISTEN_GAP)
    },
    [clearReprompt, once],
  )

  // Ask for one of the three touches (touch → again → one more) and start nudging.
  const beginTouchStep = useCallback(
    (step: number, upper: boolean) => {
      setCanTouch(true)
      if (step === 0) {
        // "Now we are going to touch the letter!" → name it → keep nudging.
        playInstruction("step1/now-touch-letter", once(() => schedule(() => {
          const speak = upper ? speakCapitalLetter : speakSmallLetter
          speak(upper ? letter : lower, once(() => armReprompt("step1/touch-the-letter"), 2500))
        }, SPEAK_GAP), 3000))
      } else {
        const path = step === 1 ? "step1/touch-again" : "step1/touch-one-more"
        playInstruction(path, once(() => armReprompt(path), 2500))
      }
    },
    [armReprompt, letter, lower, once, schedule],
  )

  // Enter the touch phase for a case, right after teaching/saying it.
  const enterTouch = useCallback(
    (upper: boolean) => {
      setPhase(upper ? "touchCapital" : "touchSmall")
      setPointingAt(true) // point at the letter while asking the child to touch it
      touchCount.current = 0
      beginTouchStep(0, upper)
    },
    [beginTouchStep, setPhase],
  )

  // ── Advance after a game is finished (won or skipped) ────────────────────
  const goToGame = useCallback(
    (index: number) => {
      if (index >= TOTAL_GAMES) {
        startTally()
        return
      }
      const opts = buildGame(index)
      if (!opts) {
        // Can't build this game (no pictures for the letter) — count it as won
        // so the child is never blocked, and move on.
        winGame()
        goToGameRef.current(index + 1)
        return
      }
      setGameIndex(index)
      setOptions(opts)
      setWrongPicks([])
      lostThisGame.current = false
      clearReprompt()
      setPhase("game")
      setCharacter("watching")
      setPointingAt(true)
      setCanPick(false)

      const kind = GAME_KINDS[index]
      // The short "touch the …" line we repeat every 4s until the child answers.
      const promptPath =
        kind === "capital"
          ? "step1/find-the-capital"
          : kind === "small"
            ? "step1/lets-find-small"
            : `step2/touch-picture-${lowerKey}`
      gamePromptRef.current = promptPath
      const enable = once(() => {
        setPointingAt(false)
        setCanPick(true)
        armReprompt(promptPath) // keep nudging until they pick
      }, 5000)
      if (kind === "capital") {
        playInstruction("step1/find-the-capital", () => speakCapitalLetter(letter, enable))
      } else if (kind === "small") {
        playInstruction("step1/lets-find-small", () => speakSmallLetter(lower, enable))
      } else {
        playInstruction(`step2/touch-picture-${lowerKey}`, enable)
      }
    },
    [armReprompt, buildGame, clearReprompt, letter, lower, lowerKey, once, setPhase, startTally, winGame],
  )
  useEffect(() => {
    goToGameRef.current = goToGame
  }, [goToGame])

  // ── Child answers a game ─────────────────────────────────────────────────
  const handlePick = useCallback(
    (opt: Option) => {
      if (!canPick || wrongPicks.includes(opt.id)) return
      clearReprompt()
      if (opt.correct) {
        setCanPick(false)
        setCharacter("excited")
        winGame()
        const gift = nextGift()
        rewardRef.current?.giveReward(gift) // flies to basket → addReward on land
        // "You win a gift!" → 1s → "<gift name>" → 1s → "See it go into your basket!"
        const GIFT_GAP = 1000
        playInstruction(
          "step1/you-win",
          once(() => schedule(() =>
            speakWord(
              gift.name,
              once(() => schedule(() =>
                playInstruction(
                  "step1/see-basket",
                  once(() => schedule(() => goToGameRef.current(gameIndex + 1), 1000), 4000),
                ), GIFT_GAP), 3000),
            ), GIFT_GAP), 4000),
        )
      } else {
        setWrongPicks((w) => [...w, opt.id])
        setCharacter("sad")
        // After the encouragement, wait then keep nudging with the game prompt.
        const recover = once(() => {
          setCharacter("watching")
          armReprompt(gamePromptRef.current)
        }, 4000)
        if (!lostThisGame.current && earnedRef.current.length > 0) {
          lostThisGame.current = true
          removeReward()
          chestRef.current?.shake()
          // "Oh no! We lost one gift. Let's try again!"
          playInstruction("step1/lost-gift", recover)
        } else {
          playEncouraging(recover)
        }
      }
    },
    [armReprompt, canPick, clearReprompt, gameIndex, nextGift, once, removeReward, schedule, winGame, wrongPicks],
  )

  // ── "Now let's play games!" bridge ───────────────────────────────────────
  const startGamesIntro = useCallback(() => {
    clearReprompt()
    setPhase("toGames")
    setCharacter("excited")
    setPointingAt(false)
    setCanTouch(false)
    setLetterVisible(false)
    playInstruction("step1/lets-play-games", once(() => schedule(() => goToGameRef.current(0), SPEAK_GAP), 4000))
  }, [clearReprompt, once, schedule, setPhase])
  useEffect(() => {
    startGamesIntroRef.current = startGamesIntro
  }, [startGamesIntro])

  // ── Teach the SMALL letter ───────────────────────────────────────────────
  // "Now let's learn the small letter!" → "Small letter d" → say it three times
  // (with a listening gap each) → positive → touch it three times.
  const startTeachSmall = useCallback(() => {
    clearReprompt()
    touchCount.current = 0
    setPhase("teachSmall")
    setCanTouch(false)
    setPointingAt(false)
    setCharacter("watching") // watch the child while saying the letter
    sayThen("step1/now-small", () =>
      sayLetterThen(false, () =>
        sayTurn(false, "step1/say-it", () =>
          sayTurn(false, "step1/say-again", () =>
            sayTurn(false, "step1/say-one-more", () =>
              playVoice(
                "/audio/feedback/positive/excellent.mp3",
                once(() => enterTouch(false), 3500),
              ),
            ),
          ),
        ),
      ),
    )
  }, [clearReprompt, enterTouch, once, sayLetterThen, sayThen, sayTurn, setPhase])
  useEffect(() => {
    startTeachSmallRef.current = startTeachSmall
  }, [startTeachSmall])

  // ── Child touches the big letter card (touch → again → one more) ──────────
  const handleLetterTouch = useCallback(() => {
    if (!canTouch) return
    setCanTouch(false)
    clearReprompt()
    playSound(TOUCH_SFX, 0.8) // attractive touch cue — NO gift during teaching
    const upper = phase === "touchCapital"
    const n = touchCount.current + 1
    touchCount.current = n
    if (n < 3) {
      setCharacter("happy")
      schedule(() => beginTouchStep(n, upper), 1400) // "Touch it again" / "…one more"
    } else {
      touchCount.current = 0
      setCharacter("excited")
      setPointingAt(false)
      // Positive word, a 2s beat, then the small letter (or the games).
      playVoice(
        `/audio/feedback/positive/${upper ? "brilliant" : "wonderful"}.mp3`,
        once(() => schedule(() => {
          if (upper) startTeachSmallRef.current()
          else startGamesIntroRef.current()
        }, 2000), 3000),
      )
    }
  }, [beginTouchStep, canTouch, clearReprompt, once, phase, schedule])

  // ── Teach the CAPITAL letter (entry point / repeat target) ───────────────
  // Teacher stands centre-stage with NO letter first (intro), then the card
  // appears beside her and she names it, has the child say it three times, gives
  // a positive word, and moves on to touching it three times.
  const startTeachCapital = useCallback(() => {
    clearReprompt()
    touchCount.current = 0
    setPhase("teachCapital")
    setCanTouch(false)
    setPointingAt(false)
    setLetterVisible(false)
    setCharacter("teaching")
    sayThen("step1/new-letter-intro", () => {
      setLetterVisible(true)
      setPointingAt(false)
      setCharacter("watching") // watch the child while she names / they say the letter
      sayThen(`step1/learn-${lowerKey}`, () =>
        sayLetterThen(true, () =>
          sayTurn(true, "step1/say-it", () =>
            sayTurn(true, "step1/say-again", () =>
              sayTurn(true, "step1/say-one-more", () =>
                playVoice(
                  "/audio/feedback/positive/brilliant.mp3",
                  once(() => enterTouch(true), 3500),
                ),
              ),
            ),
          ),
        ),
      )
    })
  }, [clearReprompt, enterTouch, lowerKey, once, sayLetterThen, sayThen, sayTurn, setPhase])

  // Restart the whole letter (used by the celebration when too few games won).
  const restart = useCallback(() => {
    clearTimers()
    clearReprompt()
    stopVoice()
    replay()
    giftQueue.current = []
    touchCount.current = 0
    setGameIndex(0)
    setWrongPicks([])
    setLetterVisible(false)
    setCharacter("idle")
    schedule(startTeachCapital, 900)
  }, [clearReprompt, clearTimers, replay, schedule, startTeachCapital])
  useEffect(() => {
    restartRef.current = restart
  }, [restart])

  // Kick the lesson off once on mount — but WAIT for the first tap if the
  // browser hasn't unlocked audio yet (fresh load / refresh). Otherwise the
  // opening lines would be silently dropped and nothing would happen until the
  // child pressed "hear it again". If audio is already unlocked (the child
  // tapped their way here), it starts immediately.
  useEffect(() => {
    if (started.current) return
    setLocked(!isUnlocked())
    const begin = () => {
      if (started.current) return
      started.current = true
      setLocked(false)
      schedule(startTeachCapital, 500)
    }
    // Defer the kickoff by a tick. When audio is ALREADY unlocked (the child
    // tapped their way in from the map) whenUnlocked runs begin() synchronously,
    // and in dev React Strict Mode's mount → cleanup → mount would start the
    // lesson then tear its opening timer down (via the reset effect's cleanup)
    // with the `started` guard blocking a restart — a frozen, silent letter.
    // Deferring lets the throw-away mount cancel the pending start; the real
    // mount then fires it once. (A fresh load is locked, so this waits for the
    // unlock tap and never arms early.)
    let kick: ReturnType<typeof setTimeout> | null = null
    const off = whenUnlocked(() => {
      kick = setTimeout(begin, 0)
    })
    return () => {
      off()
      if (kick) clearTimeout(kick)
    }
  }, [schedule, startTeachCapital])

  // Manual "start the whole letter again" from the celebration buttons.
  const handleRepeat = useCallback(() => {
    playInstruction("step1/one-more-time")
    restart()
  }, [restart])

  const letterPhase =
    phase === "teachCapital" ||
    phase === "touchCapital" ||
    phase === "teachSmall" ||
    phase === "touchSmall"
  const showLowercase = phase === "teachSmall" || phase === "touchSmall"
  const glowing = canTouch && (phase === "touchCapital" || phase === "touchSmall")
  const gameKind = GAME_KINDS[gameIndex]
  const gamePrompt =
    gameKind === "capital" ? t.findCapital : gameKind === "small" ? t.findSmall : t.findPicture(letter)
  const passed = gamesWon >= PASS_GAMES
  // Whether anything sits BESIDE the teacher. During the opening intro she is
  // alone centre-stage (no letter yet), so nothing is beside her.
  const showSide = (letterPhase && letterVisible) || phase === "game"

  return (
    <div
      className="relative flex h-dvh flex-col overflow-hidden"
      style={{ backgroundColor: letterData.backgroundColor }}
    >
      <RewardSystem ref={rewardRef} onRewardGiven={addReward} chestRef={chestRef} />
      <RewardChest ref={chestRef} rewards={earnedRewards} />
      <PlayfulBackground />

      {/* Top bar: home · sound · progress. Sound sits on the LEFT next to Home so
          it never sits under the fixed reward chest in the top-right corner; the
          header also reserves right padding so the progress bar clears the chest. */}
      <header className="relative z-10 flex items-center gap-3 px-3 py-2 pr-20 sm:gap-4 sm:px-4 sm:py-3 sm:pr-24">
        <Link
          href="/student"
          className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold text-gray-600 sm:px-4 sm:py-2 sm:text-sm"
        >
          <span className="inline-flex items-center gap-1.5">
            <Decor name="home" size={16} />
            {t.home}
          </span>
        </Link>
        <MuteToggle className="h-11 w-11 shrink-0" />
        <ProgressBar current={letterNumber} total={26} step={1} totalSteps={4} />
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-2 pb-2 sm:px-4">
        {phase === "celebrate" ? (
          /* ── Celebration ── */
          <div className="flex flex-col items-center gap-3 sm:gap-5">
            <Confetti />
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 180, damping: 14 }}
              style={{ width: "clamp(12rem, 46vmin, 20rem)", aspectRatio: "1" }}
            >
              {guideDown ? (
                // Teacher pointing DOWN at the button below (no clapping figure
                // here — others clap for the child; she just shows the button).
                <motion.img
                  src="/images/character/3d/discover-point-down.png"
                  alt=""
                  aria-hidden
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="h-full w-full object-contain drop-shadow-xl"
                />
              ) : (
                <Character3D state="celebrating" size="100%" />
              )}
            </motion.div>
            <p className="text-center text-xl font-black text-gray-700 sm:text-3xl">
              {t.greatJobLetter(letter)}
            </p>
            {passed ? (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <BigButton onClick={handleRepeat} ariaLabel={t.startOver}>
                  <Decor name="repeat" size={30} />
                </BigButton>
                {/* Star icon (not the word "Next") — matches the spoken
                    "touch the star" cue and stays wordless for pre-readers. */}
                <FinishButton letter={letter} level={1} sign ariaLabel={t.next}>
                  <Decor name="star" size={32} />
                </FinishButton>
              </div>
            ) : (
              <p className="text-center text-base font-bold text-gray-500 sm:text-lg">
                {t.startOver}…
              </p>
            )}
          </div>
        ) : phase === "tally" ? (
          /* ── Gift tally: every gift the child collected ── */
          <div className="flex w-full max-w-3xl flex-col items-center gap-4">
            <p className="text-center text-xl font-black text-gray-700 sm:text-3xl">{t.yourGifts}</p>
            {earnedRewards.length === 0 ? (
              <div style={{ width: "clamp(9rem, 34vmin, 14rem)", aspectRatio: "1" }}>
                <Character3D state="happy" size="100%" />
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                {earnedRewards.map((r, i) => (
                  <motion.div
                    key={`${r.id}-${i}`}
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: i * 0.12, type: "spring", stiffness: 220, damping: 15 }}
                    className="rounded-3xl bg-white/85 p-2 shadow-lg ring-2 ring-white/70"
                  >
                    <span className="block" style={{ width: "clamp(4.5rem, 16vmin, 7rem)", aspectRatio: "1" }}>
                      <Picture src={r.image} alt={r.name} className="h-full w-full object-contain" />
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── Teacher on the LEFT, lesson content beside her (she points RIGHT) ── */
          <div className="flex w-full max-w-5xl items-center justify-center gap-1 sm:gap-6">
            <motion.div
              animate={pointingAt ? { y: [0, -5, 0] } : {}}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="shrink-0"
              style={{ width: "clamp(6.5rem, 28vmin, 14rem)", aspectRatio: "1" }}
            >
              <Character3D
                state={pointingAt ? "pointing" : character}
                pose={pointingAt ? 2 : undefined}
                flip={pointingAt}
                size="100%"
              />
            </motion.div>

            {showSide && (
            <div className="flex min-w-0 flex-1 flex-col items-center gap-2 sm:gap-4">
              {letterPhase && letterVisible && (
                <LetterCard
                  letter={letter}
                  lowercase={lower}
                  color={letterData.color}
                  isGlowing={glowing}
                  showLowercase={showLowercase}
                  onTouch={handleLetterTouch}
                />
              )}

              {phase === "game" && (
                <div className="flex w-full flex-col items-center gap-2 sm:gap-4">
                  <p className="text-center text-base font-black text-gray-700 sm:text-2xl">
                    {gamePrompt}
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:gap-5">
                    {options.map((opt) => {
                      const wrong = wrongPicks.includes(opt.id)
                      return (
                        <motion.button
                          key={opt.id}
                          type="button"
                          onClick={() => handlePick(opt)}
                          whileTap={{ scale: 0.93 }}
                          animate={wrong ? { x: [0, -8, 8, -6, 6, 0] } : {}}
                          className={`rounded-3xl bg-white/85 p-2 shadow-lg ring-2 ring-white/70 transition-opacity sm:p-3 ${
                            wrong ? "opacity-30 grayscale" : ""
                          }`}
                          aria-label={opt.label}
                          disabled={wrong}
                        >
                          <span
                            className="relative block"
                            style={{ width: "clamp(7rem, 26vmin, 12rem)", aspectRatio: "1" }}
                          >
                            <Image
                              src={opt.image}
                              alt={opt.label}
                              fill
                              sizes="(max-width: 640px) 26vw, 12rem"
                              draggable={false}
                              className="select-none object-contain"
                            />
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>
                  {/* Game progress: 6 dots */}
                  <div className="flex gap-1.5">
                    {GAME_KINDS.map((_, i) => (
                      <span
                        key={i}
                        className="h-2.5 w-2.5 rounded-full transition-colors"
                        style={{
                          backgroundColor: i <= gameIndex ? letterData.color : "rgba(0,0,0,0.15)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        )}
      </main>

      {/* Tap-to-start veil: on a fresh load the browser blocks audio until the
          child touches the screen, so we invite that first tap instead of
          starting the lesson silently. Any tap anywhere unlocks audio (see
          lib/audio) and the veil disappears as the lesson begins. Voice-only —
          a pre-reader can't read a label, so the only cue is the beckoning,
          pulsing teacher; the spoken lesson starts the instant she is tapped. */}
      {locked && (
        <button
          type="button"
          onClick={() => setLocked(false)}
          aria-label={t.startOver}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-white/60 backdrop-blur-sm"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: "clamp(9rem, 34vmin, 14rem)", aspectRatio: "1" }}
          >
            <Character3D state="welcome" size="100%" />
          </motion.div>
        </button>
      )}

      {/* Replay-the-letter-voice button during the teaching phases */}
      {letterPhase && letterVisible && (
        <footer className="relative z-10 flex justify-center px-4 pb-3 sm:pb-5">
          <button
            type="button"
            onClick={() => (showLowercase ? speakSmallLetter(lower) : speakCapitalLetter(letter))}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-1.5 text-sm font-bold text-gray-600 shadow transition-transform active:scale-95 sm:px-5 sm:py-2 sm:text-base"
          >
            <Decor name="sound-on" size={16} /> {t.hearAgain}
          </button>
        </footer>
      )}
    </div>
  )
}
