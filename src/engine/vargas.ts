import { degInSign, signOf } from './constants';

export interface VargaDef {
  d: number;
  name: string;
  topic: string;
}

export const VARGAS: VargaDef[] = [
  { d: 1, name: 'Rasi', topic: 'Body, overall life' },
  { d: 2, name: 'Hora', topic: 'Wealth' },
  { d: 3, name: 'Drekkana', topic: 'Siblings, courage' },
  { d: 4, name: 'Chaturthamsa', topic: 'Home, fortune' },
  { d: 7, name: 'Saptamsa', topic: 'Children' },
  { d: 9, name: 'Navamsa', topic: 'Marriage, dharma' },
  { d: 10, name: 'Dasamsa', topic: 'Career' },
  { d: 12, name: 'Dwadasamsa', topic: 'Parents' },
  { d: 16, name: 'Shodasamsa', topic: 'Vehicles, comforts' },
  { d: 20, name: 'Vimsamsa', topic: 'Spiritual practice' },
  { d: 24, name: 'Chaturvimsamsa', topic: 'Learning' },
  { d: 27, name: 'Bhamsa', topic: 'Strengths, weaknesses' },
  { d: 30, name: 'Trimsamsa', topic: 'Misfortunes' },
  { d: 40, name: 'Khavedamsa', topic: 'Maternal legacy' },
  { d: 45, name: 'Akshavedamsa', topic: 'Paternal legacy' },
  { d: 60, name: 'Shashtiamsa', topic: 'Past karma' },
];

const EPS = 1e-9;

/** Sign (0-11) a sidereal longitude occupies in divisional chart D-n, by Parashara's rules. */
export function vargaSign(lon: number, d: number): number {
  const s = signOf(lon);
  const deg = degInSign(lon);
  const odd = s % 2 === 0; // Aries, Gemini, ... are the odd signs
  const quality = s % 3; // 0 movable, 1 fixed, 2 dual
  const part = (n: number) => Math.min(n - 1, Math.floor((deg * n) / 30 + EPS));
  const wrap = (x: number) => ((x % 12) + 12) % 12;

  switch (d) {
    case 1:
      return s;
    case 2:
      return (part(2) === 0) === odd ? 4 : 3;
    case 3:
      return wrap(s + 4 * part(3));
    case 4:
      return wrap(s + 3 * part(4));
    case 7:
      return wrap(s + (odd ? 0 : 6) + part(7));
    case 9:
      return wrap(s * 9 + part(9));
    case 10:
      return wrap(s + (odd ? 0 : 8) + part(10));
    case 12:
      return wrap(s + part(12));
    case 16:
      return wrap([0, 4, 8][quality] + part(16));
    case 20:
      return wrap([0, 8, 4][quality] + part(20));
    case 24:
      return wrap((odd ? 4 : 3) + part(24));
    case 27:
      return wrap([0, 3, 6, 9][s % 4] + part(27));
    case 30: {
      if (odd) {
        if (deg < 5) return 0;
        if (deg < 10) return 10;
        if (deg < 18) return 8;
        if (deg < 25) return 2;
        return 6;
      }
      if (deg < 5) return 1;
      if (deg < 12) return 5;
      if (deg < 20) return 11;
      if (deg < 25) return 9;
      return 7;
    }
    case 40:
      return wrap((odd ? 0 : 6) + part(40));
    case 45:
      return wrap([0, 4, 8][quality] + part(45));
    case 60:
      return wrap(s + part(60));
    default:
      throw new Error(`Unsupported varga D${d}`);
  }
}
