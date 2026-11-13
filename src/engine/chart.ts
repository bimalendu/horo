import { lahiriAyanamsa } from './ayanamsa';
import { GRAHAS, GrahaId, degInSign, nakshatraOf, signOf } from './constants';
import { NodeType, ascendantLongitude, grahaLongitude, grahaSpeed } from './positions';
import { julianDay, localToUtc, offsetMinutes, parseDate, parseTime } from './time';
import { vargaSign } from './vargas';

export interface Place {
  name: string;
  lat: number;
  lon: number;
  /** IANA zone ("Asia/Kolkata") or fixed offset ("UTC+05:30"). */
  tz: string;
}

export interface BirthData {
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM or HH:MM:SS, local wall-clock
  place: Place;
}

export interface Point {
  lon: number;
  sign: number;
  deg: number;
  nakshatra: number;
  pada: number;
}

export interface GrahaPosition extends Point {
  id: GrahaId;
  /** House counted from the lagna sign, 1-12 (whole-sign). */
  house: number;
  speed: number;
  retrograde: boolean;
  /** Close enough to the Sun to count as combust. */
  combust: boolean;
}

export interface Chart {
  birth: BirthData;
  utc: Date;
  jd: number;
  offsetMinutes: number;
  ayanamsa: number;
  lagna: Point;
  grahas: GrahaPosition[];
}

export interface ChartOptions {
  node?: NodeType;
}

function point(lon: number): Point {
  const n = nakshatraOf(lon);
  return { lon, sign: signOf(lon), deg: degInSign(lon), nakshatra: n.index, pada: n.pada };
}

/** Traditional combustion orbs from the Sun, degrees. */
const COMBUST_ORB: Partial<Record<GrahaId, number>> = { Mo: 12, Ma: 17, Me: 14, Ju: 11, Ve: 10, Sa: 15 };

export function birthInstant(birth: BirthData): Date {
  return localToUtc({ ...parseDate(birth.date), ...parseTime(birth.time) }, birth.place.tz);
}

export function castChart(birth: BirthData, opts: ChartOptions = {}): Chart {
  const node = opts.node ?? 'mean';
  const utc = birthInstant(birth);
  const lagna = point(ascendantLongitude(utc, birth.place.lat, birth.place.lon));
  const sunLon = grahaLongitude('Su', utc, node);

  const grahas = GRAHAS.map((id): GrahaPosition => {
    const lon = id === 'Su' ? sunLon : grahaLongitude(id, utc, node);
    const speed = grahaSpeed(id, utc, node);
    const p = point(lon);
    const orb = COMBUST_ORB[id];
    let sep = Math.abs(lon - sunLon);
    if (sep > 180) sep = 360 - sep;
    return {
      id,
      ...p,
      house: ((p.sign - lagna.sign + 12) % 12) + 1,
      speed,
      retrograde: id === 'Ra' || id === 'Ke' ? true : speed < 0,
      combust: orb !== undefined && sep < orb,
    };
  });

  return {
    birth,
    utc,
    jd: julianDay(utc),
    offsetMinutes: offsetMinutes(utc, birth.place.tz),
    ayanamsa: lahiriAyanamsa(utc),
    lagna,
    grahas,
  };
}

export const graha = (chart: Chart, id: GrahaId): GrahaPosition => chart.grahas.find((g) => g.id === id)!;

export interface VargaChart {
  d: number;
  lagnaSign: number;
  /** Sign each graha occupies in this division. */
  signs: Record<GrahaId, number>;
}

export function vargaChart(chart: Chart, d: number): VargaChart {
  const signs = {} as Record<GrahaId, number>;
  for (const g of chart.grahas) signs[g.id] = vargaSign(g.lon, d);
  return { d, lagnaSign: vargaSign(chart.lagna.lon, d), signs };
}

/** Vargottama: same sign in rasi and navamsa. */
export const isVargottama = (lon: number): boolean => vargaSign(lon, 9) === signOf(lon);

const EXALT: Record<GrahaId, number> = { Su: 0, Mo: 1, Ma: 9, Me: 5, Ju: 3, Ve: 11, Sa: 6, Ra: 1, Ke: 7 };
const OWN: Record<GrahaId, number[]> = {
  Su: [4], Mo: [3], Ma: [0, 7], Me: [2, 5], Ju: [8, 11], Ve: [1, 6], Sa: [9, 10], Ra: [], Ke: [],
};

export type Dignity = 'Exalted' | 'Debilitated' | 'Own sign' | '';

export function dignity(id: GrahaId, sign: number): Dignity {
  if (id !== 'Ra' && id !== 'Ke') {
    if (sign === EXALT[id]) return 'Exalted';
    if (sign === (EXALT[id] + 6) % 12) return 'Debilitated';
  }
  if (OWN[id].includes(sign)) return 'Own sign';
  return '';
}
