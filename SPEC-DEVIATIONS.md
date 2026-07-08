# Spec Deviations

The spec files in `elimu-yangu-specs/` describe **what to build** (the learning
flow, data shapes, UX rules). They were written against **Next.js 14 + NextAuth
v5 + a `src/` layout**. This repo runs a **different, intentionally-modified
stack** (see `AGENTS.md`).

**Rule: the installed stack is the source of truth. The specs are a requirements
document, not a version contract.** Keep the "what"; adapt the "how". When spec
code conflicts with the table below, follow the table.

## Installed stack (source of truth)

| Tool | Spec assumes | Actually installed |
|------|--------------|--------------------|
| Next.js | 14 (Pages-era idioms in places) | **16.2.9** (App Router) |
| Layout | `src/` directory | **app-at-root**, alias `@/*` → `./*` |
| NextAuth | v5 (Auth.js) | **v4** (`next-auth@^4.24.14`) |
| Config | `next.config.js` (CommonJS) | **`next.config.ts`** (ESM) |
| React | 18 | **19.2.4** |
| Prisma | 5/6 | **7.8.0** |

## Deviations (spec says → we do, and why)

1. **No `src/` folder.** All app code lives at the repo root next to `app/`
   (`components/`, `lib/`, `store/`, `data/`, `types/`). The `@/*` import alias
   maps to `./*`, not `./src/*`. Rewrite every spec path of the form
   `src/components/...` to `components/...`.

2. **`params` is a `Promise`.** Next 16 makes dynamic route params async.
   Every page/route does `const { letter } = await params`. Prefer the
   generated `PageProps<'/student/letters/[letter]/step/1'>` helper types.
   Spec snippets showing `params: { letter: string }` (sync) are stale.

3. **NextAuth v4, not v5.** Do **not** use `export const { handlers, auth } =
   NextAuth(...)` (v5). Instead:
   - `lib/auth.ts` exports `authOptions: NextAuthOptions` (Credentials provider,
     bcrypt compare, jwt/session callbacks).
   - `app/api/auth/[...nextauth]/route.ts` does
     `const handler = NextAuth(authOptions); export { handler as GET, handler as POST }`.
   - Server code reads the session with `getServerSession(authOptions)`.
   - `middleware.ts` uses `getToken({ req })`.
   Keep auth patterns uniform — never mix in v5 snippets.

4. **`next.config.ts` is ESM.** Wrap with `next-pwa` using `import`/
   `export default`, not `require`/`module.exports` as the PWA spec shows.

5. **`bcryptjs` must be added** (`bcryptjs` + `@types/bcryptjs`) — the spec
   imports it but it is not installed. `idb`, `next-pwa`, and all other deps are
   present.

6. **Database is MySQL, not PostgreSQL/Supabase.** `prisma/schema.prisma` uses
   `provider = "mysql"`. Connection string is `DATABASE_URL` in `.env`
   (edit user/password). Run `npx prisma db push` after editing credentials.

7. **Prisma 7 breaking changes (important):**
   - The datasource **`url` is NOT allowed in `schema.prisma`** anymore. It lives
     in **`prisma.config.ts`** at the repo root (`defineConfig({ datasource: { url } })`).
   - Runtime queries require a **driver adapter** (e.g. `PrismaMariaDb` from
     `@prisma/adapter-mariadb`, backed by the installed `mysql2`). The constructor
     arg is optional in *types* so `new PrismaClient()` compiles, but it **throws
     at runtime** without an adapter. `lib/prisma.ts` has a TODO to wire this when
     the first DB-backed feature is built. No adapter is installed yet.
   - NextAuth-model token fields (`Account.refresh_token` etc.) use `@db.Text`
     because MySQL's default `VARCHAR(191)` is too short for OAuth tokens.

## Gameplay simplifications (Step 4)

These keep the games reliable on tablets and avoid fragile drag/canvas math.
Behaviour and rewards match the spec's intent; the interaction differs:

- **Letter Puzzle** — tap pieces in order (1,2,3…) instead of drag-and-snap.
- **Match Picture** — tap the correct picture instead of drawing a Canvas line
  from the letter to the image.
- **Sing Along** — fill-in-the-blank choices advance line-by-line; the song is
  played once (no per-millisecond karaoke word-sync or microphone detection).
- **Memory** — face swaps the card background/image rather than a 3D `rotateY`
  flip.
- Step 2/3/4 game state uses local component state + refs where the logic is
  inherently imperative (canvas, timers, falling items); Zustand stores are used
  for Step 1 and Step 2 round/lives state.

## Implemented since initial scaffold (June 2026)

These resolve earlier "deferred" notes above:

- **Voice is recorded-audio only — no browser TTS.** `lib/speak.ts` was removed
  and every `speak()/speakLetter()` call deleted. All voice now plays through
  `AudioManager` (Howler) from files under `/public/audio/…` for **both**
  English and Swahili. Letters/words are silent until the audio files are added;
  that is intentional (the content author supplies their own recordings).
- **Prisma adapter is now wired** (resolves note 7). `lib/prisma.ts` constructs
  `new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL) })`.
  `@prisma/adapter-mariadb` + `bcryptjs` are installed. Run `npx prisma db push`
  then `npm run db:seed` (demo school/admin/teacher/class/students/curriculum).
- **`Curriculum` model added.** The teacher — not the student — chooses which
  letters a class learns, their order, which of the 4 steps are enabled, and
  whether progression is sequential. Stored per-class (`Curriculum.classId`),
  `letters`/`steps` are `Json`. Effective config via
  `getCurriculumForClass()` (server) with a `defaultCurriculum()` fallback.
  Client components import constants/types from `lib/curriculumShared.ts`
  (no Node deps) — never from `lib/curriculum.ts` (pulls `prisma`/`node:fs`).
- **Auth implemented (NextAuth v4).** `lib/auth.ts` (Credentials + JWT, bcrypt),
  `app/api/auth/[...nextauth]/route.ts`, `types/next-auth.d.ts` augments
  `Session`/`JWT` with `role`/`schoolId`/`schoolName`. Requires
  `NEXTAUTH_SECRET` + `NEXTAUTH_URL` in `.env`.
- **`middleware.ts` → `proxy.ts`.** Next 16 deprecated the `middleware` file
  convention; the route guard lives in `proxy.ts` exporting `proxy(req)`.
- **Students don't free-pick letters.** `/student` reads the class curriculum and
  shows only the assigned letters in the teacher's order (`components/student/
  LessonPath.tsx`). The child first picks themselves from the class grid
  (`/student/choose`, no password) → cookie. Sequential unlock uses a client
  `lib/progress.ts` gate (per-device) until per-student `Progress` rows are wired.
- **3D look is CSS-3D + framer-motion** (no WebGL/Three.js). See the `scene-3d`,
  `preserve-3d`, `depth-shadow`, `animate-float3d`, `animate-aurora`,
  `shimmer-text` helpers in `globals.css`, the parallax `PlayfulBackground`, and
  the `Loading` component. Keep new 3D effects on this stack.

## Step 0 interaction & teacher analytics (June 2026)

- **Step 0 is touch-the-picture only — no arrows, no words, no auto-advance.**
  The spec's Step 0 flow auto-crossfades and uses a Next button. At this
  pre-reading age a child can't read labels or interpret arrows, so
  `DiscoverySequence` is driven entirely by tapping the big picture: each tap
  crossfades to the next image (looping) and plays its sound. Progress dots fill
  as each image is met, and the icon-only green ✓ "continue" appears **only after
  every image has been seen at least once** — guaranteeing the child iterates
  through all images (these become learning references as more are added). The
  final Step-0 continue (`Step0Client`) and `BigButton` are likewise icon-only.
- **Teacher "needs support" analytics.** `lib/analytics.ts` (`getClassAnalytics`,
  pure `scoreStudent`) turns `Progress` rows into per-child support flags
  (hasn't started / falling behind the class / repeating stages a lot / quiet for
  N days). The teacher dashboard shows a "Needs more support" list + a per-child
  status dot (links to each child's page), and the per-student page shows a
  support/doing-well banner. Heuristic thresholds live as consts at the top of
  `lib/analytics.ts`.

## Mascot: 3D image flip-book, not Lottie (July 2026)

The specs (`04-STEP1-SEE-AND-LISTEN.md` et al.) call for a `LottieCharacter`
component playing `.json` Lottie rigs. That has been **replaced by
`components/character/Character3D.tsx`** — same public API (`<Character3D state
size>`), same `CharacterState` union — so every call site was a drop-in swap.

- Each state is a short **flip-book of transparent PNG poses** under
  `public/images/character/3d/{state}-{n}.png`, cross-faded on a per-state
  interval so a few stills read as one figure moving. Frame counts live in
  `public/images/character/3d/manifest.json` (the component fetches it once).
- Frames are generated by **`scripts/gen-3d-character.py`** — free, no API key:
  **Pollinations AI** for the image + **rembg** for the background cut-out. A
  fixed seed + an identical identity-lock prompt (only the pose clause changes)
  keeps the character consistent; each cut-out is trimmed, scaled to a constant
  height and bottom-aligned so frames line up. Re-run to (re)generate; existing
  frames are skipped. Delete a `{state}-{n}.png` (and rerun) to redo one pose.
- `lottie-react` and the old `scripts/gen-characters.mjs` Lottie generator are
  now unused. `AnimatedMascot.tsx` (emoji fallback) is untouched.
- If the frames are missing, `Character3D` reserves the space (no emoji face),
  matching the old component's missing-asset behaviour.

## Decor: generated art, not emojis (July 2026)

The UI's decorative emojis (the floating background shapes, and chrome flourishes
like the reward chest, lives hearts, lesson locks, completion stars, headers)
have been **replaced by generated 3D-Pixar art** in the same look as the mascot,
so nothing child-facing renders a raw emoji glyph.

- Art lives in `public/images/decor/{name}.png` (transparent), produced by
  **`scripts/gen-decor.py`** (Pollinations + rembg, same pipeline as the mascot;
  each item centered rather than ground-aligned). **No rainbows** (house rule).
- Rendered through **`components/ui/Decor.tsx`** — `<Decor name="star" size={…}/>`.
  Add art by adding a row to the script's `ITEMS`, running it, then adding the
  name to `DecorName`.
- `PlayfulBackground`, `Loading` (+ the `hero`/orbit props), `RewardChest`,
  `LivesDisplay`, `LetterGrid`, `LessonPath`, `ProgressBar`, `GameSelector`,
  `RecognitionGame`, `Step0/Step1/Step3` clients, `DiscoverAllClient`,
  `TapLetter` and `CatchBucket` were switched over. `HomeHeader`'s mascot is now
  `<Character3D>` (see the mascot note above).
- **The remaining emoji glyphs were retired too (August 2026).** The audio
  `🔊`→`sound-on`, mute `sound-off`, repeat `🔁`→`repeat`, timer `⏱`→`timer`,
  memory-card `❓`→`mystery`, and finger-cue `👆`/`☝️`/`✍️`→`pointing-hand`
  now render as generated `Decor` art (added to `gen-decor.py`'s `ITEMS`)
  instead of raw glyphs; plain checkmark/arrow text (`✓`, `→`) in non-child
  (teacher-facing) screens was left alone. `lib/audio.ts` gained
  `isMuted`/`setMuted`/`toggleMuted` so every voice line respects a persisted
  mute flag, surfaced via `components/ui/MuteToggle.tsx`.

## Step 1 rebuilt: voice-driven "See & Listen" (July 2026)

The spec's Step 1 (letter + word image + song on fixed timers) is replaced by a
sequence where **every transition fires when the current voice line ends**
(`playVoice` onend chaining in `components/letters/Step1Client.tsx`), so the
teacher's gesture always matches what is being said. Fallback timers back up
each transition so a missing audio file can never freeze the lesson.

- **Sequence:** capital letter alone (no pictures) → child touches it → small
  letter alone → touch → "X is for…" tour of EVERY voiced picture for the
  letter (`data/letterImages.ts`), one tap per picture → find-the-picture game
  (1 correct + 3 `DISTRACTORS`) → congratulations (applause + celebrating
  teacher centred + 🔁 repeat / Next). The song/`AudioManager` are no longer
  used in Step 1.
- **Letter artwork, not glyphs.** `LetterCard` shows the author's photos from
  `/images/letters/{uppercase,lowercase}` via `lib/letterArt.ts` (all 26
  letters in both cases; a missing file falls back to the styled 3D glyph).
- **Teacher gestures:** `Character3D` gained `pose` (hold one frame) and `flip`
  (mirror). The generated pointing frames aim LEFT, so the lesson holds
  pointing frame 2 **flipped** while naming — the teacher sits left of the
  content and points right AT it. Frame intervals were slowed so she never
  looks jittery while speaking.
- **All-letters finale:** finishing every letter at a level routes to
  `/student/celebrate` (teacher + the child's own animal celebrating, applause
  + `instructions/finale/*` voice lines); its Continue button bumps the level
  (was: silent auto-bump in `/student/learn`).
- **Audio:** new clips are generated by `scripts/gen-step1-audio.py` (gTTS for
  voice, numpy-synthesised `feedback/applause.wav` + `clap-short.wav` since
  claps aren't speech).
- **Profiles are animals only** (`lib/characters.ts`) — transparent-background
  animal art; legacy fruit avatar ids resolve to fixed animals so old DB rows
  still render an animal.

## Discover ("See & Know") teacher-led introductions (July 2026)

Both discovery surfaces — the per-letter Step 0 (`DiscoverySequence.tsx` +
`data/discover.ts`) and the Level 0 ALL-tour (`DiscoverGallery.tsx` +
`data/letterImages.ts`) — now introduce every "thing" picture the same way:
the teacher (`Character3D`, `state="teaching"`, capped to her first **two**
poses via the new `maxFrames`/`frameMs` props, cycling slowly at 1.4s/frame so
she never looks jittery mid-sentence) is shown **alone**, with the object
picture hidden, while she says *"This is a/an X."* Only once that line
finishes (+ a ~900ms beat) is the object's picture revealed. Its **action**
scene (the object in a scene — the child eating it, the dog running, …), when
one exists, is then shown directly with its own line (no teacher-hiding — the
object's already been introduced); words with no action image just stop at
the reveal.

- **ALL-tour audio.** `allLetterImages()` (`data/letterImages.ts`) now tags
  each entry `kind: "thing" | "action"` and resolves the correct sentence via
  `lib/discoverPhrases.ts` (`aloneAudioFor`/`actionAudioFor`, checking
  `wordImages.ts`'s `ACTIONS` dict for which words get a second line) instead
  of `DiscoverGallery` calling `speakWord()` on the bare word. Recordings live
  under `/public/audio/discover/{id}-alone.mp3` / `{id}-action.mp3`, generated
  by `scripts/gen-discover-tour-audio.py` (gTTS; skips files that already
  exist, e.g. the curated Step 0 set) — covers all 68 words in
  `WORDS_BY_LETTER`, with real action lines for the 27 that have one.
- **Rounded corners.** The actual `<img>` (not just its wrapping card) gets
  `rounded-4xl` in both `DiscoverGallery` and `DiscoverySequence` — the action
  photos are full rectangular stock photos (not transparent cut-outs), so
  without rounding the image itself they showed square corners regardless of
  the card around them.
- `DiscoverGallery`'s intro/reveal phase is derived from a `revealedFrame`
  index rather than its own piece of state, so the initial "show teacher"
  entry for each new "thing" frame needs no synchronous `setState` in an
  effect (React's `set-state-in-effect` rule).

## Discover UI overhaul: mute toggle, one-directional transitions, finale (August 2026)

- **Corner mascot replaced by a mute toggle.** `DiscoverAllClient`/`Step0Client`
  no longer show a `Character3D` in the header; `components/ui/MuteToggle.tsx`
  sits there instead, backed by `lib/audio.ts`'s `isMuted`/`setMuted`/
  `toggleMuted` (persisted to `localStorage`, checked by `playVoice`).
- **Character only animates while actually speaking.** `lib/audio.ts` tracks
  `isSpeaking`/`onSpeakingChange` (set from the `Howl` `onplay`/`onend`
  callbacks); the teacher's intro `Character3D` in `MadamWelcome`,
  `DiscoverGallery`, and `DiscoverySequence` passes `animate={speaking}` so she
  holds a still pose between lines instead of flip-booking continuously.
- **Pictures always slide left-to-right**, matching the teacher's pointing
  hand — `slideVariants` in both gallery components is a fixed enter/exit
  offset (no more swipe-direction-driven `dir`/`custom`). Swiping **right**
  (finger moves left-to-right) now advances, matching that fixed direction —
  swiping left goes back. The chevron `‹ ›` buttons were removed entirely (all
  screen sizes) — swipe/tap is the only navigation now.
- **Discover finale.** `DiscoverAllClient`'s and `Step0Client`'s "done" screens
  show a generated `discover-celebration.png` (teacher + children clapping,
  `scripts/gen-discover-celebration.py`, same identity-lock/seed as the
  mascot) plus `applause-wav.mp3` and a short readable line telling the
  accompanying adult which button repeats vs. continues.
- **`lib/wordImages.ts` `ACTIONS`**: every entry is a single image (no more
  back-to-back repeats of the same scene/voice line); `data/letterImages.ts`
  `WORDS_BY_LETTER` only lists words that have a matching action image —
  `Avocado`/`Candy`/`Cup`/`Salt` were dropped since no action photo exists for
  them.

## Level intros, Numbers module, landing page & PWA (July 2026)

- **Every level now opens teacher-first.** Levels 2 (find pictures), 3 (write)
  and 4 (games) gained the same welcome the Discover/Step-1 levels had: a
  `components/ui/LevelIntro.tsx` overlay where Madam greets the child, says
  what today's level teaches and how to start (three voice lines each, under
  `instructions/{step2,step3,games}/{welcome,what-learn,how-start}.mp3`).
  The overlay doubles as the tap-to-start audio-unlock veil (Step-1 pattern);
  tapping mid-speech skips into the lesson. The full intro plays once per
  session per level (sessionStorage key) so the second letter of the day
  doesn't repeat the speech. Each level's own opening lines are gated behind
  the intro so voices never overlap (RecognitionGame's `QuestionDisplay` and
  GameSelector's first game mount only after it).

- **Numbers & Counting module (1–10), separate from the letters curriculum.**
  Voice-first like Step 1: `app/student/numbers` (map, sequential unlock via
  `lib/numberProgress.ts` localStorage — no DB) → `app/student/numbers/[value]`
  → `components/numbers/NumberLessonClient.tsx`: teacher introduces the digit
  → child touches it → count-along (touch each object, each touch counted
  aloud) → the number word → **six games per number** (`components/numbers/
  games/`): FindNumber, CountAndChoose, TapExactly, NumberOrder, MatchQuantity,
  CountAnimals (counts real photos from `/images`). Counting objects are decor
  art + existing photos (`data/numbers.ts` `DECOR_OBJECTS`/`PHOTO_OBJECTS` —
  plurals must match the generated `howmany/{plural}.mp3` slugs). Number names
  exist in four accents (`numbers/names/{n}{,-uk,-us,-in}.mp3`) — games echo
  counts in random voices via `speakNumberAnyVoice`. All generated by
  `scripts/gen-numbers-audio.py` (also the level intros and extra multi-accent
  feedback lines added to the `POSITIVE`/`ENCOURAGING` pools in `lib/audio.ts`).
  Entry point: a "1 2 3 Numbers" card on `/student`.

- **PWA is app-native, NOT `next-pwa`** (supersedes deviation 4's "wrap with
  next-pwa" note — that plugin needs webpack; this Next build is
  Turbopack-first). Per `node_modules/next/dist/docs/01-app/02-guides/
  progressive-web-apps.md`: `app/manifest.ts` (App Router manifest route), a
  hand-written `public/sw.js` (network-first navigations with
  `public/offline.html` fallback; cache-first for `/images`, `/audio`,
  `/icons`, `/_next/static`), registered in production only by
  `components/pwa/PwaRegister.tsx` in the root layout.
  `components/pwa/InstallPrompt.tsx` (used on the landing page) wraps
  `beforeinstallprompt` + an iOS share-sheet hint. Icons are generated from
  the character art by `scripts/gen-pwa-icons.py`. `next.config.ts` sets
  no-cache headers for `/sw.js` and year-long immutable caching for
  `/audio|/images|/icons`. Web-push was deliberately skipped (needs VAPID keys
  + subscription storage; no use case for 3–6-year-olds yet).

- **Landing page** is `components/landing/LandingClient.tsx` (CSS-3D +
  framer-motion only, per the no-WebGL house rule) and is a full MARKETING
  site: hero, an auto-scrolling parade of real `images/things` art, the
  Letters/Numbers worlds, an animated "how a lesson works" explainer, a
  "built for schools" section (uses the otherwise-unused
  `character/child-teacher.jpg` + `teacher-child1.jpg` photos), subscription
  plan cards matching the schema's `Plan` enum (TRIAL/BASIC/STANDARD/PREMIUM,
  mailto CTAs), a "how to get Kinda" onboarding section
  (`character/welcoming-sir.png`), and the PWA install prompt.

### Revisions after David's July 2026 review

- **No decor art in teaching/games content.** Counting objects are REAL images
  only (`/images/things/*.png` cut-outs — `PHOTO_OBJECTS` in `data/numbers.ts`;
  the number tiles preview quantity as plain colored dots). Decor remains only
  as UI chrome (home, mute, stars) and on marketing surfaces.
- **The pointing-hand decor image is banned** — tap/finger cues use the 👆
  emoji glyph ("pointing-hand" was removed from `DecorName`). The
  `write-guide-hand.png` image IS still the writing guide everywhere.
- **Numbers gained a writing phase** (teach → count → word → **write ×3** →
  6 games): `components/numbers/NumberWrite.tsx` over the glyph-agnostic
  `components/tracing/StrokeCanvas.tsx` (extracted from `TracingCanvas`, which
  is now a thin letters wrapper) with digit paths in `lib/numberStrokes.ts`.
- **The TEACHER picks each child's module.** `Student.module`
  (`LETTERS`|`MATH`, Prisma) is set per child from the roster
  (`StudentManager` ABC/123 toggle); `/student/learn` routes MATH students to
  `/student/numbers`. The child-facing pages have NO module picker.
- **Per-number welcomes** (`instructions/numbers/welcome/{n}.mp3`) open every
  number lesson; the class/profile picker also speaks
  (`ui/touch-your-{class,picture}.mp3`). All lines in
  `scripts/gen-numbers-audio.py` — its `PRIMARY` list must stay in sync with
  `data/numbers.ts` (the tap-exactly/there-are lines bake those plurals in).

- **Numbers are now teacher-configurable in the curriculum** (supersedes the
  "separate from the letters curriculum / no DB" note above). `Curriculum`
  gained a `numbers Json?` column (enabled values 1–10, ascending; `null` = all)
  alongside `letters`/`steps`; `CurriculumConfig.numbers` + `ALL_NUMBERS` live in
  `lib/curriculumShared.ts`, resolved by `getCurriculumForClass()` with an
  all-1–10 fallback (so a child reaching the map without a class cookie — e.g.
  the marketing demo — still gets every number). The teacher picks the set in
  `CurriculumBuilder` ("4 · Which numbers?"), validated/persisted by
  `PUT /api/teacher/curriculum`. `app/student/numbers` (map) and
  `numbers/[value]` (lesson guard) read the config; the map shows only the
  assigned numbers and honours the shared `sequential` flag for unlock order.
  Per-child *completion* stays per-device (`lib/numberProgress.ts` localStorage)
  as before. Run `npx prisma db push` to add the column.

## Child picks the subject; audio-unlock hardening (July 2026)

Revises two earlier decisions after David's testing:

- **The child now chooses LETTERS vs NUMBERS after login** (supersedes "the
  child-facing pages have NO module picker"). `/student` greets the child, then
  shows two big glyph-first cards — **ABC** → `/student/learn?mode=letters`,
  **1 2 3** → `/student/learn?mode=numbers`. `/student/learn` honours `?mode`
  (an explicit `letters` beats a MATH `student.module`); with no `mode` it still
  falls back to the teacher-set `student.module`, so nothing else breaks. The
  teacher still owns everything *within* a subject (which letters/numbers, order,
  steps).

- **Audio-unlock hardened so voice plays without a refresh** (`lib/audio.ts`).
  Root cause: Howler's `AudioContext` is created lazily by the first `Howl`,
  which usually fires from a `setTimeout` a beat AFTER the unlock tap — so the
  context was born *suspended* and the first line was silently dropped (looked
  like "no voice / stuck lesson / works only after refresh"). Fix: `primeAudio()`
  runs INSIDE every unlock gesture — `Howler.volume()` forces the context to
  exist now and `ctx.resume()` promotes it to *running* within the gesture; the
  gesture listeners are no longer `once` (so a tab-switch/route-suspended context
  resumes on the next tap), `visibilitychange` re-primes on return, and
  `playVoice` resumes a suspended context before each line.

- **Welcome veils are voice-only** — the misleading "Tap a letter to start
  playing!" label was removed from `Step1Client` and `LevelIntro`; the pulsing
  teacher is the (wordless) cue and her spoken line plays the moment audio
  unlocks.

- **Letter celebration names BOTH buttons.** The old line told the child to "tap
  the star" but the continue button showed the word *Next*. The continue button
  is now a **star `Decor` icon** (wordless, matches the cue) and a new
  `instructions/step1/finish-buttons.mp3` line describes the round-arrow (repeat)
  AND the star (next). Line added to `scripts/gen-step1-audio.py`.

- **Fixed two broken distractor images** (`data/distractors.ts`): `coconut`/
  `papaya` pointed at non-existent `eat-coconut.png`/`eat-papaya.png`; repointed
  to the real `man-cut-coconut.jpg` / `mother-prepare-papaya.jpg`. (The Step-1
  image game renders options with `next/image`, which shows a broken-icon on a
  missing file — no emoji fallback like `<Picture>`, so paths must be real.)

## Numbers gifts + fixes (July 2026)

- **The numbers lesson now gives gifts like the letters lesson.**
  `NumberLessonClient` mounts `RewardSystem`/`RewardChest`; the child earns a
  gift for finishing the writing phase and one for every game won (a shuffled
  `ALL_REWARDS` queue), then a new **tally** phase shows all collected gifts
  before the celebration. (Letters already gifted per traced section in
  `Step3Client`.) The celebration now plays `feedback/celebration.mp3` instead of
  plain applause. The lesson header moved Home+mute to the LEFT so they clear the
  fixed reward backpack (top-right), matching the letters lesson.
- **`watching-3.png` 404 was a stale service-worker cache** of an older manifest
  (`manifest.json` correctly says `watching: 2` and only 2 files exist).
  `public/sw.js` `VERSION` bumped `kinda-v1 → kinda-v2` to invalidate old caches.
- **Number 10 already writes two digits** (`NumberWrite` + `digitsOf("10")` →
  `["1","0"]`), tracing 1 then 0 each of the 3 rounds.
- **Writing guide slowed + a solo test round.** The `StrokeCanvas` guide hand
  now travels the glyph over `DEMO_DUR = 6s` (was 3.5) so a child can follow it,
  and a new `guide` prop (default true) hides the hand + self-drawing demo trail
  + start dot for a "write it yourself" round. `NumberWrite` now runs **3 guided
  rounds then 1 no-guide test round** (4 total): it says "Follow the little hand
  with your finger!" (`numbers/follow-hand`) up front and "Now write it all by
  yourself!" (`numbers/write-yourself`) when the guide drops; the round pips show
  three stars + a final sparkle. Letters (`Step3Client`/`TracingCanvas`) inherit
  the slower guide but keep their uppercase→transform→lowercase structure (no
  test round). New lines added to `scripts/gen-numbers-audio.py`.
- **Deferred: starting the sequence at 0.** Zero has nothing to count, so it
  breaks the count-along and the count/quantity games (TapExactly, CountAndChoose,
  MatchQuantity, CountAnimals) and needs its own "zero = none" teach flow + ~7
  voice lines. Left for a focused pass rather than a half-working hack.

## Multi-tenant: super-admin, per-class join codes (July 2026)

The app now supports many schools with strict isolation.

- **One platform SUPER-ADMIN.** The `ADMIN` role is now platform-wide: `User.schoolId`
  is nullable and the admin has none. They manage every school + teacher at
  **`/admin`** (`app/admin/*`, guarded by `proxy.ts` + `getAdminSession()` in every
  action). Admins create schools and teacher accounts (no public sign-up) and can
  suspend a teacher (`User.isActive`, checked at login in `lib/auth.ts`).
  Logging in as admin lands on `/admin` (the teacher dashboard redirects them).
- **Teachers are school-scoped and invisible to each other** — unchanged
  `teacherClass.ts`/`assertClassAccess` scoping (own classes; same school). The
  admin branch coalesces a null school to a non-matching sentinel since the
  super-admin doesn't teach.
- **Students open a class by CODE, not by browsing.** `Class.code` (unique, short,
  ambiguity-free alphabet — `lib/classCode.ts`) is generated on class creation and
  shown to the teacher (`ClassManager` badge). A student device enters it at
  **`/student/join`** → `kinda_join` cookie → `/student/choose` shows ONLY that
  class's children. **This closed a real leak:** `/student/choose` previously listed
  every class in every school. `chooseStudent` now verifies the picked child belongs
  to the joined class, so a device can never reach another class/school's students.
- **Seed:** `admin@kinda.test` is the super-admin (no school); demo class
  `Nursery A` has code **SUNNY2**. Run `npx prisma db push` (adds `User.isActive`,
  nullable `User.schoolId`, unique `Class.code`).

## Level 0 retired from the progression → standalone "Journey" (July 2026)

Supersedes every earlier "Level 0 / See & Know" note above (the per-letter
Step 0 route, its 0–4 level range, and Discover-completion bumping
`student.level`).

- **Letters/numbers now always start at level 1.** `lib/curriculumShared.ts`:
  `ALL_STEPS = [1,2,3,4]` (was `[0,1,2,3,4]`), `clampLevel()` floors at 1 (was
  0), `STEP_LABELS` dropped its `0: "See & Know"` entry. `Student.level`
  defaults to `1` in the schema; `addStudent`/seed data updated to match; a
  one-off `UPDATE Student SET level = 1 WHERE level < 1` fixed pre-existing
  rows (every read already went through `clampLevel`, so this was cleanup, not
  a correctness fix). `/student/learn` no longer has a `level === 0` branch.
- **"See & Know" is now a standalone Journey**, reachable any time from
  `/student` (a third **Journey** card, `Decor="kite"`, alongside ABC/123) →
  **`/student/journey`** picks **Word Journey** (the existing all-curriculum-
  letters picture tour, now at `/student/discover`, unchanged UI) or **Animal
  Journey** (new — see below). Neither Journey is gated by the teacher's
  curriculum `steps`, by `student.level`, or by `student.module`; finishing one
  does **not** touch `student.level` (previously `completeDiscoverAll` bumped
  0→1 — removed). Completion is recorded under the **`READING`** Progress
  module (was `LETTERS` step 0), so it never mixes into the teacher's
  letters-progress analytics (`lib/analytics.ts` filters `module: "LETTERS"`).
  `app/student/discover/actions.ts`'s export was renamed
  `completeDiscoverAll` → `completeWordJourney` to match.
- **Animal Journey** (`data/animals.ts`, `app/student/journey/animals/`,
  `app/student/journey/actions.ts`): tours **all 60 animals** with real
  cut-out art (`/public/images/things`) — not filtered by curriculum, per
  design (the child meets every animal, unlike Word Journey's curriculum-
  letters scope). Reuses the same voice-first gallery as Word Journey
  (`DiscoverGallery`/`DiscoverAllClient` are generic over `GalleryFrame[]`) —
  `DiscoverAllRunner` was generalized to accept an `onFinish` action and
  `redirectTo` instead of hardcoding Word Journey's. Voice lines ("This is
  a/an X.") generated by `scripts/gen-animal-journey-audio.py` into
  `/public/audio/discover/animals/{slug}-alone.mp3`, same gTTS pattern as
  `gen-discover-tour-audio.py`. Progress rows use `itemId: "animal:{slug}"`
  (prefixed) so they never collide with Word Journey's letter-keyed rows in
  the same `(studentId, module, itemId, step)` slot.
- **Orphaned per-letter Step 0 route deleted.** `/student/learn`'s old
  `level === 0` redirect was the only way to reach
  `/student/letters/[letter]/step/0` — with level 0 retired that route became
  unreachable, so it (and its exclusively-owned components `Step0Runner`,
  `Step0Client`, `DiscoverySequence`, `WhatDidYouSee`, plus `data/discover.ts`'s
  now-unused `getDiscover`/`lettersWithDiscover`) were deleted rather than left
  as dead code. Word Journey (the ALL-tour) fully supersedes its purpose.
- **`ProgressBar`'s `totalSteps` fixed to 4 everywhere** (`Step1Client`,
  `Step3Client` said `5`, counting the retired level 0; `GameSelector` already
  correctly said `4` — now consistent).

## Multi-tenant admin/teacher UX polish (July 2026)

- **Show/hide password** (`components/ui/PasswordField.tsx`) on the login form
  and every admin password form (teacher creation, admin's own change, teacher
  reset) — supports both controlled (login's `value`/`onChange`) and
  uncontrolled/FormData (server-action forms) usage.
- **Login → student switch.** `/auth/login` has an "I'm a student →" link to
  `/student/join`; the demo-credentials hint line was removed.
- **Class delete** (`app/teacher/classes/actions.ts` `deleteClass`) — only
  archived classes are hard-deletable (a safety rail: a teacher must archive
  first, so this can never hit a class children are actively using).
  Transactionally deletes Progress/StudentReward/Student rows, then the class
  (Curriculum cascades automatically). `ClassManager` adds a "Delete" button
  with a native `confirm()` on archived rows.
- **Teacher dashboard greeting** (`lib/greeting.ts`): `timeGreeting()` — "Good
  morning/afternoon/evening" by hour — and `firstName()`, which strips a
  leading honorific (Mrs./Mr./Ms./Dr./…) before taking the first name, so
  "Mrs. Amina" greets as "Amina, " not "Mrs.!".
- **Dashboard reality checks.** The "Needs more support" card now says "No
  children registered in this class yet" when the class is empty (was: a
  false-positive "Everyone is keeping up"); the class-average footer line is
  hidden when there are no students. The per-student page's support banner
  gained a third neutral state — "Hasn't started yet" (gray) — instead of a
  false-positive green "Doing well" when a child has 0 stages done.
- **`/student/choose` title/button overlap fixed** — the "Change class" /
  "Teacher login" pills were `absolute top-4 right-4`, overlapping the
  centered "Who is learning today?" `h1` on narrow screens. Now in normal flow
  above the title.
- **Admin self-service** (`app/admin/actions.ts`): `changeOwnPassword`
  (requires the current password) and `setTeacherPassword` (admin authority,
  no current-password check — same trust model as resetting a forgotten
  password over the phone), surfaced via `ChangeOwnPasswordForm` and the
  per-row `TeacherPasswordReset` inline control.
- **Searchable dropdown** (`components/ui/SearchableSelect.tsx`) — a
  type-to-filter combobox with a hidden input for plain FormData submission;
  used for the school picker in teacher creation (`CreateTeacherForm`).
- **Teacher roster search** — a plain client-side filter input in
  `StudentManager` (`components/teacher/StudentManager.tsx`), filtering the
  visible list by name; distinct from `SearchableSelect` (a filter over an
  already-rendered list, not a value picker).
- **Landing page:** removed the "Simple school subscriptions" pricing section
  (`PLANS` const + its `<section>`) entirely — no subscription tiers shown for
  now.

## Versioning hygiene for this project

- **Freeze the installed versions.** Do not run `npm update` / `ncu` mid-build;
  this Next build has intentional breaking changes and ships its own docs in
  `node_modules/next/dist/docs/`. Read those before writing code.
- **Let TypeScript enforce the reconciliation.** Strict mode is on. Gate work
  with `tsc --noEmit` (and `next typegen`) so any stray spec-era pattern
  (sync `params`, v5 auth, `src/` imports) fails loudly at build, not runtime.
- **NextAuth v4 is the right call now** (stable, matches the middleware's
  `getToken`). It is in maintenance mode, so a future v5/Auth.js migration is a
  known, deferred cost — not worth doing during the initial build.
