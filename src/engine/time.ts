/**
 * Local wall-clock time -> UTC, using the browser's IANA time zone database.
 * Offsets are read from formatted wall-clock parts, so historical rules
 * (LMT, wartime offsets, old DST) are honoured to the second.
 */

export interface LocalDateTime {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second?: number;
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();

function formatter(zone: string): Intl.DateTimeFormat {
  let f = fmtCache.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hourCycle: 'h23',
      era: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    fmtCache.set(zone, f);
  }
  return f;
}

/** Fixed-offset zones are written "UTC+05:30" / "UTC-08:00". */
export function parseFixedOffset(zone: string): number | null {
  const m = /^UTC([+-])(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?$/.exec(zone.trim());
  if (!m) return zone.trim() === 'UTC' ? 0 : null;
  const sign = m[1] === '-' ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3] ?? 0) + Number(m[4] ?? 0) / 60);
}

export function fixedOffsetZone(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = Math.round(abs - h * 60);
  return `UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function isValidZone(zone: string): boolean {
  if (parseFixedOffset(zone) !== null) return true;
  try {
    formatter(zone);
    return true;
  } catch {
    return false;
  }
}

/** Wall-clock fields of an instant in a zone. */
export function wallClock(date: Date, zone: string): Required<LocalDateTime> {
  const fixed = parseFixedOffset(zone);
  if (fixed !== null) {
    const d = new Date(date.getTime() + fixed * 60000);
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
      hour: d.getUTCHours(),
      minute: d.getUTCMinutes(),
      second: d.getUTCSeconds(),
    };
  }
  const parts: Record<string, string> = {};
  for (const p of formatter(zone).formatToParts(date)) parts[p.type] = p.value;
  const year = Number(parts.year);
  return {
    year: parts.era === 'BC' ? 1 - year : year,
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

const asUtcMs = (l: LocalDateTime): number => {
  const d = new Date(Date.UTC(2000, l.month - 1, l.day, l.hour, l.minute, l.second ?? 0));
  d.setUTCFullYear(l.year); // avoids Date.UTC's two-digit-year rule
  return d.getTime();
};

/** Offset from UTC in minutes (east positive) at a given instant. */
export function offsetMinutes(date: Date, zone: string): number {
  const fixed = parseFixedOffset(zone);
  if (fixed !== null) return fixed;
  const ms = Math.floor(date.getTime() / 1000) * 1000;
  return (asUtcMs(wallClock(new Date(ms), zone)) - ms) / 60000;
}

/** Convert local wall-clock time in a zone to the UTC instant. */
export function localToUtc(local: LocalDateTime, zone: string): Date {
  const wall = asUtcMs(local);
  // Two passes settle the offset across a transition.
  let utc = wall - offsetMinutes(new Date(wall), zone) * 60000;
  utc = wall - offsetMinutes(new Date(utc), zone) * 60000;
  return new Date(utc);
}

export function julianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/** Julian centuries from J2000.0 (UT is close enough for the slow terms that use this). */
export function centuriesJ2000(date: Date): number {
  return (julianDay(date) - 2451545.0) / 36525;
}

export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '−' : '+';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const mFloat = abs - h * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  const base = `UTC${sign}${h}:${String(m).padStart(2, '0')}`;
  return s ? `${base}:${String(s).padStart(2, '0')}` : base;
}

export function parseDate(s: string): { year: number; month: number; day: number } {
  const [y, m, d] = s.split('-').map(Number);
  return { year: y, month: m, day: d };
}

export function parseTime(s: string): { hour: number; minute: number; second: number } {
  const [h, m, sec] = s.split(':').map(Number);
  return { hour: h || 0, minute: m || 0, second: sec || 0 };
}
