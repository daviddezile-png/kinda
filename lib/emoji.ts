// Maps a word/label to a representative emoji, used as a friendly picture
// fallback until real artwork is added. Keyed by normalized lowercase label.

const EMOJI: Record<string, string> = {
  // A–Z letter words
  apple: "🍎", ant: "🐜", arrow: "➡️",
  ball: "⚽", banana: "🍌", bird: "🐦",
  cat: "🐱", car: "🚗", cup: "☕",
  dog: "🐶", duck: "🦆", door: "🚪",
  egg: "🥚", elephant: "🐘", eye: "👁️",
  fish: "🐟", frog: "🐸", flag: "🚩",
  goat: "🐐", grapes: "🍇", gate: "🚧",
  hat: "🎩", horse: "🐴", house: "🏠",
  "ice cream": "🍦", igloo: "🛖", insect: "🐛",
  juice: "🧃", jacket: "🧥", jar: "🫙",
  kite: "🪁", key: "🔑", kangaroo: "🦘",
  lion: "🦁", leaf: "🍃", lamp: "💡",
  mango: "🥭", monkey: "🐵", moon: "🌙",
  nest: "🪺", nurse: "👩‍⚕️", net: "🥅",
  orange: "🍊", owl: "🦉", ocean: "🌊",
  pineapple: "🍍", pig: "🐷", pen: "🖊️",
  queen: "👑", quilt: "🛏️", quail: "🐦",
  rain: "🌧️", rabbit: "🐰", ring: "💍",
  sun: "☀️", snake: "🐍", star: "⭐",
  tree: "🌳", tiger: "🐯", train: "🚆",
  umbrella: "☂️", uncle: "👨", up: "⬆️",
  van: "🚐", vase: "🏺", violin: "🎻",
  water: "💧", wolf: "🐺", wind: "🌬️",
  "x ray": "🩻", "x-ray": "🩻", xylophone: "🎹", box: "📦",
  "yo yo": "🪀", "yo-yo": "🪀", yak: "🐂", yarn: "🧶",
  zebra: "🦓", zoo: "🦁", zip: "🤐",

  // Distractors
  airplane: "✈️", basket: "🧺", candle: "🕯️", desk: "🪑",
  fork: "🍴", glove: "🧤", hammer: "🔨", iron: "🧺",
  jug: "🫗", knife: "🔪", lock: "🔒", map: "🗺️",
  nail: "🔩", oven: "🍳", paint: "🎨", rope: "🪢",
  sock: "🧦", table: "🪑", wall: "🧱", zipper: "🤐",

  // Rewards
  candy: "🍬", "toy car": "🚗", "ice cream2": "🍦", lollipop: "🍭",
  "teddy bear": "🧸", teddy: "🧸", cake: "🍰", chips: "🍟",

  // Swahili words
  asali: "🍯", aiskrimu: "🍦", askari: "👮",
  bata: "🦆", bendera: "🚩", baiskeli: "🚲",
  chai: "☕", chungwa: "🍊", chura: "🐸",
  duka: "🏪", daftari: "📓", dirisha: "🪟",
  embe: "🥭", elimu: "🎓", eropleni: "✈️",
  farasi: "🐴", funguo: "🔑", fisi: "🐆",
  gari: "🚗", gitaa: "🎸", glasi: "🥛",
  hema: "⛺", hospitali: "🏥", herufi: "🔤",
  inzi: "🪰", ikulu: "🏛️", injini: "⚙️",
  jua: "☀️", jani: "🍃", jiko: "🍳",
  kuku: "🐔", kalamu: "🖊️", kiti: "🪑",
  limau: "🍋", lori: "🚚", leso: "🧣",
  mbwa: "🐶", mti: "🌳", mpira: "⚽",
  nyumba: "🏠", nyoka: "🐍", nazi: "🥥",
  ofisi: "🏢", oveni: "🍳", orodha: "📋",
  paka: "🐱", pesa: "💰", parachichi: "🥑",
  redio: "📻", rangi: "🎨", reli: "🚆",
  samaki: "🐟", saa: "⌚", simba: "🦁",
  tofaa: "🍎", tembo: "🐘", treni: "🚆",
  ua: "🌸", ufunguo: "🔑", uma: "🍴",
  viatu: "👟", vitabu: "📚", vikombe: "☕",
  wimbo: "🎵", watoto: "🧒", wingu: "☁️",
  yai: "🥚", yoyo: "🪀", yungi: "🌷",
  zawadi: "🎁", ziwa: "🌊",
  // Swahili distractor labels
  kikapu: "🧺", mshumaa: "🕯️", dawati: "🪑", glavu: "🧤",
  nyundo: "🔨", birika: "🫗", kisu: "🔪", kufuli: "🔒",
  ramani: "🗺️", kamba: "🪢", soksi: "🧦", meza: "🪑", ukuta: "🧱",
  ndege: "✈️", peremende: "🍬",
}

/** Best-effort emoji for a label. Falls back to the first word, then sparkles. */
export function emojiFor(label: string): string {
  if (!label) return "✨"
  const norm = label.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
  if (EMOJI[norm]) return EMOJI[norm]
  const first = norm.split(" ")[0]
  return EMOJI[first] ?? "✨"
}
