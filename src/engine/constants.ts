export type GrahaId = 'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke';

export const GRAHAS: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'];

export const GRAHA_NAMES: Record<GrahaId, { en: string; sa: string }> = {
  Su: { en: 'Sun', sa: 'Surya' },
  Mo: { en: 'Moon', sa: 'Chandra' },
  Ma: { en: 'Mars', sa: 'Mangala' },
  Me: { en: 'Mercury', sa: 'Budha' },
  Ju: { en: 'Jupiter', sa: 'Guru' },
  Ve: { en: 'Venus', sa: 'Shukra' },
  Sa: { en: 'Saturn', sa: 'Shani' },
  Ra: { en: 'Rahu', sa: 'Rahu' },
  Ke: { en: 'Ketu', sa: 'Ketu' },
};

export const SIGNS = [
  { en: 'Aries', sa: 'Mesha', lord: 'Ma' },
  { en: 'Taurus', sa: 'Vrishabha', lord: 'Ve' },
  { en: 'Gemini', sa: 'Mithuna', lord: 'Me' },
  { en: 'Cancer', sa: 'Karka', lord: 'Mo' },
  { en: 'Leo', sa: 'Simha', lord: 'Su' },
  { en: 'Virgo', sa: 'Kanya', lord: 'Me' },
  { en: 'Libra', sa: 'Tula', lord: 'Ve' },
  { en: 'Scorpio', sa: 'Vrishchika', lord: 'Ma' },
  { en: 'Sagittarius', sa: 'Dhanu', lord: 'Ju' },
  { en: 'Capricorn', sa: 'Makara', lord: 'Sa' },
  { en: 'Aquarius', sa: 'Kumbha', lord: 'Sa' },
  { en: 'Pisces', sa: 'Meena', lord: 'Ju' },
] as const satisfies readonly { en: string; sa: string; lord: GrahaId }[];

export const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu',
  'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta',
  'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
  'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati',
];

/** Vimshottari order, starting from the lord of Ashwini. */
export const DASHA_ORDER: GrahaId[] = ['Ke', 'Ve', 'Su', 'Mo', 'Ma', 'Ra', 'Ju', 'Sa', 'Me'];

export const DASHA_YEARS: Record<GrahaId, number> = {
  Ke: 7, Ve: 20, Su: 6, Mo: 10, Ma: 7, Ra: 18, Ju: 16, Sa: 19, Me: 17,
};

export const NAK_SPAN = 360 / 27;

export const nakshatraLord = (nak: number): GrahaId => DASHA_ORDER[nak % 9];

export const TITHI_NAMES = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami',
  'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi',
];

export const YOGA_NAMES = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma',
  'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
  'Siddhi', 'Vyatipata', 'Variyana', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha',
  'Shukla', 'Brahma', 'Indra', 'Vaidhriti',
];

export const KARANA_MOVABLE = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti'];

export const VARA_NAMES = [
  { en: 'Sunday', sa: 'Ravivara', lord: 'Su' },
  { en: 'Monday', sa: 'Somavara', lord: 'Mo' },
  { en: 'Tuesday', sa: 'Mangalavara', lord: 'Ma' },
  { en: 'Wednesday', sa: 'Budhavara', lord: 'Me' },
  { en: 'Thursday', sa: 'Guruvara', lord: 'Ju' },
  { en: 'Friday', sa: 'Shukravara', lord: 'Ve' },
  { en: 'Saturday', sa: 'Shanivara', lord: 'Sa' },
] as const;

export const norm360 = (x: number): number => ((x % 360) + 360) % 360;

export const signOf = (lon: number): number => Math.floor(norm360(lon) / 30) % 12;

export const degInSign = (lon: number): number => norm360(lon) % 30;

export const nakshatraOf = (lon: number): { index: number; pada: number; fraction: number } => {
  const l = norm360(lon);
  const index = Math.floor(l / NAK_SPAN) % 27;
  const within = l - index * NAK_SPAN;
  return { index, pada: Math.min(4, Math.floor(within / (NAK_SPAN / 4)) + 1), fraction: within / NAK_SPAN };
};

/** 12.5083 -> 12°30′ */
export const formatDeg = (deg: number): string => {
  let d = Math.floor(deg);
  let m = Math.round((deg - d) * 60);
  if (m === 60) {
    d += 1;
    m = 0;
  }
  return `${d}°${String(m).padStart(2, '0')}′`;
};
