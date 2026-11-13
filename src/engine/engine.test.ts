import { describe, expect, it } from 'vitest';
import { lahiriAyanamsa } from './ayanamsa';
import { castChart, graha, vargaChart } from './chart';
import { DASHA_YEARS, NAKSHATRAS, SIGNS, formatDeg, nakshatraOf } from './constants';
import { YEAR_MS, runningPeriods, subPeriods, vimshottari } from './dasha';
import { YONI_SCORE, ashtakoota, manglik } from './matching';
import { karanaName, panchang, tithiAt } from './panchang';
import { grahaLongitude } from './positions';
import { localToUtc, offsetMinutes } from './time';
import { VARGAS, vargaSign } from './vargas';

const arcmin = (n: number) => n / 60;
const dms = (sign: number, d: number, m: number) => sign * 30 + d + m / 60;
const close = (actual: number, expected: number, tol: number) => {
  let diff = Math.abs(actual - expected) % 360;
  if (diff > 180) diff = 360 - diff;
  expect(diff, `got ${actual.toFixed(4)}, want ${expected.toFixed(4)}`).toBeLessThanOrEqual(tol);
};

describe('time', () => {
  it('converts IST to UTC', () => {
    const utc = localToUtc({ year: 1947, month: 8, day: 15, hour: 0, minute: 0 }, 'Asia/Kolkata');
    expect(utc.toISOString()).toBe('1947-08-14T18:30:00.000Z');
  });
  it('honours Indian wartime offset (+6:30, 1942-45)', () => {
    const utc = localToUtc({ year: 1943, month: 6, day: 1, hour: 12, minute: 0 }, 'Asia/Kolkata');
    expect(utc.toISOString()).toBe('1943-06-01T05:30:00.000Z');
    expect(offsetMinutes(utc, 'Asia/Kolkata')).toBe(390);
  });
  it('handles DST zones and fixed offsets', () => {
    expect(localToUtc({ year: 2020, month: 7, day: 1, hour: 12, minute: 0 }, 'America/New_York').toISOString()).toBe(
      '2020-07-01T16:00:00.000Z',
    );
    expect(localToUtc({ year: 2020, month: 1, day: 1, hour: 12, minute: 0 }, 'UTC+05:30').toISOString()).toBe(
      '2020-01-01T06:30:00.000Z',
    );
    expect(localToUtc({ year: 2020, month: 1, day: 1, hour: 12, minute: 0 }, 'UTC-08:00').toISOString()).toBe(
      '2020-01-01T20:00:00.000Z',
    );
  });
});

describe('ayanamsa', () => {
  it('matches Lahiri at known epochs', () => {
    close(lahiriAyanamsa(new Date('2000-01-01T12:00:00Z')), 23.8571, 0.0005);
    // Definition epoch, 21 March 1956: 23°15′ (less a small correction)
    close(lahiriAyanamsa(new Date('1956-03-21T00:00:00Z')), 23.2455, 0.001);
    close(lahiriAyanamsa(new Date('1900-01-01T00:00:00Z')), 22.4605, 0.003);
  });
});

describe('positions', () => {
  it('Sun and Moon at J2000', () => {
    const d = new Date('2000-01-01T12:00:00Z');
    close(grahaLongitude('Su', d), 280.37 - 23.857, arcmin(2));
    close(grahaLongitude('Mo', d), 223.32 - 23.857, arcmin(3));
  });

  // Chart of Indian independence, widely published.
  const india = castChart({
    name: 'India',
    date: '1947-08-15',
    time: '00:00',
    place: { name: 'Delhi', lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata' },
  });
  it('independence chart: grahas', () => {
    const tol = arcmin(3);
    close(graha(india, 'Su').lon, dms(3, 27, 59), tol);
    close(graha(india, 'Mo').lon, dms(3, 3, 59), tol);
    close(graha(india, 'Ma').lon, dms(2, 7, 27), tol);
    close(graha(india, 'Me').lon, dms(3, 13, 40), tol);
    close(graha(india, 'Ju').lon, dms(6, 25, 52), tol);
    close(graha(india, 'Ve').lon, dms(3, 22, 33), tol);
    close(graha(india, 'Sa').lon, dms(3, 20, 27), tol);
    // Published charts give Rahu 5°44′ Taurus, which is the true node; the mean node is 5°04′.
    close(graha(india, 'Ra').lon, dms(1, 5, 4), tol);
    close(graha(india, 'Ke').lon, dms(7, 5, 4), tol);
    const trueNode = castChart(india.birth, { node: 'true' });
    close(graha(trueNode, 'Ra').lon, dms(1, 5, 44), tol);
    close(graha(trueNode, 'Ke').lon, dms(7, 5, 44), tol);
  });
  it('independence chart: lagna, nakshatra, houses', () => {
    close(india.lagna.lon, dms(1, 7, 46), 0.1);
    expect(SIGNS[india.lagna.sign].en).toBe('Taurus');
    expect(NAKSHATRAS[graha(india, 'Mo').nakshatra]).toBe('Pushya');
    expect(graha(india, 'Su').house).toBe(3);
    expect(graha(india, 'Ju').house).toBe(6);
    expect(graha(india, 'Ra').house).toBe(1);
    expect(graha(india, 'Sa').retrograde).toBe(false);
  });
  it('independence chart: dasha starts in Saturn with about 18 years left', () => {
    const v = vimshottari(graha(india, 'Mo').lon, india.utc);
    expect(v.birthLord).toBe('Sa');
    expect(v.balanceYears).toBeGreaterThan(17.5);
    expect(v.balanceYears).toBeLessThan(18.6);
  });
  it('detects retrograde motion', () => {
    // Mars retrograde Oct 30 2022 - Jan 12 2023; Mercury retrograde Dec 13 2023 - Jan 1 2024
    const c = castChart({
      name: 't', date: '2022-12-01', time: '12:00',
      place: { name: 'Greenwich', lat: 51.48, lon: 0, tz: 'UTC' },
    });
    expect(graha(c, 'Ma').retrograde).toBe(true);
    expect(graha(c, 'Ju').retrograde).toBe(false);
    const c2 = castChart({ ...c.birth, date: '2023-12-20' });
    expect(graha(c2, 'Me').retrograde).toBe(true);
    expect(graha(c2, 'Ma').retrograde).toBe(false);
  });
  it('true node stays within 2 degrees of the mean node', () => {
    const d = new Date('1990-05-05T00:00:00Z');
    close(grahaLongitude('Ra', d, 'true'), grahaLongitude('Ra', d, 'mean'), 2);
  });
});

describe('vargas', () => {
  it('navamsa', () => {
    expect(vargaSign(0.5, 9)).toBe(0); // Aries 0°30′ -> Aries
    expect(vargaSign(29.9, 9)).toBe(8); // Aries 29°54′ -> Sagittarius
    expect(vargaSign(30.1, 9)).toBe(9); // Taurus starts from Capricorn
    expect(vargaSign(60.1, 9)).toBe(6); // Gemini starts from Libra
    expect(vargaSign(90.1, 9)).toBe(3); // Cancer starts from Cancer
    expect(vargaSign(3 * 30 + 3 + 59 / 60, 9)).toBe(4); // Moon 3°59′ Cancer -> Leo
  });
  it('hora, drekkana, dasamsa, dwadasamsa, trimsamsa', () => {
    expect(vargaSign(10, 2)).toBe(4);
    expect(vargaSign(20, 2)).toBe(3);
    expect(vargaSign(40, 2)).toBe(3);
    expect(vargaSign(50, 2)).toBe(4);
    expect(vargaSign(15, 3)).toBe(4);
    expect(vargaSign(25, 3)).toBe(8);
    expect(vargaSign(4, 10)).toBe(1); // Aries 4° -> 2nd dasamsa -> Taurus
    expect(vargaSign(31, 10)).toBe(9); // Taurus 1° -> counted from Capricorn
    expect(vargaSign(29, 12)).toBe(11);
    expect(vargaSign(7, 30)).toBe(10);
    expect(vargaSign(37, 30)).toBe(5);
  });
  it('every varga maps every longitude to a valid sign and D1 is identity', () => {
    for (const v of VARGAS) {
      for (let lon = 0; lon < 360; lon += 0.37) {
        const s = vargaSign(lon, v.d);
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThan(12);
      }
    }
    expect(vargaSign(123.4, 1)).toBe(4);
  });
  it('each varga except hora and trimsamsa reaches all 12 signs', () => {
    for (const v of VARGAS.filter((x) => x.d !== 2 && x.d !== 30)) {
      const seen = new Set<number>();
      for (let lon = 0; lon < 360; lon += 0.05) seen.add(vargaSign(lon, v.d));
      expect(seen.size, `D${v.d}`).toBe(12);
    }
  });
  it('vargaChart places all nine grahas', () => {
    const c = castChart({
      name: 't', date: '1990-01-01', time: '06:00',
      place: { name: 'x', lat: 20, lon: 85, tz: 'Asia/Kolkata' },
    });
    expect(Object.keys(vargaChart(c, 9).signs)).toHaveLength(9);
  });
});

describe('dasha', () => {
  const birth = new Date('2000-01-01T00:00:00Z');
  it('starts a fresh Ketu dasha at 0° Aries and spans 120 years', () => {
    const v = vimshottari(0, birth);
    expect(v.birthLord).toBe('Ke');
    expect(v.balanceYears).toBeCloseTo(7, 6);
    expect(v.mahadashas.map((m) => m.lords[0]).join(' ')).toBe('Ke Ve Su Mo Ma Ra Ju Sa Me');
    const span = v.mahadashas[8].end.getTime() - v.mahadashas[0].start.getTime();
    expect(span / YEAR_MS).toBeCloseTo(120, 6);
  });
  it('gives half the balance at mid-nakshatra', () => {
    const v = vimshottari(360 / 27 + 360 / 54, birth); // middle of Bharani (Venus)
    expect(v.birthLord).toBe('Ve');
    expect(v.balanceYears).toBeCloseTo(10, 6);
  });
  it('sub-periods are proportional and contiguous', () => {
    const v = vimshottari(0, birth);
    const venus = v.mahadashas[1];
    const antar = subPeriods(venus);
    expect(antar[0].lords).toEqual(['Ve', 'Ve']);
    expect((antar[0].end.getTime() - antar[0].start.getTime()) / YEAR_MS).toBeCloseTo((20 * 20) / 120, 6);
    expect(antar[8].lords[1]).toBe('Ke');
    expect(Math.abs(antar[8].end.getTime() - venus.end.getTime())).toBeLessThan(1000);
    for (let i = 1; i < 9; i++) expect(antar[i].start.getTime()).toBe(antar[i - 1].end.getTime());
    expect(Object.values(DASHA_YEARS).reduce((a, b) => a + b)).toBe(120);
  });
  it('finds the running periods', () => {
    const v = vimshottari(0, birth);
    const run = runningPeriods(v, new Date('2010-06-01T00:00:00Z'));
    expect(run).toHaveLength(3);
    expect(run[0].lords).toEqual(['Ve']);
    expect(run[1].lords[0]).toBe('Ve');
  });
});

describe('panchang', () => {
  it('tithi near known lunations', () => {
    // New moon 2024-01-11 11:57 UTC; full moon 2024-01-25 17:54 UTC
    expect(tithiAt(new Date('2024-01-11T11:00:00Z')).name).toBe('Amavasya');
    expect(tithiAt(new Date('2024-01-11T13:00:00Z'))).toMatchObject({ paksha: 'Shukla', number: 1 });
    expect(tithiAt(new Date('2024-01-25T17:00:00Z')).name).toBe('Purnima');
    expect(tithiAt(new Date('2024-01-25T19:00:00Z'))).toMatchObject({ paksha: 'Krishna', number: 1 });
  });
  it('karana names', () => {
    expect(karanaName(0)).toBe('Kimstughna');
    expect(karanaName(1)).toBe('Bava');
    expect(karanaName(7)).toBe('Vishti');
    expect(karanaName(8)).toBe('Bava');
    expect(karanaName(56)).toBe('Vishti');
    expect(karanaName(57)).toBe('Shakuni');
    expect(karanaName(59)).toBe('Naga');
  });
  it('daily panchang for Delhi, Diwali 2023 (Amavasya begins that afternoon)', () => {
    const p = panchang('2023-11-12', { name: 'Delhi', lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata' });
    expect(p.vara.en).toBe('Sunday');
    expect(p.tithi).toMatchObject({ paksha: 'Krishna', number: 14 });
    // Chaturdashi ended about 14:44 IST
    expect(Math.abs(p.tithi.ends!.getTime() - Date.parse('2023-11-12T09:14:00Z'))).toBeLessThan(6 * 60000);
    // Sunrise about 06:41 IST, sunset about 17:29 IST
    expect(Math.abs(p.sunrise!.getTime() - Date.parse('2023-11-12T01:11:00Z'))).toBeLessThan(4 * 60000);
    expect(Math.abs(p.sunset!.getTime() - Date.parse('2023-11-12T11:59:00Z'))).toBeLessThan(4 * 60000);
    expect(p.nakshatra.name).toBe('Swati');
    expect(SIGNS[p.sunSign].en).toBe('Libra');
    expect(p.rahuKalam![0].getTime()).toBeGreaterThan(p.sunrise!.getTime());
  });
});

describe('matching', () => {
  const moon = (nak: number, pada = 1) => {
    const lon = nak * (360 / 27) + (pada - 0.5) * (360 / 108);
    return { sign: Math.floor(lon / 30), deg: lon % 30, nakshatra: nakshatraOf(lon).index };
  };
  it('yoni table is symmetric with 4 on the diagonal', () => {
    for (let i = 0; i < 14; i++) {
      expect(YONI_SCORE[i][i]).toBe(4);
      for (let j = 0; j < 14; j++) expect(YONI_SCORE[i][j]).toBe(YONI_SCORE[j][i]);
    }
  });
  it('same nakshatra and pada: nadi dosha, 28 of 36', () => {
    const r = ashtakoota(moon(0), moon(0)); // both Ashwini
    const by = Object.fromEntries(r.kootas.map((k) => [k.key, k.score]));
    expect(by).toEqual({ varna: 1, vashya: 2, tara: 3, yoni: 4, maitri: 5, gana: 6, bhakoot: 7, nadi: 0 });
    expect(r.total).toBe(28);
  });
  it('Rohini bride, Mrigashira (Taurus) groom', () => {
    // Same sign Taurus; yoni both serpent; gana Manushya bride / Deva groom; nadi Antya / Madhya
    const r = ashtakoota(moon(3), moon(4));
    const by = Object.fromEntries(r.kootas.map((k) => [k.key, k.score]));
    expect(by).toEqual({ varna: 1, vashya: 2, tara: 3, yoni: 4, maitri: 5, gana: 6, bhakoot: 7, nadi: 8 });
    expect(r.total).toBe(36);
  });
  it('6/8 moon signs score zero bhakoot; totals never exceed 36', () => {
    const r = ashtakoota(moon(0), moon(12, 3)); // Aries / Virgo
    expect(r.kootas.find((k) => k.key === 'bhakoot')!.score).toBe(0);
    for (let a = 0; a < 27; a++)
      for (let b = 0; b < 27; b++) {
        const t = ashtakoota(moon(a), moon(b)).total;
        expect(t).toBeGreaterThanOrEqual(0);
        expect(t).toBeLessThanOrEqual(36);
      }
  });
  it('manglik check', () => {
    const c = castChart({
      name: 'India', date: '1947-08-15', time: '00:00',
      place: { name: 'Delhi', lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata' },
    });
    const m = manglik(c); // Mars in Gemini: 2nd from Taurus lagna, 12th from Cancer Moon
    expect(m).toEqual({ fromLagna: true, fromMoon: true, marsHouse: 2, marsHouseFromMoon: 12 });
  });
});

describe('formatting', () => {
  it('formats degrees and minutes', () => {
    expect(formatDeg(12.5)).toBe('12°30′');
    expect(formatDeg(3.9999)).toBe('4°00′');
  });
});
