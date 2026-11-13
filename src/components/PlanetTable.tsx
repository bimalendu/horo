import { Chart, dignity, isVargottama } from '../engine/chart';
import { GRAHA_NAMES, GrahaId, NAKSHATRAS, SIGNS, formatDeg, nakshatraLord } from '../engine/constants';

interface Props {
  chart: Chart;
  selectedSign: number | null;
  selectedGraha: GrahaId | null;
  onSelectGraha: (id: GrahaId | null) => void;
}

export default function PlanetTable({ chart, selectedSign, selectedGraha, onSelectGraha }: Props) {
  const { lagna } = chart;
  return (
    <div className="table-wrap">
      <table className="planet-table">
        <thead>
          <tr>
            <th scope="col">Graha</th>
            <th scope="col">Sign</th>
            <th scope="col" className="num">Degree</th>
            <th scope="col">Nakshatra</th>
            <th scope="col">Lord</th>
            <th scope="col" className="num">House</th>
            <th scope="col">Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr className={selectedSign === lagna.sign ? 'in-sign' : ''}>
            <th scope="row"><span className="asc">Lagna</span></th>
            <td>{SIGNS[lagna.sign].sa} <small>{SIGNS[lagna.sign].en}</small></td>
            <td className="num">{formatDeg(lagna.deg)}</td>
            <td>{NAKSHATRAS[lagna.nakshatra]} <small>pada {lagna.pada}</small></td>
            <td>{GRAHA_NAMES[nakshatraLord(lagna.nakshatra)].en}</td>
            <td className="num">1</td>
            <td>{isVargottama(lagna.lon) && <span className="tag">Vargottama</span>}</td>
          </tr>
          {chart.grahas.map((g) => {
            const notes: string[] = [];
            if (g.retrograde && g.id !== 'Ra' && g.id !== 'Ke') notes.push('Retrograde');
            const d = dignity(g.id, g.sign);
            if (d) notes.push(d);
            if (g.combust) notes.push('Combust');
            if (isVargottama(g.lon)) notes.push('Vargottama');
            const selected = selectedGraha === g.id;
            return (
              <tr
                key={g.id}
                className={`${selected ? 'selected' : ''} ${selectedSign === g.sign ? 'in-sign' : ''}`}
                onMouseEnter={() => onSelectGraha(g.id)}
                onMouseLeave={() => onSelectGraha(null)}
              >
                <th scope="row">
                  {GRAHA_NAMES[g.id].en} <small>{GRAHA_NAMES[g.id].sa}</small>
                </th>
                <td>{SIGNS[g.sign].sa} <small>{SIGNS[g.sign].en}</small></td>
                <td className="num">{formatDeg(g.deg)}</td>
                <td>{NAKSHATRAS[g.nakshatra]} <small>pada {g.pada}</small></td>
                <td>{GRAHA_NAMES[nakshatraLord(g.nakshatra)].en}</td>
                <td className="num">{g.house}</td>
                <td>{notes.map((n) => <span key={n} className="tag">{n}</span>)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
