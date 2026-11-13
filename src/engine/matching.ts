import { Chart, graha } from './chart';
import { GrahaId, SIGNS } from './constants';

/** What Ashtakoota needs from each person: the Moon's position. */
export interface MoonData {
  sign: number;
  deg: number;
  nakshatra: number;
}

export const moonData = (chart: Chart): MoonData => {
  const m = graha(chart, 'Mo');
  return { sign: m.sign, deg: m.deg, nakshatra: m.nakshatra };
};

export interface KootaScore {
  key: string;
  name: string;
  about: string;
  score: number;
  max: number;
  bride: string;
  groom: string;
}

export interface MatchResult {
  kootas: KootaScore[];
  total: number;
  max: 36;
  verdict: string;
}

// --- Varna -----------------------------------------------------------------
const VARNA_NAMES = ['Shudra', 'Vaishya', 'Kshatriya', 'Brahmin'];
/** Rank 0-3 by element: air, earth, fire, water. */
const varna = (sign: number): number => [2, 1, 0, 3][sign % 4];

// --- Vashya ----------------------------------------------------------------
const VASHYA_NAMES = ['Chatushpada', 'Manava', 'Jalachara', 'Vanachara', 'Keeta'];
function vashya(m: MoonData): number {
  switch (m.sign) {
    case 0: case 1: return 0;
    case 2: case 5: case 6: case 10: return 1;
    case 3: case 11: return 2;
    case 4: return 3;
    case 7: return 4;
    case 8: return m.deg < 15 ? 1 : 0;
    default: return m.deg < 15 ? 0 : 2; // Capricorn
  }
}
const VASHYA_SCORE = [
  [2, 1, 1, 0.5, 1],
  [1, 2, 0.5, 0, 1],
  [1, 0.5, 2, 1, 1],
  [0, 0, 0, 2, 0],
  [1, 1, 1, 0, 2],
];

// --- Yoni ------------------------------------------------------------------
export const YONI_NAMES = [
  'Horse', 'Elephant', 'Sheep', 'Serpent', 'Dog', 'Cat', 'Rat', 'Cow', 'Buffalo', 'Tiger', 'Deer', 'Monkey',
  'Mongoose', 'Lion',
];
const YONI_OF_NAK = [0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1];
export const YONI_SCORE = [
  [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1],
  [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0],
  [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],
  [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2],
  [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1],
  [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],
  [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2],
  [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1],
  [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],
  [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1],
  [3, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1],
  [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],
  [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2],
  [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4],
];

// --- Graha Maitri ----------------------------------------------------------
type Rel = 1 | 0 | -1;
const FRIENDS: Record<string, GrahaId[]> = {
  Su: ['Mo', 'Ma', 'Ju'], Mo: ['Su', 'Me'], Ma: ['Su', 'Mo', 'Ju'], Me: ['Su', 'Ve'],
  Ju: ['Su', 'Mo', 'Ma'], Ve: ['Me', 'Sa'], Sa: ['Me', 'Ve'],
};
const ENEMIES: Record<string, GrahaId[]> = {
  Su: ['Ve', 'Sa'], Mo: [], Ma: ['Me'], Me: ['Mo'], Ju: ['Me', 'Ve'], Ve: ['Su', 'Mo'], Sa: ['Su', 'Mo', 'Ma'],
};
const relation = (a: GrahaId, b: GrahaId): Rel =>
  a === b || FRIENDS[a].includes(b) ? 1 : ENEMIES[a].includes(b) ? -1 : 0;

function maitri(a: GrahaId, b: GrahaId): number {
  if (a === b) return 5;
  const pair = [relation(a, b), relation(b, a)].sort((x, y) => y - x).join(',');
  return { '1,1': 5, '1,0': 4, '0,0': 3, '1,-1': 1, '0,-1': 0.5, '-1,-1': 0 }[pair] ?? 0;
}

// --- Gana ------------------------------------------------------------------
const GANA_NAMES = ['Deva', 'Manushya', 'Rakshasa'];
const GANA_OF_NAK = [0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0];
/** Rows: groom's gana; columns: bride's. */
const GANA_SCORE = [
  [6, 6, 0],
  [5, 6, 0],
  [1, 0, 6],
];

// --- Nadi ------------------------------------------------------------------
const NADI_NAMES = ['Adi', 'Madhya', 'Antya'];
const nadi = (nak: number): number => [0, 1, 2, 2, 1, 0][nak % 6];

// --- Tara ------------------------------------------------------------------
const taraGood = (from: number, to: number): boolean => ![3, 5, 7].includes((((to - from + 27) % 27) + 1) % 9);

export function ashtakoota(bride: MoonData, groom: MoonData): MatchResult {
  const bLord = SIGNS[bride.sign].lord;
  const gLord = SIGNS[groom.sign].lord;
  const dist = ((groom.sign - bride.sign + 12) % 12) + 1; // groom's sign counted from bride's
  const bhakootBad = [2, 12, 5, 9, 6, 8].includes(dist);
  const bv = vashya(bride);
  const gv = vashya(groom);
  const by = YONI_OF_NAK[bride.nakshatra];
  const gy = YONI_OF_NAK[groom.nakshatra];
  const bg = GANA_OF_NAK[bride.nakshatra];
  const gg = GANA_OF_NAK[groom.nakshatra];

  const kootas: KootaScore[] = [
    {
      key: 'varna', name: 'Varna', about: 'Outlook and work',
      score: varna(groom.sign) >= varna(bride.sign) ? 1 : 0, max: 1,
      bride: VARNA_NAMES[varna(bride.sign)], groom: VARNA_NAMES[varna(groom.sign)],
    },
    {
      key: 'vashya', name: 'Vashya', about: 'Mutual attraction',
      score: VASHYA_SCORE[gv][bv], max: 2, bride: VASHYA_NAMES[bv], groom: VASHYA_NAMES[gv],
    },
    {
      key: 'tara', name: 'Tara', about: 'Fortune and wellbeing',
      score:
        (taraGood(bride.nakshatra, groom.nakshatra) ? 1.5 : 0) + (taraGood(groom.nakshatra, bride.nakshatra) ? 1.5 : 0),
      max: 3,
      bride: `Groom's star is no. ${((groom.nakshatra - bride.nakshatra + 27) % 27) + 1}`,
      groom: `Bride's star is no. ${((bride.nakshatra - groom.nakshatra + 27) % 27) + 1}`,
    },
    {
      key: 'yoni', name: 'Yoni', about: 'Physical compatibility',
      score: YONI_SCORE[gy][by], max: 4, bride: YONI_NAMES[by], groom: YONI_NAMES[gy],
    },
    {
      key: 'maitri', name: 'Graha Maitri', about: 'Friendship of Moon-sign lords',
      score: maitri(bLord, gLord), max: 5, bride: bLord, groom: gLord,
    },
    {
      key: 'gana', name: 'Gana', about: 'Temperament',
      score: GANA_SCORE[gg][bg], max: 6, bride: GANA_NAMES[bg], groom: GANA_NAMES[gg],
    },
    {
      key: 'bhakoot', name: 'Bhakoot', about: 'Emotional rapport, prosperity',
      score: bhakootBad ? 0 : 7, max: 7,
      bride: SIGNS[bride.sign].sa, groom: `${SIGNS[groom.sign].sa} (${dist}/${((12 - dist + 1) % 12) + 1})`,
    },
    {
      key: 'nadi', name: 'Nadi', about: 'Health and progeny',
      score: nadi(bride.nakshatra) === nadi(groom.nakshatra) ? 0 : 8, max: 8,
      bride: NADI_NAMES[nadi(bride.nakshatra)], groom: NADI_NAMES[nadi(groom.nakshatra)],
    },
  ];

  const total = kootas.reduce((s, k) => s + k.score, 0);
  const verdict =
    total >= 28 ? 'Very good match' : total >= 24 ? 'Good match' : total >= 18 ? 'Acceptable match' : 'Below the traditional threshold of 18';
  return { kootas, total, max: 36, verdict };
}

export interface Manglik {
  fromLagna: boolean;
  fromMoon: boolean;
  marsHouse: number;
  marsHouseFromMoon: number;
}

const MANGLIK_HOUSES = [1, 2, 4, 7, 8, 12];

export function manglik(chart: Chart): Manglik {
  const mars = graha(chart, 'Ma');
  const moon = graha(chart, 'Mo');
  const fromMoon = ((mars.sign - moon.sign + 12) % 12) + 1;
  return {
    fromLagna: MANGLIK_HOUSES.includes(mars.house),
    fromMoon: MANGLIK_HOUSES.includes(fromMoon),
    marsHouse: mars.house,
    marsHouseFromMoon: fromMoon,
  };
}
