import { useId, useMemo, useState } from 'react';
import BirthForm from '../components/BirthForm';
import { castChart, graha } from '../engine/chart';
import { GRAHA_NAMES, GrahaId, NAKSHATRAS, SIGNS } from '../engine/constants';
import { ashtakoota, manglik, moonData } from '../engine/matching';
import { Profile, saveProfile, useProfiles } from '../store/profiles';
import { useSettings } from '../store/settings';

function Person({ label, profiles, value, onChange }: {
  label: string; profiles: Profile[]; value: string; onChange: (id: string) => void;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choose a saved chart</option>
        {profiles.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.date})</option>)}
      </select>
    </div>
  );
}

const manglikText = (m: ReturnType<typeof manglik>): string =>
  m.fromLagna || m.fromMoon
    ? `Manglik: Mars is in house ${m.marsHouse} from lagna and ${m.marsHouseFromMoon} from the Moon`
    : `Not Manglik: Mars is in house ${m.marsHouse} from lagna and ${m.marsHouseFromMoon} from the Moon`;

export default function MatchPage() {
  const profiles = useProfiles();
  const { node } = useSettings();
  const [brideId, setBrideId] = useState('');
  const [groomId, setGroomId] = useState('');
  const [adding, setAdding] = useState(false);

  const bride = profiles.find((p) => p.id === brideId);
  const groom = profiles.find((p) => p.id === groomId);

  const result = useMemo(() => {
    if (!bride || !groom) return null;
    const b = castChart(bride, { node });
    const g = castChart(groom, { node });
    return { b, g, match: ashtakoota(moonData(b), moonData(g)), bm: manglik(b), gm: manglik(g) };
  }, [bride, groom, node]);

  const lordName = (s: string) => (s in GRAHA_NAMES ? GRAHA_NAMES[s as GrahaId].en : s);

  return (
    <div className="match-page">
      <header className="page-head">
        <h1>Kundli matching</h1>
        <p className="muted">Ashtakoota guna milan: eight factors from the two Moon positions, 36 points in all.</p>
      </header>
      <section className="card">
        <div className="field-row">
          <Person label="Bride" profiles={profiles} value={brideId} onChange={setBrideId} />
          <Person label="Groom" profiles={profiles} value={groomId} onChange={setGroomId} />
        </div>
        {adding ? (
          <div className="inset">
            <h2>Add a person</h2>
            <BirthForm
              submitLabel="Save chart"
              onCancel={() => setAdding(false)}
              onSubmit={(b) => {
                const p = saveProfile(b);
                if (!brideId) setBrideId(p.id);
                else if (!groomId) setGroomId(p.id);
                setAdding(false);
              }}
            />
          </div>
        ) : (
          <button type="button" className="btn" onClick={() => setAdding(true)}>Add a person</button>
        )}
        {brideId && brideId === groomId && <p className="hint error">Choose two different charts.</p>}
      </section>

      {result && brideId !== groomId && (
        <>
          <section className="card score-card">
            <div className="score" role="img" aria-label={`${result.match.total} out of 36`}>
              <strong>{result.match.total}</strong>
              <span>/ 36</span>
            </div>
            <div>
              <h2>{result.match.verdict}</h2>
              <div className="meter" aria-hidden="true">
                <i style={{ width: `${(result.match.total / 36) * 100}%` }} />
                <b style={{ left: '50%' }} />
              </div>
              <p className="muted">18 or more is traditionally considered acceptable.</p>
            </div>
          </section>

          <section className="card">
            <div className="table-wrap">
              <table className="planet-table">
                <thead>
                  <tr>
                    <th scope="col">Koota</th>
                    <th scope="col">{bride!.name}</th>
                    <th scope="col">{groom!.name}</th>
                    <th scope="col" className="num">Score</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Moon <small>sign, nakshatra</small></th>
                    {[result.b, result.g].map((c, i) => {
                      const m = graha(c, 'Mo');
                      return <td key={i}>{SIGNS[m.sign].sa}, {NAKSHATRAS[m.nakshatra]}</td>;
                    })}
                    <td />
                  </tr>
                  {result.match.kootas.map((k) => (
                    <tr key={k.key} className={k.score === 0 ? 'zero' : ''}>
                      <th scope="row">{k.name} <small>{k.about}</small></th>
                      <td>{lordName(k.bride)}</td>
                      <td>{lordName(k.groom)}</td>
                      <td className="num"><strong>{k.score}</strong> / {k.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <h2>Mangal dosha</h2>
            <ul className="plain">
              <li><strong>{bride!.name}.</strong> {manglikText(result.bm)}.</li>
              <li><strong>{groom!.name}.</strong> {manglikText(result.gm)}.</li>
            </ul>
            <p className="hint">
              Mars in house 1, 2, 4, 7, 8 or 12 counts as Manglik. Scoring tables for Vashya and Gana differ a little
              between traditions; this uses the most widely printed ones.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
