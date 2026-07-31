"use client"

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react"
import Link from "next/link"
import { RewardSystem, type RewardSystemRef } from "@/components/rewards/RewardSystem"
import { RewardChest, type RewardChestRef } from "@/components/rewards/RewardChest"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { PlayfulBackground } from "@/components/ui/PlayfulBackground"
import { Decor } from "@/components/ui/Decor"
import { LevelIntro } from "@/components/ui/LevelIntro"
import { MuteToggle } from "@/components/ui/MuteToggle"
import { MemoryCardGame } from "@/components/games/MemoryCardGame"
import { LetterPuzzle } from "@/components/games/LetterPuzzle"
import { FeedCharacter } from "@/components/games/FeedCharacter"
import { TapLetter } from "@/components/games/TapLetter"
import { BuildWord } from "@/components/games/BuildWord"
import { MatchPicture } from "@/components/games/MatchPicture"
import { CatchBucket } from "@/components/games/CatchBucket"
import { SingAlong } from "@/components/games/SingAlong"
import { SeeAndWrite } from "@/components/games/SeeAndWrite"
import { GameCompletionScreen } from "@/components/games/GameCompletionScreen"
import { shuffle } from "@/lib/utils"
import { useLanguage } from "@/store/languageStore"
import { getPhrases } from "@/lib/i18n"
import { playInstruction, playPositive, speakWord } from "@/lib/audio"
import type { LetterData, Reward } from "@/types"
import type { GameProps } from "./gameTypes"

const GAME_COMPONENTS: Record<string, ComponentType<GameProps>> = {
  memory_cards: MemoryCardGame,
  letter_puzzle: LetterPuzzle,
  feed_character: FeedCharacter,
  tap_letter: TapLetter,
  build_word: BuildWord,
  match_picture: MatchPicture,
  catch_bucket: CatchBucket,
  sing_along: SingAlong,
  see_and_write: SeeAndWrite,
}

const ALL_GAMES = Object.keys(GAME_COMPONENTS)
const GAMES_PER_SESSION = 3

// Only offer games the letter actually has content for (some letters — mostly
// Swahili ones — have no artwork for picture-driven games).
function playableGames(letterData: LetterData): string[] {
  return ALL_GAMES.filter((game) => {
    switch (game) {
      case "memory_cards":
        return letterData.games.memory_cards.pairs.length >= 2
      case "match_picture":
        return letterData.games.match_picture.rounds.length > 0
      case "feed_character":
      case "catch_bucket":
        return letterData.games.feed_character.correctItems.length > 0
      case "build_word":
        return letterData.games.build_word.words.length > 0
      case "sing_along":
        return letterData.song.lyricsLines.length > 0
      case "see_and_write":
        return letterData.words.some((w) => w.image)
      default:
        return true // tap_letter and letter_puzzle only need the letter itself
    }
  })
}

interface GameSelectorProps {
  letterData: LetterData
}

export function GameSelector({ letterData }: GameSelectorProps) {
  const rewardRef = useRef<RewardSystemRef>(null)
  const chestRef = useRef<RewardChestRef>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const chosen = useMemo(
    () => shuffle(playableGames(letterData)).slice(0, GAMES_PER_SESSION),
    [letterData]
  )
  const [index, setIndex] = useState(0)
  const [stars, setStars] = useState(0)
  const [finished, setFinished] = useState(false)
  // Teacher's welcome to the game room plays before any game makes a sound.
  const [introDone, setIntroDone] = useState(false)
  const t = getPhrases(useLanguage((s) => s.lang))

  // Spoken intro: "Let's play a game!" on the first game, "Here we go!" after.
  useEffect(() => {
    if (introDone && !finished) playInstruction(index === 0 ? "games/lets-play" : "games/here-we-go")
  }, [index, finished, introDone])

  // A game earned the child a gift: fly it in, then cheer and NAME it out loud
  // ("Great job! … Apple!") — the same "say which gift you got" the letters
  // lesson does. Every game routes its reward through here so the announcement
  // is consistent (games no longer speak their own praise on a win). When a gift
  // is already flying, giveReward returns undefined and we stay quiet.
  const handleReward = () => {
    const gift = rewardRef.current?.giveReward()
    if (gift) playPositive(() => speakWord(gift.name))
  }

  const handleComplete = (gameStars: number) => {
    setStars((prev) => prev + gameStars)
    if (index + 1 < chosen.length) setIndex((i) => i + 1)
    else setFinished(true)
  }

  const CurrentGame = GAME_COMPONENTS[chosen[index]]

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden" style={{ backgroundColor: letterData.backgroundColor }}>
      <RewardSystem ref={rewardRef} onRewardGiven={(r) => setRewards((p) => [...p, r])} chestRef={chestRef} />
      <RewardChest ref={chestRef} rewards={rewards} />
      <PlayfulBackground />

      {/* pr-20 reserves room for the fixed reward chest in the top-right corner
          so the mute toggle never sits underneath it. */}
      <header className="relative z-10 flex items-center gap-4 px-4 py-3 pr-20">
        <Link href="/student" className="rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-gray-600">
          <span className="inline-flex items-center gap-1.5"><Decor name="home" size={18} />{t.home}</span>
        </Link>
        <ProgressBar current={4} total={4} step={4} totalSteps={4} />
        <MuteToggle className="h-11 w-11 shrink-0" />
      </header>

      {finished ? (
        <GameCompletionScreen
          letter={letterData.letter}
          letterColor={letterData.color}
          totalStars={stars}
          maxStars={GAMES_PER_SESSION * 3}
          rewards={rewards}
        />
      ) : (
        <main className="relative z-10 grid flex-1 place-items-center px-4 py-4">
          {/* First game mounts only after the welcome — several games speak
              their instructions on mount and would cut the teacher off. */}
          {introDone && (
            <div className="w-full max-w-2xl">
              <p className="mb-2 text-center text-sm font-bold text-gray-400">
                {t.gameXofY(index + 1, chosen.length)}
              </p>
              <div className="flex justify-center">
                <CurrentGame
                  key={index}
                  letterData={letterData}
                  onReward={handleReward}
                  onComplete={handleComplete}
                />
              </div>
            </div>
          )}
        </main>
      )}

      {!introDone && (
        <LevelIntro
          once="kinda:intro:games"
          lines={[
            "/audio/instructions/games/welcome.mp3",
            "/audio/instructions/games/what-learn.mp3",
            "/audio/instructions/games/how-start.mp3",
          ]}
          onDone={() => setIntroDone(true)}
        />
      )}
    </div>
  )
}
