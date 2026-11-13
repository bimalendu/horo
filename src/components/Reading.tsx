import { Chart, dignity, graha } from '../engine/chart';
import { GRAHA_NAMES, NAKSHATRAS, SIGNS, nakshatraLord } from '../engine/constants';
import { HOUSE_TOPICS, PLANET_IN_HOUSE } from '../content/houses';
import { NAKSHATRA_INFO } from '../content/nakshatras';
import { LAGNA_TEXT, MOON_SIGN_TEXT } from '../content/signs';

export default function Reading({ chart }: { chart: Chart }) {
  const moon = graha(chart, 'Mo');
  const nak = NAKSHATRA_INFO[moon.nakshatra];
  return (
    <div className="reading">
      <section className="card">
        <h2>Lagna: {SIGNS[chart.lagna.sign].sa} <small>{SIGNS[chart.lagna.sign].en} rising</small></h2>
        <p>{LAGNA_TEXT[chart.lagna.sign]}</p>
      </section>
      <section className="card">
        <h2>Moon sign: {SIGNS[moon.sign].sa} <small>{SIGNS[moon.sign].en}</small></h2>
        <p>{MOON_SIGN_TEXT[moon.sign]}</p>
      </section>
      <section className="card">
        <h2>Birth star: {NAKSHATRAS[moon.nakshatra]} <small>pada {moon.pada}</small></h2>
        <p className="muted">
          Deity: {nak.deity} · Symbol: {nak.symbol} · Ruled by {GRAHA_NAMES[nakshatraLord(moon.nakshatra)].en}
        </p>
        <p>{nak.text}</p>
      </section>
      <section className="card">
        <h2>Grahas in houses</h2>
        <dl className="reading-list">
          {chart.grahas.map((g) => {
            const d = dignity(g.id, g.sign);
            return (
              <div key={g.id}>
                <dt>
                  {GRAHA_NAMES[g.id].en} in house {g.house}
                  <small> {SIGNS[g.sign].sa}{d ? `, ${d.toLowerCase()}` : ''} · {HOUSE_TOPICS[g.house - 1]}</small>
                </dt>
                <dd>{PLANET_IN_HOUSE[g.id][g.house - 1]}</dd>
              </div>
            );
          })}
        </dl>
      </section>
      <p className="hint">
        These notes summarise traditional associations of each placement taken on its own. A full reading weighs
        aspects, conjunctions, strengths and the running dasha together, and is not a prediction.
      </p>
    </div>
  );
}
