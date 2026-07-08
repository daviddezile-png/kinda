// Generates the Lottie animation JSON for every character state the app uses
// (public/images/character/{state}.json). Re-run: node scripts/gen-characters.mjs
//
// The character is "Rafiki" — a friendly human child, built as a small 2D rig:
// separate body / head / arm layers joined with Lottie layer parenting, so a
// body bounce carries the head and arms with it like a real figure. Each state
// keyframes the rig differently (blinks, talking mouth, waving/pointing arms,
// jumps, chewing, scanning eyes) instead of sliding a static face around.
//
// Free + self-contained: no API keys, no binary assets — pure Lottie JSON.
import { writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const W = 200
const H = 200
const FR = 30
const OP = 90 // 3s loop

// ── Palette (warm brown skin, dark curly hair, sunny outfit) ─────────────
const SKIN = [0.76, 0.53, 0.38]
const SKIN_DEEP = [0.62, 0.41, 0.29]
const HAIR = [0.17, 0.12, 0.1]
const SHIRT = [0.99, 0.55, 0.36]
const SHIRT_DEEP = [0.93, 0.42, 0.3]
const SHORTS = [0.18, 0.62, 0.58]
const SHOE = [0.97, 0.97, 0.99]
const MOUTH = [0.42, 0.18, 0.14]
const CHEEK = [1, 0.55, 0.55]
const EYE = [0.13, 0.1, 0.09]
const CONFETTI = [
  [1, 0.42, 0.62],
  [1, 0.83, 0.29],
  [0.42, 0.89, 1],
  [0.55, 0.87, 0.5],
  [0.75, 0.58, 1],
  [1, 0.62, 0.38],
]

// ── Lottie helpers ───────────────────────────────────────────────────────
const ease = { i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] } }
const still = (k) => ({ a: 0, k })
const anim = (frames) => ({
  a: 1,
  k: frames.map((f, i) => (i < frames.length - 1 ? { t: f.t, s: f.s, ...ease } : { t: f.t, s: f.s })),
})
// scalar / [x,y] → static; array of {t,s} keyframes → animated. (A plain
// number array is a static value, NOT a keyframe list — treating it as one
// produces invalid keyframes and lottie silently renders nothing.)
const prop = (v) => (Array.isArray(v) && typeof v[0] === "object" ? anim(v) : still(v))

const el = (p, s) => ({ ty: "el", p: still(p), s: still(s) })
const rc = (p, s, r = 8) => ({ ty: "rc", p: still(p), s: still(s), r: still(r) })
const sh = (v, i, o, closed = false) => ({ ty: "sh", ks: still({ i, o, v, c: closed }) })
const fl = (c, o = 100) => ({ ty: "fl", c: still([...c, 1]), o: still(o) })
const st = (c, w) => ({ ty: "st", c: still([...c, 1]), o: still(100), w: still(w), lc: 2, lj: 2 })
const tr = (over = {}) => ({
  ty: "tr",
  p: over.p ?? still([0, 0]),
  a: over.a ?? still([0, 0]),
  s: over.s ?? still([100, 100]),
  r: over.r ?? still(0),
  o: over.o ?? still(100),
})
const grp = (nm, shapes, t = tr()) => ({ ty: "gr", nm, it: [...shapes, t] })

const layer = ({ ind, nm, parent, a, p, r, s, o, shapes }) => ({
  ddd: 0,
  ind,
  ty: 4,
  nm,
  ...(parent ? { parent } : {}),
  sr: 1,
  ks: {
    o: prop(o ?? 100),
    r: prop(r ?? 0),
    p: prop(p ?? [0, 0]),
    a: still(a ?? [0, 0]),
    s: prop(s ?? [100, 100]),
  },
  ao: 0,
  shapes,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
})

// ── Rig geometry (canvas coords; character centred at x=100, feet ≈ y 178) ──
const HEAD_C = [100, 60]
const SHOULDER_R = [124, 98]
const SHOULDER_L = [76, 98]
const ARM_LEN = 34

// Mouth variants. All live in a group anchored at the mouth so a transform
// animation (talking / chewing) squashes it in place.
const MOUTHS = {
  smile: [grp("mouth", [sh([[92, 74], [100, 79], [108, 74]], [[0, 0], [-5, 0], [0, 0]], [[5, 0], [5, 0], [0, 0]]), st(MOUTH, 2.6)])],
  big: [
    grp("mouth", [
      sh([[89, 72], [111, 72], [100, 84]], [[0, 0], [0, 0], [7, 0]], [[0, 0], [-7, 0], [0, 0]], true),
      fl(MOUTH),
    ]),
  ],
  talk: (frames) => [
    grp(
      "mouth",
      [el([100, 77], [13, 10]), fl(MOUTH)],
      tr({ a: still([100, 77]), p: still([100, 77]), s: anim(frames) })
    ),
  ],
}
const TALK = [
  { t: 0, s: [100, 40] },
  { t: 10, s: [100, 100] },
  { t: 20, s: [100, 45] },
  { t: 30, s: [100, 90] },
  { t: 40, s: [100, 40] },
  { t: 55, s: [100, 100] },
  { t: 70, s: [100, 45] },
  { t: 90, s: [100, 40] },
]
const CHEW = [
  { t: 0, s: [100, 30] },
  { t: 8, s: [110, 95] },
  { t: 16, s: [100, 30] },
  { t: 24, s: [110, 95] },
  { t: 32, s: [100, 30] },
  { t: 60, s: [100, 30] },
  { t: 68, s: [110, 95] },
  { t: 76, s: [100, 30] },
  { t: 90, s: [100, 30] },
]

// Standard blink: eyes squash shut around the given frames.
const blink = (at) => {
  const k = [{ t: 0, s: [100, 100] }]
  for (const t of at) {
    k.push({ t: t - 3, s: [100, 100] }, { t, s: [100, 8] }, { t: t + 3, s: [100, 100] })
  }
  k.push({ t: OP, s: [100, 100] })
  return k
}

/**
 * Head layer: face + hair + features. `opts`:
 *  - mouth: "smile" | "big" | shape[] (prebuilt talk/chew group)
 *  - blinkAt: frames the eyes blink shut
 *  - eyeShift: keyframes for the eye group position (watching state)
 *  - rot: head rotation keyframes
 */
function headLayer(opts) {
  const eyeTr = tr({
    a: still([100, 59]),
    p: opts.eyeShift ? anim(opts.eyeShift) : still([100, 59]),
    s: anim(blink(opts.blinkAt ?? [40])),
  })
  const mouth = Array.isArray(opts.mouth) ? opts.mouth : MOUTHS[opts.mouth ?? "smile"]
  return layer({
    ind: 2,
    nm: "head",
    parent: 5,
    a: [100, 84],
    p: [100, 84],
    r: opts.rot ?? 0,
    shapes: [
      grp("brows", [
        grp("browL", [sh([[86, 50], [96, 49]], [[0, 0], [-3, -1]], [[3, 1], [0, 0]]), st(HAIR, 2.2)]),
        grp("browR", [sh([[104, 49], [114, 50]], [[0, 0], [-3, 1]], [[3, -1], [0, 0]]), st(HAIR, 2.2)]),
      ]),
      grp(
        "eyes",
        [
          grp("eyeL", [el([91, 59], [7.5, 9.5]), fl(EYE)]),
          grp("eyeR", [el([109, 59], [7.5, 9.5]), fl(EYE)]),
          grp("glintL", [el([89.5, 56.5], [2.6, 2.6]), fl([1, 1, 1])]),
          grp("glintR", [el([107.5, 56.5], [2.6, 2.6]), fl([1, 1, 1])]),
        ],
        eyeTr
      ),
      grp("nose", [el([100, 67.5], [7, 5.5]), fl(SKIN_DEEP)]),
      ...mouth,
      grp("cheeks", [
        grp("cheekL", [el([84, 69], [10, 7]), fl(CHEEK, 38)]),
        grp("cheekR", [el([116, 69], [10, 7]), fl(CHEEK, 38)]),
      ]),
      grp("ears", [
        grp("earL", [el([72, 61], [10, 13]), fl(SKIN)]),
        grp("earR", [el([128, 61], [10, 13]), fl(SKIN)]),
      ]),
      // curly cap: a crown of puffs above the hairline (y≈46) — the closing
      // edge stays straight so hair never dips over the eyes (y≈59).
      grp("hair", [
        grp("puff1", [el([79, 40], [20, 18]), fl(HAIR)]),
        grp("puff2", [el([94, 34], [24, 20]), fl(HAIR)]),
        grp("puff3", [el([110, 35], [22, 19]), fl(HAIR)]),
        grp("puff4", [el([121, 41], [17, 16]), fl(HAIR)]),
        grp("cap", [sh(
          [[75, 46], [100, 28], [125, 46]],
          [[0, 6], [-17, 0], [0, -10]],
          [[0, -10], [17, 0], [0, 6]],
          false
        ), fl(HAIR)]),
      ]),
      grp("face", [el(HEAD_C, [54, 56]), fl(SKIN)]),
    ],
  })
}

// Arm: a capsule hanging from the shoulder, rotated at the shoulder joint.
// r = 0 hangs down; negative r raises the right arm outward/up (mirror for left).
function armLayer(ind, nm, shoulder, rot) {
  const [sx, sy] = shoulder
  return layer({
    ind,
    nm,
    parent: 5,
    a: shoulder,
    p: shoulder,
    r: rot,
    shapes: [
      grp("hand", [el([sx, sy + ARM_LEN], [13, 13]), fl(SKIN)]),
      grp("sleeve", [rc([sx, sy + 7], [15, 18], 7), fl(SHIRT_DEEP)]),
      grp("arm", [rc([sx, sy + ARM_LEN / 2 + 2], [11, ARM_LEN + 4], 6), fl(SKIN)]),
    ],
  })
}

// Body: neck, shirt, shorts, legs, shoes. Carries the master motion (ind 5).
function bodyLayer(opts = {}) {
  return layer({
    ind: 5,
    nm: "body",
    a: [100, 178],
    p: opts.pos ?? [100, 178],
    s: opts.squash ?? [100, 100],
    shapes: [
      grp("neck", [rc([100, 88], [13, 12], 5), fl(SKIN)]),
      grp("shirt", [rc([100, 116], [50, 50], 16), fl(SHIRT)]),
      grp("collar", [el([100, 95], [18, 8]), fl(SHIRT_DEEP)]),
      grp("shorts", [rc([100, 147], [42, 18], 8), fl(SHORTS)]),
      grp("legL", [rc([91, 162], [12, 26], 6), fl(SKIN)]),
      grp("legR", [rc([109, 162], [12, 26], 6), fl(SKIN)]),
      grp("shoeL", [el([90, 175], [18, 9]), fl(SHOE)]),
      grp("shoeR", [el([110, 175], [18, 9]), fl(SHOE)]),
    ],
  })
}

function shadowLayer(opts = {}) {
  return layer({
    ind: 6,
    nm: "shadow",
    a: [100, 184],
    p: [100, 184],
    s: opts.scale ?? [100, 100],
    shapes: [grp("shadow", [el([100, 184], [74, 10]), fl([0.2, 0.16, 0.3], 14)])],
  })
}

function confettiLayer() {
  const pieces = CONFETTI.map((c, i) => {
    const x0 = 24 + i * 30
    const drift = i % 2 === 0 ? 14 : -14
    const t0 = (i * 13) % 45
    return grp(
      `confetti${i}`,
      [el([0, 0], [7, 7]), fl(c)],
      tr({
        p: anim([
          { t: 0, s: [x0, -12 + t0 * -2] },
          { t: OP, s: [x0 + drift, 214] },
        ]),
        r: anim([{ t: 0, s: [0] }, { t: OP, s: [i % 2 === 0 ? 260 : -260] }]),
      })
    )
  })
  return layer({ ind: 1, nm: "confetti", shapes: pieces })
}

// ── Per-state rig choreography ───────────────────────────────────────────
const kf = (pairs) => pairs.map(([t, ...s]) => ({ t, s }))

const STATES = {
  idle: {
    body: { pos: kf([[0, 100, 178], [45, 100, 174], [90, 100, 178]]) },
    head: { mouth: "smile", blinkAt: [38, 78], rot: kf([[0, -2], [45, 2], [90, -2]]) },
    armR: kf([[0, -6], [45, 6], [90, -6]]),
    armL: kf([[0, 5], [45, -5], [90, 5]]),
  },
  teaching: {
    body: { pos: kf([[0, 100, 178], [45, 100, 175], [90, 100, 178]]) },
    head: { mouth: MOUTHS.talk(TALK), blinkAt: [60], rot: kf([[0, -3], [22, 3], [45, -3], [67, 3], [90, -3]]) },
    // right arm raised outward, gesturing while "explaining"
    // (verified in-renderer: NEGATIVE rotation swings the right arm out/up,
    //  positive crosses the body — mirrored for the left arm)
    armR: kf([[0, -150], [20, -132], [40, -152], [60, -130], [90, -150]]),
    armL: kf([[0, 4], [45, -4], [90, 4]]),
  },
  pointing: {
    body: { pos: kf([[0, 100, 178], [45, 100, 176], [90, 100, 178]]) },
    head: { mouth: "smile", blinkAt: [50], rot: kf([[0, 5], [45, 8], [90, 5]]) },
    // arm held out horizontally with an insistent little pulse
    armR: kf([[0, -95], [15, -83], [30, -95], [45, -83], [60, -95], [90, -95]]),
    armL: kf([[0, 3], [45, -3], [90, 3]]),
  },
  happy: {
    body: {
      pos: kf([[0, 100, 178], [22, 100, 166], [45, 100, 178], [67, 100, 166], [90, 100, 178]]),
      squash: kf([[0, 103, 96], [22, 98, 104], [45, 103, 96], [67, 98, 104], [90, 103, 96]]),
    },
    head: { mouth: "big", blinkAt: [44], rot: kf([[0, -4], [45, 4], [90, -4]]) },
    armR: kf([[0, -30], [22, -60], [45, -30], [67, -60], [90, -30]]),
    armL: kf([[0, 30], [22, 60], [45, 30], [67, 60], [90, 30]]),
  },
  excited: {
    body: {
      pos: kf([[0, 100, 178], [12, 100, 158], [24, 100, 178], [36, 100, 158], [48, 100, 178], [90, 100, 178]]),
      squash: kf([[0, 104, 94], [12, 96, 106], [24, 104, 94], [36, 96, 106], [48, 104, 94], [90, 104, 94]]),
    },
    head: { mouth: "big", blinkAt: [70], rot: kf([[0, -5], [24, 5], [48, -5], [90, -5]]) },
    armR: kf([[0, -120], [12, -145], [24, -120], [36, -145], [48, -120], [90, -120]]),
    armL: kf([[0, 120], [12, 145], [24, 120], [36, 145], [48, 120], [90, 120]]),
  },
  celebrating: {
    confetti: true,
    body: {
      pos: kf([[0, 100, 178], [15, 100, 156], [30, 100, 178], [45, 100, 158], [60, 100, 178], [90, 100, 178]]),
      squash: kf([[0, 105, 93], [15, 95, 107], [30, 105, 93], [45, 95, 107], [60, 105, 93], [90, 105, 93]]),
    },
    shadow: { scale: kf([[0, 100, 100], [15, 70, 100], [30, 100, 100], [45, 72, 100], [60, 100, 100], [90, 100, 100]]) },
    head: { mouth: "big", blinkAt: [75], rot: kf([[0, -6], [30, 6], [60, -6], [90, -6]]) },
    // both arms up and clearly outside the head silhouette, waving
    // (beyond ≈-150 the hand starts to overlap the ears/hair)
    armR: kf([[0, -128], [15, -148], [30, -126], [45, -148], [60, -128], [90, -128]]),
    armL: kf([[0, 128], [15, 148], [30, 126], [45, 148], [60, 128], [90, 128]]),
  },
  nom_nom: {
    body: { pos: kf([[0, 100, 178], [45, 100, 176], [90, 100, 178]]) },
    head: { mouth: MOUTHS.talk(CHEW), blinkAt: [30, 70], rot: kf([[0, 2], [30, -3], [60, 2], [90, 2]]) },
    // hand travels to the mouth and back — feeding itself (+130 ≈ hand at mouth)
    armR: kf([[0, -15], [14, 130], [40, 130], [55, -15], [76, -15], [90, -15]]),
    armL: kf([[0, 6], [45, -6], [90, 6]]),
  },
  watching: {
    body: { pos: kf([[0, 100, 178], [45, 100, 176], [90, 100, 178]]) },
    head: {
      mouth: "smile",
      blinkAt: [66],
      rot: kf([[0, -5], [25, 5], [55, 5], [80, -5], [90, -5]]),
      eyeShift: kf([[0, 95, 59], [25, 105, 59], [55, 105, 59], [80, 95, 59], [90, 95, 59]]),
    },
    armR: kf([[0, -4], [45, 4], [90, -4]]),
    armL: kf([[0, 4], [45, -4], [90, 4]]),
  },
}

function build(name, cfg) {
  const layers = []
  if (cfg.confetti) layers.push(confettiLayer())
  layers.push(
    headLayer(cfg.head),
    armLayer(3, "armR", SHOULDER_R, cfg.armR),
    bodyLayer(cfg.body),
    armLayer(4, "armL", SHOULDER_L, cfg.armL),
    shadowLayer(cfg.shadow)
  )
  return { v: "5.7.4", fr: FR, ip: 0, op: OP, w: W, h: H, nm: `rafiki-${name}`, ddd: 0, assets: [], layers }
}

const dir = join(process.cwd(), "public", "images", "character")
mkdirSync(dir, { recursive: true })

let count = 0
for (const [name, cfg] of Object.entries(STATES)) {
  writeFileSync(join(dir, `${name}.json`), JSON.stringify(build(name, cfg)), "utf8")
  count++
}
console.log(`Generated ${count} Rafiki character animations in public/images/character/`)
