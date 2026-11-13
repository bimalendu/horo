import { useId, useMemo, useState } from 'react';
import PlacePicker from '../components/PlacePicker';
import { Place } from '../engine/chart';
import { GRAHA_NAMES } from '../engine/constants';
import { Panchang, panchang, signName, todayIn } from '../engine/panchang';
import { dateTimeIn, longDate, timeIn } from '../lib/format';
import { useProfiles } from '../store/profiles';
import { updateSettings, useSettings } from '../store/settings';

const DEFAULT_PLACE: Place = { name: 'New Delhi, Delhi, India', lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata' };

function shift(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export default function PanchangPage() {
  const id = useId();
  const settings = useSettings();
  const profiles = useProfiles();
  const [place, setPlace] = useState<Place | null>(settings.lastPlace ?? profiles[0]?.place ?? DEFAULT_PLACE);
  const [date, setDate] = useState(() => todayIn((settings.lastPlace ?? profiles[0]?.place ?? DEFAULT_PLACE).tz));

  const result = useMemo((): Panchang | string | null => {
    if (!place || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    try {
      return panchang(date, place);
    } catch {
      return 'The panchang could not be calculated for this date and place.';
    }
  }, [date, place]);

  const p = typeof result === 'object' ? result : null;
  const tz = place?.tz ?? 'UTC';
  const until = (d: Date | null) => (d ? `until ${dateTimeIn(d, tz)}` : '');

  return (
    <div className="panchang-page">
      <header className="page-head">
        <h1>Panchang</h1>
        <p className="muted">The five limbs of the day, taken at sunrise.</p>
      </header>
      <section className="card">
        <div className="field-row">
          <div className="field">
            <label htmlFor={`${id}-date`}>Date</label>
            <div className="date-nav">
              <button type="button" className="btn" aria-label="Previous day" onClick={() => setDate((d) => shift(d, -1))}>‹</button>
              <input id={`${id}-date`} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <button type="button" className="btn" aria-label="Next day" onClick={() => setDate((d) => shift(d, 1))}>›</button>
              <button type="button" className="btn" onClick={() => setDate(todayIn(tz))}>Today</button>
            </div>
          </div>
          <PlacePicker
            value={place}
            onChange={(pl) => {
              setPlace(pl);
              if (pl) updateSettings({ lastPlace: pl });
            }}
          />
        </div>
      </section>

      {typeof result === 'string' && <p className="hint error" role="alert">{result}</p>}

      {p && (
        <>
          <h2 className="section-title">{p.vara.en}, {longDate(p.date)} <small>{p.place.name}</small></h2>
          <div className="limb-grid">
            <article className="card limb">
              <h3>Vara</h3>
              <p className="big">{p.vara.sa}</p>
              <p className="muted">{p.vara.en} · ruled by {GRAHA_NAMES[p.vara.lord].en}</p>
            </article>
            <article className="card limb">
              <h3>Tithi</h3>
              <p className="big">{p.tithi.paksha} {p.tithi.name}</p>
              <p className="muted">{p.tithi.paksha === 'Shukla' ? 'Waxing' : 'Waning'} fortnight, day {p.tithi.number} · {until(p.tithi.ends)}</p>
            </article>
            <article className="card limb">
              <h3>Nakshatra</h3>
              <p className="big">{p.nakshatra.name}</p>
              <p className="muted">Pada {p.nakshatra.pada} · {until(p.nakshatra.ends)}</p>
            </article>
            <article className="card limb">
              <h3>Yoga</h3>
              <p className="big">{p.yoga.name}</p>
              <p className="muted">{until(p.yoga.ends)}</p>
            </article>
            <article className="card limb">
              <h3>Karana</h3>
              <p className="big">{p.karana.name}</p>
              <p className="muted">{until(p.karana.ends)}</p>
            </article>
          </div>
          <section className="card">
            <dl className="facts flat">
              <div><dt>Sunrise</dt><dd>{timeIn(p.sunrise, tz)}</dd></div>
              <div><dt>Sunset</dt><dd>{timeIn(p.sunset, tz)}</dd></div>
              <div><dt>Moonrise</dt><dd>{timeIn(p.moonrise, tz)}</dd></div>
              <div><dt>Moonset</dt><dd>{timeIn(p.moonset, tz)}</dd></div>
              <div><dt>Rahu kalam</dt><dd>{p.rahuKalam ? `${timeIn(p.rahuKalam[0], tz)} – ${timeIn(p.rahuKalam[1], tz)}` : '—'}</dd></div>
              <div><dt>Sun in</dt><dd>{signName(p.sunSign)}</dd></div>
              <div><dt>Moon in</dt><dd>{signName(p.moonSign)}</dd></div>
            </dl>
            <p className="hint">
              Times are local to {p.place.name} ({tz}).
              {!p.sunrise && ' The Sun does not rise on this date here, so values are for local noon.'}
            </p>
          </section>
        </>
      )}
    </div>
  );
}
