"use client"

import Link from "next/link"
import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"
import { Character3D } from "@/components/character/Character3D"
import { PlayfulBackground } from "@/components/ui/PlayfulBackground"
import { BigButton } from "@/components/ui/BigButton"
import { Decor, type DecorName } from "@/components/ui/Decor"
import { InstallPrompt } from "@/components/pwa/InstallPrompt"

const CONTACT_EMAIL = "daviddezile@gmail.com"

// Scroll-reveal used by every section: rise, settle, tiny 3D unfold.
const reveal = {
  hidden: { opacity: 0, y: 60, rotateX: -12 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { type: "spring" as const, stiffness: 120, damping: 18 },
  },
}

const FLOATERS: { name: DecorName; className: string; size: number }[] = [
  { name: "star", className: "left-[8%] top-[18%]", size: 44 },
  { name: "balloon", className: "right-[10%] top-[14%]", size: 56 },
  { name: "butterfly", className: "left-[16%] bottom-[22%]", size: 48 },
  { name: "kite", className: "right-[14%] bottom-[26%]", size: 52 },
  { name: "cloud", className: "left-[38%] top-[8%]", size: 60 },
  { name: "sparkle", className: "right-[34%] top-[24%]", size: 34 },
]

// The parade of real lesson objects (images/things) that scrolls across the
// page — the actual pictures children meet inside Kinda.
const PARADE = [
  "elephant", "cat", "duck", "lion", "giraffe", "zebra", "rabbit", "frog",
  "apple", "banana", "mango", "orange", "butterfly", "bee", "bird", "fish",
  "dog", "hen", "kite", "ball", "car", "flower", "tree", "house",
].map((n) => `/images/things/${n}.png`)

const HERO_PHOTOS = [
  { src: "/images/things/elephant.png", alt: "Elephant" },
  { src: "/images/things/cat.png", alt: "Cat" },
  { src: "/images/things/duck.png", alt: "Duck" },
  { src: "/images/things/butterfly.png", alt: "Butterfly" },
]

const DIGITS = [
  { d: 1, c: "#FF6B6B" },
  { d: 2, c: "#F59F00" },
  { d: 3, c: "#40C057" },
  { d: 4, c: "#22B8CF" },
  { d: 5, c: "#7950F2" },
]

// "How a lesson works" — each step shown with the real artwork the child sees.
const LESSON_STEPS = [
  {
    title: "1 · See & hear it",
    text: "Madam introduces every letter and number by voice — the child sees real pictures and hears real words, never a wall of text.",
    img: "/images/letters/uppercase/A.jpg",
    alt: "Letter artwork",
  },
  {
    title: "2 · Touch & count it",
    text: "The child answers by touching: touch the letter, touch each duck as you count it out loud — one, two, three!",
    img: "/images/things/duck.png",
    alt: "Counting ducks",
  },
  {
    title: "3 · Write it",
    text: "A little guide hand shows the stroke, then the child traces letters AND numbers with their finger — at least three times each.",
    img: "/images/decor/write-guide-hand.png",
    alt: "Writing guide hand",
  },
  {
    title: "4 · Play & win",
    text: "Six mini-games per lesson turn practice into play — with gifts, stars and applause for every win.",
    img: "/images/decor/gift.png",
    alt: "Reward gift",
  },
]

export function LandingClient() {
  const { scrollYProgress } = useScroll()
  // The hero's floating art drifts up slightly faster than the page — a soft
  // parallax "magic" without any WebGL.
  const drift = useTransform(scrollYProgress, [0, 0.4], [0, -120])

  return (
    <div className="relative overflow-hidden">
      <PlayfulBackground />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
        <motion.div style={{ y: drift }} aria-hidden className="pointer-events-none absolute inset-0">
          {FLOATERS.map((f, i) => (
            <motion.span
              key={f.name}
              className={`absolute ${f.className}`}
              animate={{ y: [0, -14, 0], rotate: [0, i % 2 ? 6 : -6, 0] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
            >
              <Decor name={f.name} size={f.size} />
            </motion.span>
          ))}
        </motion.div>

        <div className="relative z-10 flex flex-col items-center gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 16 }}
            className="animate-float"
          >
            <Character3D state="excited" size={220} animate={false} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="shimmer-text text-6xl font-black sm:text-7xl"
          >
            Kinda
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl text-lg font-bold text-gray-500 sm:text-xl"
          >
            The voice-first learning system for nurseries and kindergartens —
            children aged 3–6 learn letters, numbers, counting and writing by
            <span className="text-violet-500"> touch</span>, guided by a warm
            teacher&apos;s voice. No reading needed.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-2 flex flex-col items-center gap-4 sm:flex-row"
          >
            <BigButton href="/student" pulse>
              <span className="inline-flex items-center gap-2">
                I&apos;m a Student
                <Decor name="backpack" size={28} />
              </span>
            </BigButton>
            <Link
              href="/teacher"
              className="btn-press glass-card inline-flex items-center gap-2 rounded-full px-8 py-4 text-lg font-bold text-gray-600"
            >
              I&apos;m a Teacher
              <Decor name="apple" size={28} />
            </Link>
          </motion.div>

          <motion.a
            href="#get-kinda"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-sm font-bold text-violet-400 underline-offset-4 hover:underline"
          >
            Get Kinda for your school ↓
          </motion.a>
        </div>
      </section>

      {/* ── Parade of real lesson pictures ───────────────────────────── */}
      <section aria-hidden className="relative z-10 overflow-hidden pb-16">
        <motion.div
          className="flex w-max items-center gap-10"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
        >
          {[...PARADE, ...PARADE].map((src, i) => (
            <Image
              key={`${src}-${i}`}
              src={src}
              alt=""
              width={72}
              height={72}
              className="h-16 w-16 shrink-0 object-contain drop-shadow-md sm:h-[72px] sm:w-[72px]"
            />
          ))}
        </motion.div>
      </section>

      {/* ── What your child learns ───────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-20" style={{ perspective: 1200 }}>
        <motion.h2
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="mb-10 text-center text-3xl font-black text-gray-700 sm:text-4xl"
        >
          Two worlds to explore
        </motion.h2>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Letters world */}
          <TiltCard>
            <div className="flex items-center gap-2">
              {["A", "B", "C"].map((l, i) => (
                <span
                  key={l}
                  className="grid h-16 w-16 place-items-center rounded-2xl text-4xl font-black text-white shadow-lg"
                  style={{
                    background: ["#FF6B6B", "#F59F00", "#40C057"][i],
                    transform: `rotate(${(i - 1) * 8}deg) translateZ(30px)`,
                  }}
                >
                  {l}
                </span>
              ))}
            </div>
            <h3 className="text-2xl font-black text-gray-700">Letters A–Z</h3>
            <p className="font-bold text-gray-500">
              See it, hear it, touch it, write it — every letter becomes real
              pictures, songs and six little games.
            </p>
            <div className="flex -space-x-2">
              {HERO_PHOTOS.map((p) => (
                <Image
                  key={p.src}
                  src={p.src}
                  alt={p.alt}
                  width={56}
                  height={56}
                  className="h-14 w-14 object-contain drop-shadow"
                />
              ))}
            </div>
          </TiltCard>

          {/* Numbers world */}
          <TiltCard>
            <div className="flex items-end gap-1.5">
              {DIGITS.map(({ d, c }, i) => (
                <span
                  key={d}
                  className="grid place-items-center rounded-2xl bg-white text-3xl font-black shadow-lg"
                  style={{
                    color: c,
                    width: 52,
                    height: 52 + i * 6,
                    transform: "translateZ(26px)",
                    boxShadow: `0 12px 22px -10px ${c}aa`,
                  }}
                >
                  {d}
                </span>
              ))}
            </div>
            <h3 className="text-2xl font-black text-gray-700">Numbers 1–10</h3>
            <p className="font-bold text-gray-500">
              Count real lions, ducks and apples — tap each one and hear it
              counted out loud, write every digit, then play six counting games
              per number.
            </p>
            <div className="flex -space-x-2">
              {["lion", "duck", "apple", "banana"].map((n) => (
                <Image
                  key={n}
                  src={`/images/things/${n}.png`}
                  alt={n}
                  width={56}
                  height={56}
                  className="h-14 w-14 object-contain drop-shadow"
                />
              ))}
            </div>
          </TiltCard>
        </div>
      </section>

      {/* ── How a lesson works (animated explainer) ──────────────────── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-20">
        <motion.h2
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="mb-10 text-center text-3xl font-black text-gray-700 sm:text-4xl"
        >
          How a lesson works
        </motion.h2>

        <div className="flex flex-col gap-6">
          {LESSON_STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, x: i % 2 ? 80 : -80 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ type: "spring", stiffness: 110, damping: 18 }}
              className={`glass-card flex items-center gap-5 rounded-[2.5rem] p-6 sm:gap-8 sm:p-8 ${
                i % 2 ? "sm:flex-row-reverse sm:text-right" : ""
              }`}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
                className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl bg-white/80 p-2 shadow-lg sm:h-28 sm:w-28"
              >
                <Image
                  src={s.img}
                  alt={s.alt}
                  width={112}
                  height={112}
                  className="max-h-full max-w-full rounded-2xl object-contain"
                />
              </motion.div>
              <div>
                <h3 className="text-xl font-black text-gray-700 sm:text-2xl">{s.title}</h3>
                <p className="mt-1 font-bold text-gray-500">{s.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Built for schools ────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-20">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="glass-card flex flex-col gap-8 rounded-[2.5rem] p-8 sm:p-12 lg:flex-row lg:items-center"
        >
          <div className="flex shrink-0 items-center justify-center gap-4">
            <Image
              src="/images/character/child-teacher.jpg"
              alt="A teacher guiding a child"
              width={200}
              height={240}
              className="h-56 w-44 rounded-[2rem] object-cover shadow-xl ring-4 ring-white/80"
            />
            <Image
              src="/images/character/teacher-child1.jpg"
              alt="A child learning with their teacher"
              width={200}
              height={240}
              className="mt-10 h-56 w-44 rounded-[2rem] object-cover shadow-xl ring-4 ring-white/80"
            />
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-black text-gray-700">
              The teacher stays in charge
            </h2>
            <p className="text-lg font-bold text-gray-500">
              Kinda is a school system, not just an app. Teachers run every
              class from a simple dashboard:
            </p>
            <ul className="space-y-2 font-bold text-gray-600">
              <li>✓ Choose what <em>each child</em> studies today — letters or numbers, and at which level</li>
              <li>✓ Set the class curriculum: which letters, in which order, which steps</li>
              <li>✓ See who needs more support, automatically — before they fall behind</li>
              <li>✓ Track every star, attempt and completed stage per child</li>
            </ul>
            <p className="text-sm font-bold text-gray-400">
              Children just tap their own picture to start — Kinda sends them
              exactly where their teacher planned.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── A real teacher's voice ───────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-20">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="glass-card flex flex-col items-center gap-8 rounded-[2.5rem] p-8 sm:flex-row sm:p-12"
        >
          <div className="shrink-0">
            <Character3D state="teaching" size={200} animate={false} />
          </div>
          <div className="flex flex-col gap-4 text-center sm:text-left">
            <h2 className="text-3xl font-black text-gray-700">
              A real teacher&apos;s voice, every step
            </h2>
            <p className="text-lg font-bold text-gray-500">
              Madam welcomes your child, says what today&apos;s lesson is, and
              guides every touch — praise when they get it, gentle help when
              they don&apos;t. Children who can&apos;t read yet never feel lost.
            </p>
            <ul className="flex flex-wrap justify-center gap-3 sm:justify-start">
              {/* House rule: the tap cue is the 👆 emoji, never the generated
                  pointing-hand image. */}
              <li className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 font-bold text-gray-600 shadow">
                <span className="text-[22px] leading-none" aria-hidden>
                  👆
                </span>
                Tap to answer
              </li>
              {(
                [
                  ["sound-on", "Voice-first"],
                  ["gift", "Gifts & rewards"],
                  ["star_badge", "Progress map"],
                ] as [DecorName, string][]
              ).map(([icon, label]) => (
                <li
                  key={label}
                  className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 font-bold text-gray-600 shadow"
                >
                  <Decor name={icon} size={22} />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </section>

      {/* ── How to get Kinda ─────────────────────────────────────────── */}
      <section id="get-kinda" className="relative z-10 mx-auto max-w-5xl scroll-mt-10 px-6 pb-20">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="glass-card flex flex-col items-center gap-8 rounded-[2.5rem] p-8 sm:flex-row sm:p-12"
        >
          <Image
            src="/images/character/welcoming-sir.png"
            alt="Kinda's onboarding guide welcoming you"
            width={220}
            height={260}
            className="h-60 w-52 shrink-0 object-contain drop-shadow-xl"
          />
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-black text-gray-700">
              Getting Kinda for your school
            </h2>
            <ol className="space-y-3 font-bold text-gray-600">
              <li>
                <span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-full bg-[#ff6b9d] text-sm text-white">1</span>
                Write to us — tell us your school&apos;s name and how many classes you have.
              </li>
              <li>
                <span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-full bg-[#f59f00] text-sm text-white">2</span>
                We set up your school, admin and teacher accounts, and help you register your classes.
              </li>
              <li>
                <span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-full bg-[#40c057] text-sm text-white">3</span>
                Children pick their own picture and start learning — on any tablet, phone or computer.
              </li>
            </ol>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Kinda for our school`}
              className="btn-press self-start rounded-full bg-linear-to-r from-[#ff6b9d] to-[#ffc24a] px-8 py-3.5 text-lg font-black text-white shadow-lg"
            >
              Contact us — {CONTACT_EMAIL}
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── Install ──────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 pb-16">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
        >
          <InstallPrompt />
        </motion.div>
      </section>

      <footer className="relative z-10 pb-10 text-center text-sm font-bold text-gray-400">
        Kinda — where little ones learn foundational skills · works offline as
        an installed app
      </footer>
    </div>
  )
}

// A feature card that tilts in 3D toward the cursor/tap — the "magic" feel
// without WebGL, matching the app's CSS-3D house style.
function TiltCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      whileHover={{ rotateX: 8, rotateY: -8, y: -10, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{ transformStyle: "preserve-3d" }}
      className="glass-card flex flex-col items-center gap-4 rounded-[2.5rem] p-8 text-center shadow-[0_30px_60px_-30px_rgba(80,80,160,0.4)]"
    >
      {children}
    </motion.div>
  )
}
