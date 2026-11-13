import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import BirthForm from '../components/BirthForm';
import ChartSvg, { Occupant } from '../components/ChartSvg';
import DashaTimeline from '../components/DashaTimeline';
import PlanetTable from '../components/PlanetTable';
import Reading from '../components/Reading';
import { Chart, castChart, graha, vargaChart } from '../engine/chart';
import { GRAHA_NAMES, GrahaId, NAKSHATRAS, SIGNS, formatDeg } from '../engine/constants';
import { runningPeriods, vimshottari } from '../engine/dasha';
import { limbsAt } from '../engine/panchang';
import { formatOffset } from '../engine/time';
import { VARGAS } from '../engine/vargas';
import { formatCoord, longDate } from '../lib/format';
import { HOUSE_TOPICS } from '../content/houses';
import { saveProfile, useProfiles } from '../store/profiles';
import { useSettings } from '../store/settings';

const TABS = [['chart', 'Chart'], ['vargas', 'Vargas'], ['dasha', 'Dasha'], ['reading', 'Reading']] as const;
type Tab = (typeof TABS)[number][0];

function occupantsOf(chart: Chart, d: number): { lagnaSign: number; occupants: Occupant[][] } {
  const v = vargaChart(chart, d);
  const occupants: Occupant[][] = Array.from({ length: 12 }, () => []);
  for (const g of chart.grahas) occupants[v.signs[g.id]].push({ id: g.id, retrograde: g.retrograde });
  return { lagnaSign: v.lagnaSign, occupants };
}

export default function ChartPage() {
  const { id } = useParams();
  const profiles = useProfiles();
  const profile = profiles.find((p) => p.id === id);
  const settings = useSettings();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find(([t]) => t === params.get('tab'))?.[0] ?? 'chart') as Tab;
  const [selectedSign, setSelectedSign] = useState<number | null>(null);
  const [selectedGraha, setSelectedGraha] = useState<GrahaId | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);

  const chart = useMemo(() => (profile ? castChart(profile, { node: settings.node }) : null), [profile, settings.node]);
  const dasha = useMemo(() => (chart ? vimshottari(graha(chart, 'Mo').lon, chart.utc) : null), [chart]);

  if (!profile || !chart || !dasha) {
    return (
      <section className="card">
        <h1>Chart not found</h1>
        <p className="muted">This chart is not saved in this browser.</p>
        <Link className="btn primary" to="/">Cast a new chart</Link>
      </section>
    );
  }

  const moon = graha(chart, 'Mo');
  const running = runningPeriods(dasha, new Date(), 2);
  const limbs = limbsAt(chart.utc);
  const rasi = occupantsOf(chart, 1);
  const navamsa = occupantsOf(chart, 9);
  const toggleSign = (s: number) => setSelectedSign((cur) => (cur === s ? null : s));
  const selHouse = selectedSign === null ? null : ((selectedSign - chart.lagna.sign + 12) % 12) + 1;

  return (
    <div className="chart-page">
      <header className="chart-head">
        <div>
          <h1>{profile.name}</h1>
          <p className="muted">
            {longDate(profile.date)}, {profile.time} ({formatOffset(chart.offsetMinutes)}) · {profile.place.name} ·{' '}
            {formatCoord(profile.place.lat, profile.place.lon)}
          </p>
        </div>
        <div className="head-actions no-print">
          <button type="button" className="btn" onClick={() => setEditing((e) => !e)}>{editing ? 'Close' : 'Edit'}</button>
          <button type="button" className="btn" onClick={() => window.print()}>Print</button>
        </div>
      </header>

      {editing && (
        <section className="card no-print">
          <h2>Edit birth details</h2>
          <BirthForm
            initial={profile}
            submitLabel="Save"
            onCancel={() => setEditing(false)}
            onSubmit={(b) => {
              saveProfile(b, profile.id);
              setEditing(false);
            }}
          />
        </section>
      )}

      <dl className="facts">
        <div><dt>Lagna</dt><dd>{SIGNS[chart.lagna.sign].sa} <small>{formatDeg(chart.lagna.deg)}</small></dd></div>
        <div><dt>Rasi (Moon sign)</dt><dd>{SIGNS[moon.sign].sa} <small>{formatDeg(moon.deg)}</small></dd></div>
        <div><dt>Nakshatra</dt><dd>{NAKSHATRAS[moon.nakshatra]} <small>pada {moon.pada}</small></dd></div>
        <div>
          <dt>Dasha now</dt>
          <dd>{running.length ? running.map((p) => GRAHA_NAMES[p.lords[p.lords.length - 1]].en).join(' – ') : '—'}</dd>
        </div>
        <div><dt>Tithi at birth</dt><dd>{limbs.tithi.paksha} {limbs.tithi.name}</dd></div>
        <div><dt>Ayanamsa</dt><dd>{formatDeg(chart.ayanamsa)} <small>Lahiri</small></dd></div>
      </dl>

      <div className="tabs no-print" role="tablist" aria-label="Chart sections">
        {TABS.map(([t, label]) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? 'on' : ''}
            onClick={() => setParams(t === 'chart' ? {} : { tab: t }, { replace: true })}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'chart' && (
        <>
          <div className="charts-row">
            <figure className="card chart-card">
              <figcaption>Rasi <small>D1</small></figcaption>
              <ChartSvg
                style={settings.chartStyle}
                title="Rasi"
                {...rasi}
                selectedSign={selectedSign}
                selectedGraha={selectedGraha}
                onSelectSign={toggleSign}
              />
            </figure>
            <figure className="card chart-card">
              <figcaption>Navamsa <small>D9</small></figcaption>
              <ChartSvg style={settings.chartStyle} title="Navamsa" {...navamsa} selectedGraha={selectedGraha} />
            </figure>
          </div>
          <p className="house-note" aria-live="polite">
            {selHouse === null ? (
              <span className="muted no-print">Select a house in the rasi chart to see what it governs.</span>
            ) : (
              <>
                <strong>House {selHouse}, {SIGNS[selectedSign!].sa} ({SIGNS[selectedSign!].en}).</strong>{' '}
                Governs {HOUSE_TOPICS[selHouse - 1]}. Lord: {GRAHA_NAMES[SIGNS[selectedSign!].lord].en}, placed in house{' '}
                {graha(chart, SIGNS[selectedSign!].lord).house}.{' '}
                {rasi.occupants[selectedSign!].length
                  ? `Occupied by ${rasi.occupants[selectedSign!].map((o) => GRAHA_NAMES[o.id].en).join(', ')}.`
                  : 'No grahas here.'}
              </>
            )}
          </p>
          <section className="card">
            <h2>Positions</h2>
            <PlanetTable chart={chart} selectedSign={selectedSign} selectedGraha={selectedGraha} onSelectGraha={setSelectedGraha} />
            <p className="hint">
              At birth: yoga {limbs.yoga}, karana {limbs.karana}. Rahu and Ketu use the {settings.node} node. ℞ marks retrograde motion.
            </p>
          </section>
        </>
      )}

      {tab === 'vargas' && (
        <>
          {zoom !== null && (
            <section className="card varga-zoom">
              <header className="card-head row">
                <h2>
                  {VARGAS.find((v) => v.d === zoom)!.name} <small>D{zoom} · {VARGAS.find((v) => v.d === zoom)!.topic}</small>
                </h2>
                <button type="button" className="btn" onClick={() => setZoom(null)}>Close</button>
              </header>
              <ChartSvg style={settings.chartStyle} title={`D${zoom}`} {...occupantsOf(chart, zoom)} />
            </section>
          )}
          <div className="varga-grid">
            {VARGAS.map((v) => (
              <button key={v.d} type="button" className="card varga" onClick={() => setZoom(v.d)} aria-label={`Enlarge ${v.name}, D${v.d}`}>
                <span className="varga-name">{v.name} <small>D{v.d}</small></span>
                <ChartSvg style={settings.chartStyle} title={`D${v.d}`} compact {...occupantsOf(chart, v.d)} />
                <span className="muted">{v.topic}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {tab === 'dasha' && <DashaTimeline dasha={dasha} birth={chart.utc} />}
      {tab === 'reading' && <Reading chart={chart} />}
    </div>
  );
}
