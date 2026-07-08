# CODING AGENT INSTRUCTIONS
## Read this FIRST before touching any code

---

## YOUR JOB

Build the "Kinda" children's learning app exactly as described in the spec files.
Do not skip any spec file. Do not improvise features not mentioned in specs.
When in doubt, follow the spec exactly.

---

## READ ORDER (mandatory)

Before writing any code, read ALL these files in order:

1. `00-PROJECT-OVERVIEW.md` — what you are building, tech stack, folder structure
2. `01-DATABASE-SCHEMA.md` — Prisma schema, copy it exactly
3. `03-LETTER-DATA-STRUCTURE.md` — JSON structure, TypeScript types
4. `04-STEP1-SEE-AND-LISTEN.md` — Step 1 components
5. `05-STEP2-RECOGNIZE.md` — Step 2 components
6. `06-STEP3-WRITE.md` — Step 3 components
7. `07-STEP4-GAMES.md` — All 8 game components
8. `08-REWARD-AUDIO-PWA.md` — Reward system, audio, PWA
9. `09-TEACHER-ADMIN-AUTH.md` — Teacher dashboard, admin portal, auth
10. `10-API-ROUTES.md` — All API endpoints

---

## BUILD ORDER

Build in this exact order. Do NOT jump ahead.

### PHASE 1 — Foundation (Build first, everything depends on this)

```
Step 1: Project setup
  - npx create-next-app with correct flags
  - Install all packages (see 00-PROJECT-OVERVIEW.md)
  - Create folder structure

Step 2: Database
  - Copy schema from 01-DATABASE-SCHEMA.md into prisma/schema.prisma
  - Run: npx prisma generate
  - Run: npx prisma db push

Step 3: Auth
  - Setup NextAuth from 09-TEACHER-ADMIN-AUTH.md
  - Create login page
  - Create register school page
  - Test login works

Step 4: Middleware
  - Copy middleware from 01-DATABASE-SCHEMA.md
  - Test subscription check works

Step 5: TypeScript types
  - Create /src/types/index.ts with ALL types from 03-LETTER-DATA-STRUCTURE.md

Step 6: Letter A JSON data
  - Create /src/data/letters/a.json using structure from 03-LETTER-DATA-STRUCTURE.md
  - Use placeholder image paths (images don't need to exist yet)
  - Use placeholder audio paths
```

### PHASE 2 — Core Learning (The heart of the app)

```
Step 7: AudioManager component
  - Build from 04-STEP1-SEE-AND-LISTEN.md
  - Test with placeholder audio files

Step 8: LottieCharacter component
  - Build from 04-STEP1-SEE-AND-LISTEN.md
  - Use any Lottie JSON from LottieFiles.com for testing

Step 9: RewardSystem + RewardChest
  - Build from 08-REWARD-AUDIO-PWA.md
  - Use placeholder images for rewards

Step 10: Step 1 — See & Listen
  - LetterCard component
  - WordDisplay component
  - ProgressBar component
  - Step1Client component
  - /student/letters/[letter]/step/1 page
  - Test complete flow with letter A

Step 11: Step 2 — Recognize
  - ImageCard component
  - RecognitionGame component
  - QuestionDisplay, LivesDisplay, RoundIndicator
  - /student/letters/[letter]/step/2 page
  - Test complete flow

Step 12: Step 3 — Write
  - TracingCanvas component
  - GuideDots, DirectionArrows, FingerGuide
  - LetterTransform component
  - MiniCanvas component
  - /student/letters/[letter]/step/3 page
  - Test complete flow

Step 13: Step 4 — Games
  - GameSelector component
  - Build all 8 games one by one (start with MemoryCardGame)
  - /student/letters/[letter]/step/4 page
  - Test each game individually
```

### PHASE 3 — Navigation & Progress

```
Step 14: Student home page
  - /student page
  - Shows all 26 letters as a grid
  - Each letter shows: locked/unlocked/in-progress/complete
  - Letter unlocks when previous letter completed
  - Clicking letter goes to step 1 (or last incomplete step)

Step 15: Progress saving
  - POST /api/progress endpoint
  - Save progress after each step completes
  - Load progress when student opens the app

Step 16: Offline sync
  - Implement from 08-REWARD-AUDIO-PWA.md
  - IndexedDB for offline progress
  - Sync when back online
```

### PHASE 4 — Teacher & Admin

```
Step 17: Teacher dashboard
  - /teacher/dashboard page
  - StudentCard components
  - Class overview

Step 18: Teacher student management
  - Add/edit/delete students
  - View student progress

Step 19: Admin portal
  - /admin/dashboard
  - Class management
  - Teacher invite system

Step 20: Subscription system
  - Expired page
  - Renewal flow
  - Email reminders
```

### PHASE 5 — Polish

```
Step 21: PWA setup
  - next-pwa configuration
  - Web manifest
  - App icons

Step 22: Generate data for all 26 letters
  - Create b.json through z.json
  - Follow exact same structure as a.json

Step 23: Loading states
  - Skeleton screens everywhere
  - Audio preloading indicator in Step 1

Step 24: Error states
  - Offline indicator
  - Error boundaries

Step 25: Final testing
  - Test on tablet (landscape mode)
  - Test offline mode
  - Test subscription expiry
```

---

## IMPORTANT RULES

### Children's UX Rules (NEVER break these)
1. Wrong answers = gentle shake animation + encouraging audio ONLY. No red X. No "wrong" text.
2. No timer pressure for young children except in "Tap the Letter" game (that's the point)
3. Every interaction must have SOUND feedback
4. Touch targets minimum 80x80px
5. No small text — minimum 18px for any text a child sees
6. Canvas must use `touch-action: none` to prevent scrolling while drawing

### Code Quality Rules
1. TypeScript strict mode — no `any` types
2. All components that use browser APIs must have `"use client"` directive
3. All audio files must be preloaded before the lesson starts
4. Use `forwardRef` for RewardSystem and RewardChest (they need imperative handles)
5. Zustand stores should be per-step (useStep1Store, useStep2Store, etc.)
6. Never use `useEffect` for audio playback directly — always use AudioManager ref

### File Naming
- Components: PascalCase (`LetterCard.tsx`)
- Pages: lowercase (`page.tsx`)
- Data files: lowercase (`a.json`)
- Store files: camelCase with Store suffix (`gameStore.ts`)
- Utility files: camelCase (`offlineSync.ts`)

---

## PLACEHOLDER ASSETS

While building, use these placeholder assets so the app runs:

**Images:** Use `/images/placeholder-letter.png` and `/images/placeholder-reward.png`

**Audio:** Create empty mp3 files or use a 1-second beep:
```bash
# Create silence mp3 files for testing
for letter in a b c; do
  mkdir -p public/audio/letters/$letter
  # Copy a real mp3 or use a 1kb silence file
done
```

**Lottie:** Download any free character from LottieFiles.com and save as:
- `/public/images/character/idle.json`
- `/public/images/character/teaching.json`
- `/public/images/character/happy.json`
- `/public/images/character/celebrating.json`
- `/public/images/character/nom_nom.json`

---

## TESTING CHECKLIST

After building each step, verify:

### Step 1 Test
- [ ] Letter bounces in from top
- [ ] Audio plays: letter name, then word
- [ ] Image appears after audio
- [ ] Character appears in teaching state
- [ ] Touching letter plays sound + shows reward
- [ ] Touch 3 times → lowercase appears
- [ ] Song plays
- [ ] Next button appears after song

### Step 2 Test
- [ ] 4 images appear with stagger
- [ ] Question audio plays
- [ ] Tapping correct = green glow + reward + next round
- [ ] Tapping wrong = shake (NO red X, NO lives lost in first tap)
- [ ] 3 rounds complete → celebration

### Step 3 Test
- [ ] Finger guide plays on mount
- [ ] Drawing on canvas shows colored line
- [ ] Guide dots turn green when touched
- [ ] Section complete → reward appears
- [ ] Letter transforms to image when complete
- [ ] Erase button works
- [ ] Idle detection shows guide again

### Step 4 Test (each game)
- [ ] Game selector picks 3 random games
- [ ] Memory: cards flip, match detection works, reward on match
- [ ] Feed character: items fall, tap sends to mouth, stomach fills
- [ ] Tap letter: letters float, correct tap = burst, timer counts down
- [ ] Build word: letters jump into slots in order
- [ ] Sing along: lyrics highlight, song pauses at blanks

---

## ENVIRONMENT SETUP

Create `.env.local`:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/elimu_yangu"
NEXTAUTH_SECRET="elimu-yangu-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

For Supabase (production):
```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"
```

---

## DONE MEANS

The app is "done" when:
1. A student can log in, pick letter A, and complete all 4 steps
2. Progress is saved and visible to the teacher
3. The app works offline after first load
4. Admin can create classes and invite teachers
5. Subscription check blocks expired accounts
6. The app runs smoothly on a tablet in landscape mode

Good luck! Follow the specs. Build in order. Test each phase before moving on.
