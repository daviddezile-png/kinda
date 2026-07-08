// Language support for Kinda. Pure module (safe on server + client).

export type Lang = "en" | "sw"

export interface Phrases {
  appTagline: string
  tapToStart: string
  home: string
  hearAgain: string
  startOver: string
  next: string
  moreLetters: string
  gettingReady: string
  letterNotFound: string
  english: string
  swahili: string

  // Step 1
  touchLetter: (L: string) => string
  greatJobLetter: (L: string) => string
  findCapital: string
  findSmall: string
  letsPlay: string
  yourGifts: string
  gameOfSix: (n: number) => string

  // Step 2
  findPicture: (L: string) => string
  yesThats: (w: string) => string
  amazingAll: string
  amazingDidIt: string

  // Step 3
  traceUpper: (L: string) => string
  traceLower: (l: string) => string
  greatWriting: string
  writeWell: (L: string) => string

  // Step 4 games
  findPairs: string
  buildTheWord: string
  matchLetter: string
  tapAll: (L: string) => string
  feedMe: (L: string) => string
  catchBucket: (L: string) => string
  singAlong: string
  seeAndWrite: (w: string) => string
  nowWriteIt: (L: string) => string
  putPieces: (L: string) => string
  pieceOrder: string
  gameXofY: (a: number, b: number) => string
  doneBtn: string

  // Completion
  finishedLetter: (L: string) => string
  starsOf: (a: number, b: number) => string
}

const en: Phrases = {
  appTagline: "Tap a letter to start playing!",
  tapToStart: "Tap a letter to start playing!",
  home: "Home",
  hearAgain: "Hear it again",
  startOver: "Start Over",
  next: "Next",
  moreLetters: "More Letters",
  gettingReady: "Getting ready…",
  letterNotFound: "Letter not found",
  english: "English",
  swahili: "Kiswahili",

  touchLetter: (L) => `Touch the letter ${L}!`,
  greatJobLetter: (L) => `Great job! You learned the letter ${L}!`,
  findCapital: "Find the capital letter!",
  findSmall: "Find the small letter!",
  letsPlay: "Let's play!",
  yourGifts: "Look at all your gifts!",
  gameOfSix: (n) => `Game ${n} of 6`,

  findPicture: (L) => `Find the picture that starts with ${L}!`,
  yesThats: (w) => `Yes! That's ${w}!`,
  amazingAll: "Amazing! You got them all!",
  amazingDidIt: "Amazing! You did it!",

  traceUpper: (L) => `Trace the letter ${L} with your finger!`,
  traceLower: (l) => `Now write the small letter ${l}!`,
  greatWriting: "Great writing!",
  writeWell: (L) => `Wonderful! You can write the letter ${L}!`,

  findPairs: "Find the matching pairs!",
  buildTheWord: "Build the word!",
  matchLetter: "Match the letter to its picture!",
  tapAll: (L) => `Tap all the ${L}'s!`,
  feedMe: (L) => `Feed me things that start with ${L}!`,
  catchBucket: (L) => `Catch things that start with ${L} in the bucket!`,
  singAlong: "Sing along — fill in the word!",
  seeAndWrite: (w) => `This is ${w}!`,
  nowWriteIt: (L) => `Now write its letter — ${L}!`,
  putPieces: (L) => `Put the pieces together to make the letter ${L}!`,
  pieceOrder: "Tap the pieces in order: 1, 2, 3…",
  gameXofY: (a, b) => `Game ${a} of ${b}`,
  doneBtn: "Done!",

  finishedLetter: (L) => `You finished letter ${L}!`,
  starsOf: (a, b) => `${a} / ${b} stars`,
}

const sw: Phrases = {
  appTagline: "Gusa herufi ili uanze kucheza!",
  tapToStart: "Gusa herufi ili uanze kucheza!",
  home: "Nyumbani",
  hearAgain: "Sikia tena",
  startOver: "Anza upya",
  next: "Endelea",
  moreLetters: "Herufi zaidi",
  gettingReady: "Tunajiandaa…",
  letterNotFound: "Herufi haijapatikana",
  english: "Kiingereza",
  swahili: "Kiswahili",

  touchLetter: (L) => `Gusa herufi ${L}!`,
  greatJobLetter: (L) => `Hongera! Umejifunza herufi ${L}!`,
  findCapital: "Tafuta herufi kubwa!",
  findSmall: "Tafuta herufi ndogo!",
  letsPlay: "Tucheze!",
  yourGifts: "Angalia zawadi zako zote!",
  gameOfSix: (n) => `Mchezo ${n} kati ya 6`,

  findPicture: (L) => `Gusa picha inayoanza na ${L}!`,
  yesThats: (w) => `Ndiyo! Hiyo ni ${w}!`,
  amazingAll: "Hongera! Umezipata zote!",
  amazingDidIt: "Hongera! Umefaulu!",

  traceUpper: (L) => `Fuatisha herufi ${L} kwa kidole chako!`,
  traceLower: (l) => `Sasa andika herufi ndogo ${l}!`,
  greatWriting: "Umeandika vizuri!",
  writeWell: (L) => `Vizuri sana! Unaweza kuandika herufi ${L}!`,

  findPairs: "Tafuta jozi zinazofanana!",
  buildTheWord: "Tengeneza neno!",
  matchLetter: "Linganisha herufi na picha yake!",
  tapAll: (L) => `Gusa herufi ${L} zote!`,
  feedMe: (L) => `Nilishe vitu vinavyoanza na ${L}!`,
  catchBucket: (L) => `Daka vitu vinavyoanza na ${L} kwenye ndoo!`,
  singAlong: "Imba pamoja — jaza neno!",
  seeAndWrite: (w) => `Hii ni ${w}!`,
  nowWriteIt: (L) => `Sasa andika herufi yake — ${L}!`,
  putPieces: (L) => `Unganisha vipande kutengeneza herufi ${L}!`,
  pieceOrder: "Gusa vipande kwa mpangilio: 1, 2, 3…",
  gameXofY: (a, b) => `Mchezo ${a} kati ya ${b}`,
  doneBtn: "Nimemaliza!",

  finishedLetter: (L) => `Umemaliza herufi ${L}!`,
  starsOf: (a, b) => `nyota ${a} / ${b}`,
}

export function getPhrases(lang: Lang): Phrases {
  return lang === "sw" ? sw : en
}
