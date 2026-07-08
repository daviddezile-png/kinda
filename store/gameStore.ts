import { create } from "zustand"
import type { Reward } from "@/types"

// Voice-driven Level-1 lesson for ONE letter. Each phase advances when its voice
// line ends or the child touches what was asked:
//   intro (welcome + "let's learn letter D")
//   → teachCapital → touchCapital  (look here → this is capital D → say it → touch)
//   → teachSmall   → touchSmall
//   → toGames  ("now let's play")  → game (6 rounds: 2 capital, 2 small, 2 image)
//   → tally  (show every gift collected)  → celebrate (claps + "you learned D")
// From celebrate we either auto-repeat the whole letter (won < PASS_GAMES) or let
// the child move on. Gifts are only won/lost inside the games, never in teaching.
export type Step1Phase =
  | "loading"
  | "intro"
  | "teachCapital"
  | "touchCapital"
  | "teachSmall"
  | "touchSmall"
  | "toGames"
  | "game"
  | "tally"
  | "celebrate"

// Games the child must win (out of TOTAL_GAMES) to pass the letter; below this
// the whole letter repeats automatically.
export const TOTAL_GAMES = 6
export const PASS_GAMES = 4

interface Step1State {
  earnedRewards: Reward[]
  gamesWon: number
  phase: Step1Phase

  addReward: (reward: Reward) => void
  /** Take back the most recently earned gift (a wrong game answer). No-op when
   *  the basket is already empty. Returns the removed gift, or null. */
  removeReward: () => Reward | null
  winGame: () => void
  setPhase: (phase: Step1Phase) => void
  /** Full reset for a new letter. */
  reset: () => void
  /** Reset only the run state (gifts + score) to replay the SAME letter. */
  replay: () => void
}

export const useStep1Store = create<Step1State>((set, get) => ({
  earnedRewards: [],
  gamesWon: 0,
  phase: "loading",

  addReward: (reward) => set((state) => ({ earnedRewards: [...state.earnedRewards, reward] })),
  removeReward: () => {
    const list = get().earnedRewards
    if (list.length === 0) return null
    const removed = list[list.length - 1]
    set({ earnedRewards: list.slice(0, -1) })
    return removed
  },
  winGame: () => set((state) => ({ gamesWon: state.gamesWon + 1 })),
  setPhase: (phase) => set({ phase }),
  reset: () => set({ earnedRewards: [], gamesWon: 0, phase: "loading" }),
  replay: () => set({ earnedRewards: [], gamesWon: 0 }),
}))

// ─────────────────────────────────────
// STEP 2 — RECOGNIZE
// ─────────────────────────────────────
interface Step2State {
  round: number // 1-3
  lives: number // 0-3
  totalErrors: number
  earnedRewards: Reward[]
  isComplete: boolean

  loseLife: () => void
  resetLives: () => void
  nextRound: () => void
  addReward: (reward: Reward) => void
  complete: () => void
  reset: () => void
}

export const useStep2Store = create<Step2State>((set) => ({
  round: 1,
  lives: 3,
  totalErrors: 0,
  earnedRewards: [],
  isComplete: false,

  loseLife: () => set((state) => ({ lives: Math.max(0, state.lives - 1), totalErrors: state.totalErrors + 1 })),
  resetLives: () => set({ lives: 3 }),
  nextRound: () => set((state) => ({ round: state.round + 1, lives: 3 })),
  addReward: (reward) => set((state) => ({ earnedRewards: [...state.earnedRewards, reward] })),
  complete: () => set({ isComplete: true }),
  reset: () => set({ round: 1, lives: 3, totalErrors: 0, earnedRewards: [], isComplete: false }),
}))

export function calculateStars(totalErrors: number): number {
  if (totalErrors === 0) return 3
  if (totalErrors <= 2) return 2
  return 1
}
