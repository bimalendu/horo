import { DASHA_ORDER, DASHA_YEARS, GrahaId, nakshatraOf } from './constants';

export const YEAR_MS = 365.25 * 86400000;

export interface DashaPeriod {
  /** Lords from the mahadasha down to this level, e.g. ['Sa', 'Me', 'Ve']. */
  lords: GrahaId[];
  start: Date;
  end: Date;
}

/** Sub-periods of any period: nine parts in Vimshottari order, starting from the period's own lord. */
export function subPeriods(period: DashaPeriod): DashaPeriod[] {
  const lord = period.lords[period.lords.length - 1];
  const startIdx = DASHA_ORDER.indexOf(lord);
  const total = period.end.getTime() - period.start.getTime();
  const out: DashaPeriod[] = [];
  let t = period.start.getTime();
  for (let i = 0; i < 9; i++) {
    const sub = DASHA_ORDER[(startIdx + i) % 9];
    const len = (total * DASHA_YEARS[sub]) / 120;
    out.push({ lords: [...period.lords, sub], start: new Date(t), end: new Date(t + len) });
    t += len;
  }
  return out;
}

export interface Vimshottari {
  /** Nine mahadashas; the first began before birth. */
  mahadashas: DashaPeriod[];
  /** Portion of the first mahadasha remaining at birth, in years. */
  balanceYears: number;
  birthLord: GrahaId;
}

export function vimshottari(moonLon: number, birth: Date): Vimshottari {
  const { index, fraction } = nakshatraOf(moonLon);
  const startIdx = index % 9;
  const birthLord = DASHA_ORDER[startIdx];
  const elapsed = fraction * DASHA_YEARS[birthLord];
  let t = birth.getTime() - elapsed * YEAR_MS;
  const mahadashas: DashaPeriod[] = [];
  for (let i = 0; i < 9; i++) {
    const lord = DASHA_ORDER[(startIdx + i) % 9];
    const end = t + DASHA_YEARS[lord] * YEAR_MS;
    mahadashas.push({ lords: [lord], start: new Date(t), end: new Date(end) });
    t = end;
  }
  return { mahadashas, balanceYears: DASHA_YEARS[birthLord] - elapsed, birthLord };
}

export const contains = (p: DashaPeriod, at: Date): boolean =>
  at.getTime() >= p.start.getTime() && at.getTime() < p.end.getTime();

/** The running maha / antar / pratyantar at a moment, or [] if outside the 120-year cycle. */
export function runningPeriods(v: Vimshottari, at: Date, depth = 3): DashaPeriod[] {
  const out: DashaPeriod[] = [];
  let level = v.mahadashas;
  for (let i = 0; i < depth; i++) {
    const hit = level.find((p) => contains(p, at));
    if (!hit) break;
    out.push(hit);
    level = subPeriods(hit);
  }
  return out;
}
