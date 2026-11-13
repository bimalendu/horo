import { Body, Observer, SearchRiseSet } from 'astronomy-engine';
import {
  GrahaId, KARANA_MOVABLE, NAKSHATRAS, NAK_SPAN, SIGNS, TITHI_NAMES, VARA_NAMES, YOGA_NAMES,
  norm360, signOf,
} from './constants';
import { Place } from './chart';
import { grahaLongitude } from './positions';
import { localToUtc, parseDate, wallClock } from './time';

export interface Limb {
  index: number;
  name: string;
  /** When this element ends, if within the search window. */
  ends: Date | null;
}

export interface Panchang {
  date: string;
  place: Place;
  /** Moment the values are computed for: sunrise, or local noon where the Sun does not rise. */
  at: Date;
  sunrise: Date | null;
  sunset: Date | null;
  moonrise: Date | null;
  moonset: Date | null;
  vara: { index: number; en: string; sa: string; lord: GrahaId };
  tithi: Limb & { paksha: 'Shukla' | 'Krishna'; number: number };
  nakshatra: Limb & { pada: number };
  yoga: Limb;
  karana: Limb;
  sunSign: number;
  moonSign: number;
  rahuKalam: [Date, Date] | null;
}

const sun = (d: Date) => grahaLongitude('Su', d);
const moon = (d: Date) => grahaLongitude('Mo', d);

const elongation = (d: Date) => norm360(moon(d) - sun(d));
const yogaAngle = (d: Date) => norm360(moon(d) + sun(d));

export function tithiAt(date: Date): { index: number; number: number; paksha: 'Shukla' | 'Krishna'; name: string } {
  const index = Math.floor(elongation(date) / 12) % 30; // 0-29
  const paksha = index < 15 ? 'Shukla' : 'Krishna';
  const number = (index % 15) + 1;
  const name = number === 15 ? (paksha === 'Shukla' ? 'Purnima' : 'Amavasya') : TITHI_NAMES[number - 1];
  return { index, number, paksha, name };
}

export function karanaName(index: number): string {
  if (index === 0) return 'Kimstughna';
  if (index >= 57) return ['Shakuni', 'Chatushpada', 'Naga'][index - 57];
  return KARANA_MOVABLE[(index - 1) % 7];
}

/**
 * When an increasing angle next crosses a multiple of `span`.
 * `maxDays` bounds the search; the angle must advance by less than 180° per step.
 */
function nextBoundary(angle: (d: Date) => number, span: number, from: Date, maxDays: number): Date | null {
  const a0 = angle(from);
  const remaining = (Math.floor(a0 / span) + 1) * span - a0;
  const progress = (d: Date) => norm360(angle(d) - a0 + 180) - 180; // unwrapped near a0
  const step = 3600000;
  let lo = from.getTime();
  let hi = lo;
  const limit = lo + maxDays * 86400000;
  while (hi < limit) {
    hi += step;
    if (progress(new Date(hi)) >= remaining) {
      lo = hi - step;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (progress(new Date(mid)) >= remaining) hi = mid;
        else lo = mid;
      }
      return new Date(Math.round(hi / 1000) * 1000);
    }
  }
  return null;
}

export function panchang(date: string, place: Place): Panchang {
  const { year, month, day } = parseDate(date);
  const midnight = localToUtc({ year, month, day, hour: 0, minute: 0 }, place.tz);
  const noon = localToUtc({ year, month, day, hour: 12, minute: 0 }, place.tz);
  const observer = new Observer(place.lat, place.lon, 0);

  const within = (t: { date: Date } | null): Date | null =>
    t && t.date.getTime() - midnight.getTime() < 86400000 ? t.date : null;
  const sunrise = within(SearchRiseSet(Body.Sun, observer, +1, midnight, 1));
  const sunset = within(SearchRiseSet(Body.Sun, observer, -1, sunrise ?? midnight, 1));
  const moonrise = within(SearchRiseSet(Body.Moon, observer, +1, midnight, 1));
  const moonset = within(SearchRiseSet(Body.Moon, observer, -1, midnight, 1));

  const at = sunrise ?? noon;
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  const t = tithiAt(at);
  const moonLon = moon(at);
  const nakIndex = Math.floor(moonLon / NAK_SPAN) % 27;
  const yogaIndex = Math.floor(yogaAngle(at) / NAK_SPAN) % 27;
  const karanaIndex = Math.floor(elongation(at) / 6) % 60;

  // Rahu kalam: one eighth of the day, its position fixed by weekday (Sun..Sat).
  let rahuKalam: [Date, Date] | null = null;
  if (sunrise && sunset) {
    const part = (sunset.getTime() - sunrise.getTime()) / 8;
    const slot = [8, 2, 7, 5, 6, 4, 3][weekday] - 1;
    rahuKalam = [new Date(sunrise.getTime() + slot * part), new Date(sunrise.getTime() + (slot + 1) * part)];
  }

  return {
    date,
    place,
    at,
    sunrise,
    sunset,
    moonrise,
    moonset,
    vara: { index: weekday, ...VARA_NAMES[weekday] },
    tithi: { ...t, ends: nextBoundary(elongation, 12, at, 3) },
    nakshatra: {
      index: nakIndex,
      name: NAKSHATRAS[nakIndex],
      pada: Math.min(4, Math.floor((moonLon - nakIndex * NAK_SPAN) / (NAK_SPAN / 4)) + 1),
      ends: nextBoundary(moon, NAK_SPAN, at, 3),
    },
    yoga: { index: yogaIndex, name: YOGA_NAMES[yogaIndex], ends: nextBoundary(yogaAngle, NAK_SPAN, at, 3) },
    karana: { index: karanaIndex, name: karanaName(karanaIndex), ends: nextBoundary(elongation, 6, at, 2) },
    sunSign: signOf(sun(at)),
    moonSign: signOf(moonLon),
    rahuKalam,
  };
}

export const signName = (i: number): string => `${SIGNS[i].sa} (${SIGNS[i].en})`;

/** Today's date (YYYY-MM-DD) in a zone. */
export function todayIn(zone: string, now = new Date()): string {
  const w = wallClock(now, zone);
  return `${String(w.year).padStart(4, '0')}-${String(w.month).padStart(2, '0')}-${String(w.day).padStart(2, '0')}`;
}

/** The five limbs at an exact instant (used for the panchang at birth). */
export function limbsAt(date: Date): { tithi: ReturnType<typeof tithiAt>; nakshatra: string; yoga: string; karana: string } {
  return {
    tithi: tithiAt(date),
    nakshatra: NAKSHATRAS[Math.floor(moon(date) / NAK_SPAN) % 27],
    yoga: YOGA_NAMES[Math.floor(yogaAngle(date) / NAK_SPAN) % 27],
    karana: karanaName(Math.floor(elongation(date) / 6) % 60),
  };
}
