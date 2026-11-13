import { useMemo, useState } from 'react';
import { DASHA_YEARS, GRAHA_NAMES } from '../engine/constants';
import { DashaPeriod, Vimshottari, YEAR_MS, contains, runningPeriods, subPeriods } from '../engine/dasha';
import { dayOf, years } from '../lib/format';

interface Props {
  dasha: Vimshottari;
  birth: Date;
}

const LEVELS = ['Mahadasha', 'Antardasha', 'Pratyantardasha'];
const key = (p: DashaPeriod) => p.lords.join('-');

function Row({ period, now, birth, open, toggle }: {
  period: DashaPeriod; now: Date; birth: Date; open: Set<string>; toggle: (k: string) => void;
}) {
  const depth = period.lords.length;
  const k = key(period);
  const current = contains(period, now);
  const past = period.end.getTime() <= now.getTime();
  const expandable = depth < 3;
  const isOpen = open.has(k);
  const lord = period.lords[depth - 1];
  const span = period.end.getTime() - period.start.getTime();
  const progress = current ? (now.getTime() - period.start.getTime()) / span : past ? 1 : 0;
  const beforeBirth = period.start.getTime() < birth.getTime();
  const label = period.lords.map((l) => GRAHA_NAMES[l].en).join(' – ');

  const body = (
    <>
      <span className="dasha-lord">
        {expandable && <span className="chev" aria-hidden="true">{isOpen ? '▾' : '▸'}</span>}
        {depth === 1 ? GRAHA_NAMES[lord].en : label}
        {current && <span className="tag now">Now</span>}
      </span>
      <span className="dasha-dates">
        {beforeBirth ? <>born into it · ends {dayOf(period.end)}</> : <>{dayOf(period.start)} – {dayOf(period.end)}</>}
      </span>
      <span className="dasha-len">{depth === 1 ? `${DASHA_YEARS[lord]}y` : years(span / YEAR_MS)}</span>
      <span className="dasha-bar" aria-hidden="true"><i style={{ width: `${progress * 100}%` }} /></span>
    </>
  );

  return (
    <li className={`dasha-item d${depth}${current ? ' current' : ''}${past ? ' past' : ''}`}>
      {expandable ? (
        <button type="button" className="dasha-row" aria-expanded={isOpen} onClick={() => toggle(k)}>
          {body}
        </button>
      ) : (
        <div className="dasha-row">{body}</div>
      )}
      {expandable && isOpen && (
        <ul aria-label={`${LEVELS[depth]} periods of ${label}`}>
          {subPeriods(period)
            .filter((s) => s.end.getTime() > birth.getTime())
            .map((s) => <Row key={key(s)} period={s} now={now} birth={birth} open={open} toggle={toggle} />)}
        </ul>
      )}
    </li>
  );
}

export default function DashaTimeline({ dasha, birth }: Props) {
  const now = useMemo(() => new Date(), []);
  const running = useMemo(() => runningPeriods(dasha, now), [dasha, now]);
  const [open, setOpen] = useState<Set<string>>(() => new Set(running.slice(0, 2).map(key)));
  const toggle = (k: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  return (
    <section className="card">
      <header className="card-head">
        <h2>Vimshottari dasha</h2>
        <p className="muted">
          Born in {GRAHA_NAMES[dasha.birthLord].en} mahadasha with {years(dasha.balanceYears)} remaining.
          {running.length > 0 && (
            <> Running now: <strong>{running.map((p) => GRAHA_NAMES[p.lords[p.lords.length - 1]].en).join(' – ')}</strong>
              {' '}until {dayOf(running[running.length - 1].end)}.</>
          )}
        </p>
      </header>
      <ul className="dasha-list" aria-label="Mahadasha periods">
        {dasha.mahadashas.map((m) => <Row key={key(m)} period={m} now={now} birth={birth} open={open} toggle={toggle} />)}
      </ul>
      <p className="hint">Select a period to open its sub-periods. A dasha year is counted as 365.25 days.</p>
    </section>
  );
}
