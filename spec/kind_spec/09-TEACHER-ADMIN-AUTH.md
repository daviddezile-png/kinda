# TEACHER DASHBOARD & ADMIN PORTAL
## Specifications

---

# TEACHER DASHBOARD
## Route: `/teacher`

---

## WHAT TEACHER SEES

### Main Dashboard `/teacher/dashboard`

```
┌─────────────────────────────────────────┐
│  Kinda    [My Class] [Reports]    │
├─────────────────────────────────────────┤
│  Good morning, Mrs. Amina! 👋           │
│  Nursery A — 18 students                │
├──────────────┬──────────────────────────┤
│ 📊 Overview  │                          │
│              │  Class Progress          │
│ 18 students  │  ████████░░ 78%          │
│ 14 active    │  Letters: 12/26 avg      │
│ today        │                          │
└──────────────┴──────────────────────────┘

Student Cards Grid:
┌──────────┐  ┌──────────┐  ┌──────────┐
│ 👦 James │  │ 👧 Amira │  │ 👦 Peter │
│ ████░ 80%│  │ ██░░░ 40%│  │ █████100%│
│ Letter M │  │ Letter F │  │ Done! ⭐ │
└──────────┘  └──────────┘  └──────────┘
```

### Student Detail Page `/teacher/students/[id]`

Shows:
- Student name, age, class
- Overall progress: % of letters completed
- Per-letter breakdown: which steps done, stars earned
- Reward chest: all rewards earned
- Time spent per day (last 7 days bar chart)
- Recent activity timeline

---

## TEACHER COMPONENTS TO BUILD

### 1. `TeacherLayout` — `/src/components/teacher/TeacherLayout.tsx`

```typescript
// Navigation sidebar with:
// - Dashboard
// - My Students
// - Progress Reports
// - Settings
// - Logout
```

### 2. `StudentCard` — `/src/components/teacher/StudentCard.tsx`

```typescript
interface StudentCardProps {
  student: {
    id: string
    name: string
    avatar?: string
    progressPercent: number
    currentLetter: string
    lastActiveAt: Date | null
    totalStars: number
  }
  onClick: () => void
}
```

**Visual:**
- Student avatar (or emoji placeholder)
- Name
- Progress bar (colorful)
- Current letter badge
- "Last active: 2 hours ago" or "Not active today" (red)

### 3. `ProgressReport` — `/src/components/teacher/ProgressReport.tsx`

```typescript
interface ProgressReportProps {
  studentId: string
  period: "week" | "month" | "all"
}
```

**Shows:**
- Letters completed vs total (26)
- Stars earned total
- Time spent learning (minutes)
- Most played game
- Weakest letter (most attempts)
- Reward collection

### 4. `ClassOverview` — `/src/components/teacher/ClassOverview.tsx`

**Shows for whole class:**
- Average completion %
- Students who haven't been active today (red warning)
- Students who completed the most this week (celebrate them!)
- Which letter most students are stuck on

---

## API ROUTES FOR TEACHER

```typescript
// GET /api/teacher/class
// Returns: class info + all students with their progress summary

// GET /api/teacher/students/[id]/progress
// Returns: detailed progress for one student

// GET /api/teacher/reports/class
// Returns: class-wide statistics
```

---

# ADMIN PORTAL
## Route: `/admin`

---

## WHAT ADMIN SEES

### Main Dashboard `/admin/dashboard`

```
┌─────────────────────────────────────────┐
│  SUNSHINE SCHOOL ACADEMY                │
│  Admin: Mrs. Grace  [Settings] [Logout] │
├───────────┬──────────┬──────────────────┤
│ 👨‍🏫       │ 👦       │ 📅               │
│ 4 Teachers│ 72       │ Subscription     │
│           │ Students │ Expires: Dec 2025│
│           │          │ [Renew Now]      │
└───────────┴──────────┴──────────────────┘

Classes:
┌──────────────┬──────────┬───────────────┐
│ Class        │ Teacher  │ Students      │
├──────────────┼──────────┼───────────────┤
│ Nursery A    │ Mrs Amina│ 18 students   │
│ Nursery B    │ Mr. John │ 20 students   │
│ Baby Class   │ Mrs. Rose│ 22 students   │
│ Kindergarten │ Mr. David│ 12 students   │
└──────────────┴──────────┴───────────────┘
[+ Add New Class]    [+ Invite Teacher]
```

---

## ADMIN COMPONENTS TO BUILD

### 1. `AdminLayout` — `/src/components/admin/AdminLayout.tsx`

Navigation:
- Dashboard
- Classes & Teachers
- All Students
- Subscription
- School Settings
- Logout

### 2. `ClassManagement` — `/src/components/admin/ClassManagement.tsx`

**Features:**
- Create new class (name + level)
- Assign teacher to class
- See all students per class
- Move student between classes

```typescript
// Create class form
interface CreateClassForm {
  name: string          // "Nursery A"
  level: Level          // NURSERY, BABY_CLASS, KINDERGARTEN
  teacherId?: string    // optional — assign teacher now or later
}
```

### 3. `TeacherInvite` — `/src/components/admin/TeacherInvite.tsx`

**Flow:**
1. Admin enters teacher email + name
2. System sends invite email with signup link
3. Teacher clicks link, sets password
4. Teacher assigned to school automatically

```typescript
// POST /api/admin/invite-teacher
interface InviteTeacherBody {
  name: string
  email: string
  classId?: string  // optional pre-assign to class
}
```

### 4. `SubscriptionStatus` — `/src/components/admin/SubscriptionStatus.tsx`

**Shows:**
- Current plan (Trial / Basic / Standard / Premium)
- Days remaining
- Number of students allowed vs current
- Renew button (links to payment page)
- Payment history table

---

## LICENSE CONTROL SYSTEM

### Middleware (already in 01-DATABASE-SCHEMA.md)

### Expired Page `/expired`

```typescript
// src/app/expired/page.tsx
// Shows when subscription is expired
// Cannot be bypassed by middleware

export default function ExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-3xl font-black text-red-600 mb-2">
          Subscription Expired
        </h1>
        <p className="text-gray-600 mb-6">
          Please contact your school admin to renew the subscription.
        </p>
        {/* Show admin contact info */}
        {/* For admins: show renew button */}
      </div>
    </div>
  )
}
```

### Reminder Email System

```typescript
// src/lib/subscriptionReminders.ts
// Run this as a cron job daily

async function sendReminders() {
  const schools = await prisma.school.findMany({
    where: {
      subscriptionEnd: {
        gte: new Date(),
        lte: addDays(new Date(), 30) // expires in 30 days or less
      }
    }
  })
  
  for (const school of schools) {
    const daysLeft = differenceInDays(school.subscriptionEnd!, new Date())
    
    if (daysLeft === 30 || daysLeft === 14 || daysLeft === 7) {
      await sendReminderEmail(school, daysLeft)
    }
  }
}
```

---

## API ROUTES FOR ADMIN

```typescript
// GET /api/admin/school — school info + stats
// GET /api/admin/classes — all classes
// POST /api/admin/classes — create class
// PUT /api/admin/classes/[id] — update class
// DELETE /api/admin/classes/[id] — delete class

// GET /api/admin/teachers — all teachers
// POST /api/admin/invite-teacher — send invite
// DELETE /api/admin/teachers/[id] — remove teacher

// GET /api/admin/students — all students with progress
// POST /api/admin/students — add student
// DELETE /api/admin/students/[id] — remove student

// GET /api/admin/subscription — subscription status
// POST /api/admin/subscription/renew — initiate renewal
```

---

## STUDENT LOGIN (Simple PIN System)

Since students are 3-6 years old, they can't type passwords.
Use a simple 4-image PIN system:

```typescript
// Student selects their avatar from a list
// Then selects 4 images in correct order (their PIN)
// e.g. 🐘 → 🦁 → 🐸 → 🌟

interface StudentPin {
  studentId: string
  pinImages: string[]  // ["elephant", "lion", "frog", "star"]
}
```

**Login screen for students:**
- Teacher opens class list
- Student finds their avatar
- Taps their avatar
- Taps 4 images in their PIN order
- Enters the app

**Alternative:** Teacher just selects student from a grid — student doesn't need to login themselves (for very young children in a classroom setting)

---

## AUTH SETUP

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { school: true }
        })
        
        if (!user) return null
        
        const isValid = await bcrypt.compare(
          credentials.password as string, 
          user.password
        )
        
        if (!isValid) return null
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId,
          school: user.school,
        }
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.schoolId = (user as any).schoolId
        token.school = (user as any).school
      }
      return token
    },
    session({ session, token }) {
      session.user.role = token.role as string
      session.user.schoolId = token.schoolId as string
      session.user.school = token.school as any
      return session
    }
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: { strategy: "jwt" }
})
```
