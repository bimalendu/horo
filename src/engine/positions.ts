import { Body, GeoVector, SiderealTime } from 'astronomy-engine';
import { LAHIRI_J2000, lahiriAyanamsa, meanObliquity, nutation } from './ayanamsa';
import { GrahaId, norm360 } from './constants';
import { centuriesJ2000 } from './time';

const rad = Math.PI / 180;
const EPS_J2000 = 23.4392911 * rad;

const BODIES: Partial<Record<GrahaId, Body>> = {
  Su: Body.Sun,
  Mo: Body.Moon,
  Ma: Body.Mars,
  Me: Body.Mercury,
  Ju: Body.Jupiter,
  Ve: Body.Venus,
  Sa: Body.Saturn,
};

export type NodeType = 'mean' | 'true';

/**
 * Sidereal (Lahiri) geocentric longitude of a physical body.
 * The J2000 ecliptic longitude minus the J2000 ayanamsa equals the
 * mean-of-date longitude minus the ayanamsa of date, because both
 * advance by the same precession.
 */
function bodyLongitude(body: Body, date: Date): number {
  const v = GeoVector(body, date, true);
  const y = v.y * Math.cos(EPS_J2000) + v.z * Math.sin(EPS_J2000);
  return norm360(Math.atan2(y, v.x) / rad - LAHIRI_J2000);
}

/** Sidereal longitude of the Moon's ascending node (Rahu). */
export function rahuLongitude(date: Date, type: NodeType = 'mean'): number {
  const T = centuriesJ2000(date);
  let node =
    125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441 - (T * T * T * T) / 60616000;
  if (type === 'true') {
    const D = (297.8501921 + 445267.1114034 * T) * rad;
    const M = (357.5291092 + 35999.0502909 * T) * rad;
    const Mp = (134.9633964 + 477198.8675055 * T) * rad;
    const F = (93.272095 + 483202.0175233 * T) * rad;
    node +=
      -1.4979 * Math.sin(2 * (D - F)) -
      0.15 * Math.sin(M) -
      0.1226 * Math.sin(2 * D) +
      0.1176 * Math.sin(2 * F) -
      0.0801 * Math.sin(2 * (Mp - F));
  }
  return norm360(node - lahiriAyanamsa(date));
}

export function grahaLongitude(id: GrahaId, date: Date, node: NodeType = 'mean'): number {
  if (id === 'Ra') return rahuLongitude(date, node);
  if (id === 'Ke') return norm360(rahuLongitude(date, node) + 180);
  return bodyLongitude(BODIES[id]!, date);
}

/** Daily motion in degrees per day (negative when retrograde). */
export function grahaSpeed(id: GrahaId, date: Date, node: NodeType = 'mean'): number {
  const h = 3600000; // one hour either side
  const a = grahaLongitude(id, new Date(date.getTime() - h), node);
  const b = grahaLongitude(id, new Date(date.getTime() + h), node);
  let d = b - a;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d * 12;
}

/** Sidereal longitude of the ascendant (lagna). Latitude north and longitude east are positive. */
export function ascendantLongitude(date: Date, latitude: number, longitude: number): number {
  const T = centuriesJ2000(date);
  const { dpsi, deps } = nutation(T);
  const eps = (meanObliquity(T) + deps) * rad;
  const ramc = norm360(SiderealTime(date) * 15 + longitude) * rad;
  const lat = Math.max(-89.99, Math.min(89.99, latitude)) * rad;
  const asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps))) / rad;
  // asc is measured from the true equinox of date; remove nutation, then the mean ayanamsa.
  return norm360(asc - dpsi - lahiriAyanamsa(date));
}
