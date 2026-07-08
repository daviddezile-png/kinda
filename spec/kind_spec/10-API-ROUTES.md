# API ROUTES
## All endpoints the coding agent must build

---

## BASE URL: `/api`

---

## AUTH ROUTES

```
POST /api/auth/register-school
  Body: { schoolName, email, password, phone }
  Returns: { school, user, token }
  Action: Creates school + admin user + starts 30-day trial

POST /api/auth/[...nextauth]
  Handled by NextAuth.js automatically

POST /api/auth/forgot-password
  Body: { email }
  Returns: { message }
  Action: Sends reset email

POST /api/auth/reset-password
  Body: { token, newPassword }
  Returns: { message }
```

---

## ADMIN ROUTES (require ADMIN role)

```
GET /api/admin/school
  Returns: school info + subscription status + stats

PUT /api/admin/school
  Body: { name?, phone?, address?, language? }
  Returns: updated school

GET /api/admin/classes
  Returns: all classes with teacher + student count

POST /api/admin/classes
  Body: { name, level, teacherId? }
  Returns: new class

PUT /api/admin/classes/[id]
  Body: { name?, level?, teacherId? }
  Returns: updated class

DELETE /api/admin/classes/[id]
  Returns: { success }

GET /api/admin/teachers
  Returns: all teachers with their class

POST /api/admin/teachers/invite
  Body: { name, email, classId? }
  Returns: { message } — sends invite email

DELETE /api/admin/teachers/[id]
  Returns: { success }

GET /api/admin/students
  Query: { classId? }
  Returns: all students with progress summary

GET /api/admin/subscription
  Returns: current subscription + history

POST /api/admin/subscription/renew
  Body: { plan, paymentMethod, reference? }
  Returns: updated subscription
```

---

## TEACHER ROUTES (require TEACHER role)

```
GET /api/teacher/class
  Returns: teacher's class + all students

GET /api/teacher/students
  Returns: all students in teacher's class with progress

POST /api/teacher/students
  Body: { name, age?, avatar?, pin? }
  Returns: new student

PUT /api/teacher/students/[id]
  Body: { name?, age?, avatar?, classId? }
  Returns: updated student

DELETE /api/teacher/students/[id]
  Returns: { success }

GET /api/teacher/students/[id]/progress
  Returns: detailed progress for student

GET /api/teacher/reports/class
  Query: { period: "week" | "month" | "all" }
  Returns: class-wide statistics
```

---

## STUDENT ROUTES (require valid session)

```
GET /api/student/profile
  Returns: student info + overall progress

GET /api/student/letters
  Returns: all 26 letters with completion status for this student

GET /api/student/letters/[letter]
  Returns: letter data + student's progress for this letter

POST /api/progress
  Body: { module, itemId, step, stars, timeSpent, completed }
  Returns: updated progress
  Note: If offline, this is saved to IndexedDB and synced later

GET /api/student/rewards
  Returns: all rewards earned by student
```

---

## PROGRESS ROUTE IMPLEMENTATION

```typescript
// src/app/api/progress/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { studentId, module, itemId, step, stars, timeSpent, completed } = body

  try {
    const progress = await prisma.progress.upsert({
      where: {
        studentId_module_itemId_step: {
          studentId,
          module,
          itemId,
          step,
        }
      },
      update: {
        stars: Math.max(stars, 0),  // keep highest stars
        attempts: { increment: 1 },
        timeSpent: { increment: timeSpent },
        completed,
        completedAt: completed ? new Date() : undefined,
      },
      create: {
        studentId,
        module,
        itemId,
        step,
        stars,
        attempts: 1,
        timeSpent,
        completed,
        completedAt: completed ? new Date() : null,
      }
    })

    return NextResponse.json({ progress })
  } catch (error) {
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 })
  }
}
```

---

## SCHOOL REGISTRATION ROUTE

```typescript
// src/app/api/auth/register-school/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { addDays } from "date-fns"

export async function POST(request: NextRequest) {
  const { schoolName, email, password, phone } = await request.json()

  // Validate
  if (!schoolName || !email || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Check email not already used
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 })
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  // Create school + admin user in one transaction
  const result = await prisma.$transaction(async (tx) => {
    const school = await tx.school.create({
      data: {
        name: schoolName,
        email,
        phone,
        subscriptionPlan: "TRIAL",
        trialEndsAt: addDays(new Date(), 30),
        subscriptionEnd: addDays(new Date(), 30),
      }
    })

    const user = await tx.user.create({
      data: {
        name: "Admin",
        email,
        password: hashedPassword,
        role: "ADMIN",
        schoolId: school.id,
      }
    })

    return { school, user }
  })

  return NextResponse.json({
    message: "School registered successfully! Your 30-day trial has started.",
    schoolId: result.school.id,
  })
}
```

---

## LETTERS DATA ROUTE

```typescript
// src/app/api/student/letters/[letter]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import letterData from "@/data/letters/a.json"  // dynamic import

export async function GET(
  request: NextRequest,
  { params }: { params: { letter: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const letter = params.letter.toLowerCase()

  try {
    // Dynamically import letter data
    const data = await import(`@/data/letters/${letter}.json`)
    return NextResponse.json(data.default)
  } catch {
    return NextResponse.json({ error: "Letter not found" }, { status: 404 })
  }
}
```

---

## ERROR HANDLING PATTERN

All routes should follow this pattern:

```typescript
export async function GET(request: NextRequest) {
  try {
    // 1. Check auth
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 2. Check subscription
    const school = await checkSubscription(session.user.schoolId)
    if (!school.isActive) return NextResponse.json({ error: "Subscription expired" }, { status: 403 })

    // 3. Do the work
    const data = await prisma.something.findMany(...)

    // 4. Return success
    return NextResponse.json({ data })

  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```
