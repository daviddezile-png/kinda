import type { LetterData } from "@/types"

// Every Step 4 game shares this contract. The parent GameSelector owns the
// reward overlay and tallies stars.
export interface GameProps {
  letterData: LetterData
  onReward: () => void
  onComplete: (stars: number) => void
}
