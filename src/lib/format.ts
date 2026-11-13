import { parseFixedOffset } from '../engine/time';

/** Format an instant in an IANA zone or a fixed "UTC+hh:mm" zone. */
export function formatInZone(date: Date, zone: string, options: Intl.DateTimeFormatOptions): string {
  const fixed = parseFixedOffset(zone);
  if (fixed !== null) {
    return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(
      new Date(date.getTime() + fixed * 60000),
    );
  }
  return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: zone }).format(date);
}

export const timeIn = (date: Date | null, zone: string): string =>
  date ? formatInZone(date, zone, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) : '—';

export const dateTimeIn = (date: Date | null, zone: string): string =>
  date
    ? formatInZone(date, zone, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    : '—';

const dayFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Calendar date of an instant (UTC), e.g. "4 Mar 2031". Dasha boundaries are shown to the day. */
export const dayOf = (date: Date): string => dayFmt.format(date);

/** "1947-08-15" -> "15 August 1947" */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(2000, m - 1, d));
  dt.setUTCFullYear(y);
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(dt);
}

export function years(n: number): string {
  if (n < 0.25) return `${Math.round(n * 365.25)}d`;
  const y = Math.floor(n);
  const months = Math.floor((n - y) * 12);
  const parts = [];
  if (y) parts.push(`${y}y`);
  if (months || !y) parts.push(`${months}m`);
  return parts.join(' ');
}

export const formatCoord = (lat: number, lon: number): string =>
  `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
