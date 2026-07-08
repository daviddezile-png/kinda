# DATABASE SCHEMA
## Prisma + PostgreSQL (Supabase)

---

## COMPLETE PRISMA SCHEMA

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────
// SCHOOL
// ─────────────────────────────────────
model School {
  id               String         @id @default(cuid())
  name             String
  email            String         @unique
  phone            String?
  address          String?
  language         Language       @default(ENGLISH)
  subscriptionEnd  DateTime?
  subscriptionPlan Plan           @default(TRIAL)
  trialEndsAt      DateTime?
  isActive         Boolean        @default(true)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  // Relations
  users            User[]
  classes          Class[]
  subscriptions    Subscription[]
}

// ─────────────────────────────────────
// USER (Admin + Teacher)
// ─────────────────────────────────────
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  password      String
  role          Role
  schoolId      String
  school        School    @relation(fields: [schoolId], references: [id])
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  classes       Class[]
  sessions      Session[]
  accounts      Account[]
}

// ─────────────────────────────────────
// CLASS
// ─────────────────────────────────────
model Class {
  id        String    @id @default(cuid())
  name      String    // e.g. "Nursery A", "Baby Class"
  level     Level     @default(NURSERY)
  schoolId  String
  school    School    @relation(fields: [schoolId], references: [id])
  teacherId String?
  teacher   User?     @relation(fields: [teacherId], references: [id])
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  // Relations
  students  Student[]
}

// ─────────────────────────────────────
// STUDENT
// ─────────────────────────────────────
model Student {
  id        String    @id @default(cuid())
  name      String
  age       Int?
  avatar    String?   // image URL
  classId   String
  class     Class     @relation(fields: [classId], references: [id])
  pin       String?   // 4-digit PIN for student login
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  // Relations
  progress  Progress[]
  rewards   StudentReward[]
}

// ─────────────────────────────────────
// PROGRESS
// ─────────────────────────────────────
model Progress {
  id          String       @id @default(cuid())
  studentId   String
  student     Student      @relation(fields: [studentId], references: [id])
  module      Module       // LETTERS, MATH, READING
  itemId      String       // letter "A", number "1", etc.
  step        Int          // 1, 2, 3, or 4
  completed   Boolean      @default(false)
  stars       Int          @default(0) // 0-3
  attempts    Int          @default(0)
  timeSpent   Int          @default(0) // seconds
  completedAt DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@unique([studentId, module, itemId, step])
}

// ─────────────────────────────────────
// STUDENT REWARDS
// ─────────────────────────────────────
model StudentReward {
  id         String   @id @default(cuid())
  studentId  String
  student    Student  @relation(fields: [studentId], references: [id])
  rewardType String   // "candy", "car", "ice_cream" etc
  rewardName String
  earnedAt   DateTime @default(now())
}

// ─────────────────────────────────────
// SUBSCRIPTION
// ─────────────────────────────────────
model Subscription {
  id        String             @id @default(cuid())
  schoolId  String
  school    School             @relation(fields: [schoolId], references: [id])
  plan      Plan
  status    SubscriptionStatus @default(ACTIVE)
  amount    Float
  currency  String             @default("TZS")
  startDate DateTime
  endDate   DateTime
  paidAt    DateTime?
  method    PaymentMethod?
  reference String?            // M-Pesa transaction reference
  createdAt DateTime           @default(now())
}

// ─────────────────────────────────────
// NEXTAUTH REQUIRED MODELS
// ─────────────────────────────────────
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─────────────────────────────────────
// ENUMS
// ─────────────────────────────────────
enum Role {
  ADMIN
  TEACHER
}

enum Level {
  BABY_CLASS
  NURSERY
  KINDERGARTEN
}

enum Module {
  LETTERS
  MATH
  READING
}

enum Plan {
  TRIAL
  BASIC
  STANDARD
  PREMIUM
}

enum SubscriptionStatus {
  ACTIVE
  EXPIRED
  CANCELLED
  PENDING
}

enum PaymentMethod {
  MPESA
  CARD
  BANK
}

enum Language {
  ENGLISH
  SWAHILI
  BOTH
}
```

---

## KEY RELATIONSHIPS

```
School
  ├── has many Users (Admin + Teachers)
  ├── has many Classes
  └── has many Subscriptions

Class
  ├── belongs to School
  ├── belongs to Teacher (User)
  └── has many Students

Student
  ├── belongs to Class
  ├── has many Progress records
  └── has many StudentRewards

Progress
  └── belongs to Student
  └── tracks: module + itemId + step + stars + timeSpent
```

---

## MIDDLEWARE — LICENSE CONTROL

Create `src/middleware.ts` to check subscription on every request:

```typescript
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })

  // Not logged in — redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Check subscription
  const school = token.school as any
  if (school?.subscriptionEnd) {
    const isExpired = new Date(school.subscriptionEnd) < new Date()
    if (isExpired && !request.nextUrl.pathname.startsWith('/expired')) {
      return NextResponse.redirect(new URL('/expired', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/teacher/:path*',
    '/student/:path*',
  ]
}
```

---

## ENVIRONMENT VARIABLES

Create `.env.local`:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```
