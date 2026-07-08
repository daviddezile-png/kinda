# KINDA — PROJECT OVERVIEW
## Children's Learning App for Tanzanian Private Schools

---

## WHAT YOU ARE BUILDING

A web-based educational app (PWA) for children aged 3-6 in Tanzanian private schools. 
The app teaches the English alphabet, math, and reading through interactive visual games, 
songs, animations, and a reward system. The app is sold to schools on a yearly subscription basis.

---

## THREE USER TYPES

1. **School Admin** — manages the school, teachers, classes, and subscription
2. **Teacher** — manages their class and monitors student progress
3. **Student** — plays learning games and earns rewards

---

## TECH STACK

| Tool | Purpose |
|------|---------|
| Next.js 14 (App Router) | Frontend + Backend |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Prisma + PostgreSQL | Database (Supabase) |
| NextAuth.js | Authentication |
| Framer Motion | Animations |
| Lottie React | Character animations |
| Howler.js | Audio management |
| Zustand | Game state management |
| next-pwa | Offline/PWA support |
| Vercel | Hosting |

---

## INSTALL COMMAND

```bash
npx create-next-app@latest kinda --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd kinda

npm install framer-motion lottie-react howler @types/howler @prisma/client prisma next-auth @auth/prisma-adapter zustand next-pwa @types/next-pwa clsx tailwind-merge class-variance-authority lucide-react zod react-hook-form @hookform/resolvers date-fns

npx prisma init
```

---

## FOLDER STRUCTURE

```
/src
  /app
    /admin          → School admin portal
    /teacher        → Teacher dashboard  
    /student        → Student learning app
    /api            → All API routes
    /auth           → Auth pages
    layout.tsx
    page.tsx

  /components
    /letters        → Letter learning components
    /games          → All 8 game components
    /rewards        → Reward system components
    /character      → Lottie character components
    /audio          → Audio manager
    /ui             → Shared UI components
    /admin          → Admin UI components
    /teacher        → Teacher UI components

  /lib
    /prisma.ts      → Prisma client
    /auth.ts        → NextAuth config
    /utils.ts       → Utility functions

  /store
    /gameStore.ts   → Zustand game state
    /rewardStore.ts → Zustand reward state

  /data
    /letters        → JSON data for each letter (a.json ... z.json)
    /games          → JSON data for each game per letter

  /types
    index.ts        → All TypeScript types

/public
  /images
    /letters        → Letter word images (apple.png, ant.png etc)
    /rewards        → Reward images (candy.png, car.png etc)
    /distractors    → Wrong answer images
    /character      → Lottie JSON files
    /ui             → UI assets
  /audio
    /letters        → Letter and word audio files
    /songs          → Suno AI song files
    /rewards        → Reward sound effects
    /feedback       → Positive/negative feedback sounds
    /instructions   → Game instruction audio

/prisma
  schema.prisma     → Database schema
```

---

## SPEC FILES IN THIS FOLDER

Read all spec files in this order before starting:

1. `00-PROJECT-OVERVIEW.md` ← You are here
2. `01-DATABASE-SCHEMA.md` → Prisma schema + all models
3. `02-AUTH-SYSTEM.md` → Authentication setup
4. `03-LETTER-DATA-STRUCTURE.md` → JSON structure for all 26 letters
5. `04-STEP1-SEE-AND-LISTEN.md` → Step 1 component specs
6. `05-STEP2-RECOGNIZE.md` → Step 2 component specs
7. `06-STEP3-WRITE.md` → Step 3 component specs
8. `07-STEP4-GAMES.md` → All 8 games component specs
9. `08-REWARD-SYSTEM.md` → Reward system specs
10. `09-AUDIO-SYSTEM.md` → Audio manager specs
11. `10-CHARACTER-SYSTEM.md` → Lottie character specs
12. `11-TEACHER-DASHBOARD.md` → Teacher portal specs
13. `12-ADMIN-PORTAL.md` → Admin portal specs
14. `13-LICENSE-SYSTEM.md` → Subscription + license control
15. `14-PWA-OFFLINE.md` → PWA + offline mode setup
16. `15-API-ROUTES.md` → All API endpoints

---

## CORE RULES FOR CODING AGENT

1. **Always use TypeScript** — no `any` types
2. **Always use Tailwind** — no inline styles or CSS files
3. **Always use Framer Motion** for animations — no CSS animations
4. **Always use Howler.js** for audio — no HTML audio tags
5. **Always use Zustand** for game state — no useState for game logic
6. **Server Components by default** — use `"use client"` only when needed
7. **Mobile first** — app runs on tablets primarily
8. **No failure states for children** — wrong answers get gentle feedback only
9. **Preload all audio** before a lesson starts
10. **Every game must work offline** after first load
