import { centuriesJ2000 } from './time';

/** Mean Lahiri (Chitrapaksha) ayanamsa at J2000.0, in degrees. */
export const LAHIRI_J2000 = 23.857092;

/** Accumulated general precession in longitude since J2000.0, degrees (IAU 2006). */
export function precessionSinceJ2000(T: number): number {
  return (5028.796195 * T + 1.1054348 * T * T) / 3600;
}

/** Mean Lahiri ayanamsa for a date, degrees. */
export function lahiriAyanamsa(date: Date): number {
  return LAHIRI_J2000 + precessionSinceJ2000(centuriesJ2000(date));
}

const rad = Math.PI / 180;

/** Nutation in longitude and obliquity (degrees), main terms; good to about 0.5″. */
export function nutation(T: number): { dpsi: number; deps: number } {
  const omega = (125.04452 - 1934.136261 * T) * rad;
  const Ls = (280.4665 + 36000.7698 * T) * rad;
  const Lm = (218.3165 + 481267.8813 * T) * rad;
  const dpsi =
    (-17.2 * Math.sin(omega) - 1.32 * Math.sin(2 * Ls) - 0.23 * Math.sin(2 * Lm) + 0.21 * Math.sin(2 * omega)) / 3600;
  const deps =
    (9.2 * Math.cos(omega) + 0.57 * Math.cos(2 * Ls) + 0.1 * Math.cos(2 * Lm) - 0.09 * Math.cos(2 * omega)) / 3600;
  return { dpsi, deps };
}

/** Mean obliquity of the ecliptic, degrees. */
export function meanObliquity(T: number): number {
  return 23.4392911 - (46.815 * T + 0.00059 * T * T - 0.001813 * T * T * T) / 3600;
}
