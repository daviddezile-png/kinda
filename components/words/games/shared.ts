// Contract every Words game shares. The parent WordLessonClient owns the reward
// overlay + gift naming; a game just says when the child earns a gift
// (onReward) and when it is finished (onDone).
export interface WordGameProps {
  /** This letter's words (lowercase), the game's content pool. */
  words: string[]
  color: string
  /** The child got a round right — fly in + name a gift. */
  onReward: () => void
  /** The whole game (all its rounds) is finished. */
  onDone: () => void
}
