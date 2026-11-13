import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Place } from '../engine/chart';
import { isValidZone } from '../engine/time';
import { formatCoord } from '../lib/format';

type Row = [name: string, region: string, country: string, lat: number, lon: number, tz: string];

let citiesPromise: Promise<Row[]> | null = null;
const loadCities = () => (citiesPromise ??= import('../data/cities.json').then((m) => m.default as Row[]));

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function search(rows: Row[], query: string): Row[] {
  const q = fold(query.trim());
  if (q.length < 2) return [];
  const starts: Row[] = [];
  const contains: Row[] = [];
  for (const r of rows) {
    const name = fold(r[0]);
    if (name.startsWith(q)) starts.push(r);
    else if (name.includes(q) || fold(`${r[0]} ${r[1]} ${r[2]}`).includes(q)) contains.push(r);
    if (starts.length >= 8) break;
  }
  return [...starts, ...contains].slice(0, 8);
}

const zones: string[] = (() => {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return ['Asia/Kolkata', 'UTC'];
  }
})();

interface Props {
  value: Place | null;
  onChange: (place: Place | null) => void;
}

export default function PlacePicker({ value, onChange }: Props) {
  const id = useId();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [query, setQuery] = useState(value?.name ?? '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [manual, setManual] = useState(false);
  const [m, setM] = useState({
    name: value?.name ?? '',
    lat: value ? String(value.lat) : '',
    lon: value ? String(value.lon) : '',
    tz: value?.tz ?? 'Asia/Kolkata',
  });
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!manual) setQuery(value?.name ?? '');
  }, [value, manual]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const results = useMemo(() => (rows ? search(rows, query) : []), [rows, query]);

  const pick = (r: Row) => {
    const name = [r[0], r[1], r[2]].filter(Boolean).join(', ');
    onChange({ name, lat: r[3], lon: r[4], tz: r[5] });
    setQuery(name);
    setOpen(false);
  };

  const manualError = (() => {
    const lat = Number(m.lat);
    const lon = Number(m.lon);
    if (m.lat === '' || m.lon === '') return 'Enter latitude and longitude.';
    if (!Number.isFinite(lat) || Math.abs(lat) > 90) return 'Latitude must be between −90 and 90.';
    if (!Number.isFinite(lon) || Math.abs(lon) > 180) return 'Longitude must be between −180 and 180.';
    if (!isValidZone(m.tz)) return 'Use a zone like Asia/Kolkata, or an offset like UTC+05:30.';
    return null;
  })();

  const setManualField = (patch: Partial<typeof m>) => {
    const next = { ...m, ...patch };
    setM(next);
    const lat = Number(next.lat);
    const lon = Number(next.lon);
    const ok =
      next.lat !== '' && next.lon !== '' && Number.isFinite(lat) && Math.abs(lat) <= 90 &&
      Number.isFinite(lon) && Math.abs(lon) <= 180 && isValidZone(next.tz);
    onChange(ok ? { name: next.name.trim() || formatCoord(lat, lon), lat, lon, tz: next.tz.trim() } : null);
  };

  if (manual) {
    return (
      <div className="place-manual">
        <div className="field">
          <label htmlFor={`${id}-name`}>Place name</label>
          <input id={`${id}-name`} value={m.name} onChange={(e) => setManualField({ name: e.target.value })} />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor={`${id}-lat`}>Latitude (north +)</label>
            <input id={`${id}-lat`} inputMode="decimal" placeholder="20.30" value={m.lat} onChange={(e) => setManualField({ lat: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor={`${id}-lon`}>Longitude (east +)</label>
            <input id={`${id}-lon`} inputMode="decimal" placeholder="85.82" value={m.lon} onChange={(e) => setManualField({ lon: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label htmlFor={`${id}-tz`}>Time zone</label>
          <input id={`${id}-tz`} list={`${id}-zones`} value={m.tz} onChange={(e) => setManualField({ tz: e.target.value })} />
          <datalist id={`${id}-zones`}>
            {zones.map((z) => <option key={z} value={z} />)}
          </datalist>
        </div>
        {manualError && <p className="hint error">{manualError}</p>}
        <button type="button" className="link" onClick={() => setManual(false)}>Search for a city instead</button>
      </div>
    );
  }

  return (
    <div className="place-picker" ref={wrap}>
      <div className="field">
        <label htmlFor={`${id}-q`}>Place of birth</label>
        <input
          id={`${id}-q`}
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder="Start typing a city"
          value={query}
          onFocus={() => {
            loadCities().then(setRows);
            setOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
            if (value) onChange(null);
          }}
          onKeyDown={(e) => {
            if (!open || !results.length) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => (a + 1) % results.length);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => (a - 1 + results.length) % results.length);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              pick(results[active]);
            } else if (e.key === 'Escape') setOpen(false);
          }}
        />
      </div>
      {open && results.length > 0 && (
        <ul className="suggestions" id={`${id}-list`} role="listbox">
          {results.map((r, i) => (
            <li
              key={`${r[0]}${r[3]}${r[4]}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'active' : ''}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(r);
              }}
            >
              <span>{r[0]}</span>
              <small>{[r[1], r[2]].filter(Boolean).join(', ')}</small>
            </li>
          ))}
        </ul>
      )}
      {open && rows && query.trim().length >= 2 && results.length === 0 && !value && (
        <p className="hint">No match in the offline list. Enter the coordinates yourself below.</p>
      )}
      <p className="hint">
        {value ? `${formatCoord(value.lat, value.lon)} · ${value.tz} · ` : ''}
        <button
          type="button"
          className="link"
          onClick={() => {
            if (value) setM({ name: value.name, lat: String(value.lat), lon: String(value.lon), tz: value.tz });
            setManual(true);
          }}
        >
          {value ? 'Adjust coordinates' : 'Enter coordinates manually'}
        </button>
      </p>
    </div>
  );
}
