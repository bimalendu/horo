import { KeyboardEvent } from 'react';
import { GrahaId, SIGNS, SIGN_ABBR } from '../engine/constants';
import { ChartStyle } from '../store/settings';

export interface Occupant {
  id: GrahaId;
  retrograde?: boolean;
}

interface Props {
  style: ChartStyle;
  lagnaSign: number;
  /** Grahas by the sign (0-11) they occupy. */
  occupants: Occupant[][];
  title?: string;
  compact?: boolean;
  selectedSign?: number | null;
  selectedGraha?: GrahaId | null;
  onSelectSign?: (sign: number) => void;
}

interface Cell {
  sign: number;
  points: [number, number][];
  /** Centre of the block of graha labels. */
  cx: number;
  cy: number;
  /** Where the sign marker goes. */
  mx: number;
  my: number;
  perRow: number;
}

const S = 400;
const U = S / 3;

// North Indian: houses are fixed, house 1 is the top diamond, order runs anticlockwise.
const NORTH: Omit<Cell, 'sign'>[] = [
  { points: [[200, 0], [300, 100], [200, 200], [100, 100]], cx: 200, cy: 92, mx: 200, my: 178, perRow: 3 },
  { points: [[0, 0], [200, 0], [100, 100]], cx: 100, cy: 36, mx: 100, my: 84, perRow: 3 },
  { points: [[0, 0], [100, 100], [0, 200]], cx: 36, cy: 100, mx: 82, my: 100, perRow: 2 },
  { points: [[0, 200], [100, 100], [200, 200], [100, 300]], cx: 100, cy: 200, mx: 178, my: 200, perRow: 3 },
  { points: [[0, 200], [100, 300], [0, 400]], cx: 36, cy: 300, mx: 82, my: 300, perRow: 2 },
  { points: [[0, 400], [100, 300], [200, 400]], cx: 100, cy: 364, mx: 100, my: 316, perRow: 3 },
  { points: [[200, 400], [100, 300], [200, 200], [300, 300]], cx: 200, cy: 308, mx: 200, my: 222, perRow: 3 },
  { points: [[200, 400], [300, 300], [400, 400]], cx: 300, cy: 364, mx: 300, my: 316, perRow: 3 },
  { points: [[400, 400], [300, 300], [400, 200]], cx: 364, cy: 300, mx: 318, my: 300, perRow: 2 },
  { points: [[400, 200], [300, 300], [200, 200], [300, 100]], cx: 300, cy: 200, mx: 222, my: 200, perRow: 3 },
  { points: [[400, 200], [300, 100], [400, 0]], cx: 364, cy: 100, mx: 318, my: 100, perRow: 2 },
  { points: [[400, 0], [300, 100], [200, 0]], cx: 300, cy: 36, mx: 300, my: 84, perRow: 3 },
];

// South Indian: signs are fixed, Pisces top-left, running clockwise.
const SOUTH_POS: [number, number][] = [
  [1, 0], [2, 0], [3, 0], [3, 1], [3, 2], [3, 3], [2, 3], [1, 3], [0, 3], [0, 2], [0, 1], [0, 0],
];
const SOUTH: Cell[] = SOUTH_POS.map(([c, r], sign) => ({
  sign,
  points: [[c * 100, r * 100], [c * 100 + 100, r * 100], [c * 100 + 100, r * 100 + 100], [c * 100, r * 100 + 100]],
  cx: c * 100 + 50,
  cy: r * 100 + 56,
  mx: c * 100 + 14,
  my: r * 100 + 13,
  perRow: 3,
}));

// East Indian: signs are fixed, Aries top-centre, running anticlockwise; corners are split.
const tri = (a: [number, number], b: [number, number], c: [number, number], sign: number): Cell => {
  const cx = (a[0] + b[0] + c[0]) / 3;
  const cy = (a[1] + b[1] + c[1]) / 3;
  // Marker sits toward the outer corner (first point), labels toward the centroid.
  return { sign, points: [a, b, c], cx, cy: cy + 2, mx: a[0] + (cx - a[0]) * 0.36, my: a[1] + (cy - a[1]) * 0.36, perRow: 2 };
};
const sq = (c: number, r: number, sign: number): Cell => ({
  sign,
  points: [[c * U, r * U], [c * U + U, r * U], [c * U + U, r * U + U], [c * U, r * U + U]],
  cx: c * U + U / 2,
  cy: r * U + U / 2 + 6,
  mx: c * U + 15,
  my: r * U + 14,
  perRow: 3,
});
const EAST: Cell[] = [
  sq(1, 0, 0),
  tri([0, 0], [U, 0], [U, U], 1),
  tri([0, 0], [0, U], [U, U], 2),
  sq(0, 1, 3),
  tri([0, S], [0, 2 * U], [U, 2 * U], 4),
  tri([0, S], [U, S], [U, 2 * U], 5),
  sq(1, 2, 6),
  tri([S, S], [2 * U, S], [2 * U, 2 * U], 7),
  tri([S, S], [S, 2 * U], [2 * U, 2 * U], 8),
  sq(2, 1, 9),
  tri([S, 0], [S, U], [2 * U, U], 10),
  tri([S, 0], [2 * U, 0], [2 * U, U], 11),
];

function cellsFor(style: ChartStyle, lagnaSign: number): Cell[] {
  if (style === 'south') return SOUTH;
  if (style === 'east') return EAST;
  return NORTH.map((c, i) => ({ ...c, sign: (lagnaSign + i) % 12 }));
}

export default function ChartSvg({
  style, lagnaSign, occupants, title, compact, selectedSign, selectedGraha, onSelectSign,
}: Props) {
  const cells = cellsFor(style, lagnaSign);
  const font = compact ? 19 : 16;
  const markFont = compact ? 15 : 12;
  const interactive = !!onSelectSign;

  const onKey = (e: KeyboardEvent, sign: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectSign?.(sign);
    }
  };

  return (
    <svg
      className={`chart-svg${compact ? ' compact' : ''}`}
      viewBox={`-2 -2 ${S + 4} ${S + 4}`}
      role={interactive ? 'group' : 'img'}
      aria-label={`${title ?? 'Chart'}, ${SIGNS[lagnaSign].en} ascendant`}
    >
      {cells.map((cell) => {
        const house = ((cell.sign - lagnaSign + 12) % 12) + 1;
        const names = (occupants[cell.sign] ?? []).map((o) => o.id).join(', ') || 'empty';
        return (
          <g
            key={cell.sign}
            className={`cell${cell.sign === lagnaSign ? ' lagna' : ''}${selectedSign === cell.sign ? ' selected' : ''}${interactive ? ' clickable' : ''}`}
            onClick={interactive ? () => onSelectSign(cell.sign) : undefined}
            onKeyDown={interactive ? (e) => onKey(e, cell.sign) : undefined}
            tabIndex={interactive ? 0 : undefined}
            role={interactive ? 'button' : undefined}
            aria-pressed={interactive ? selectedSign === cell.sign : undefined}
            aria-label={interactive ? `House ${house}, ${SIGNS[cell.sign].en}: ${names}` : undefined}
          >
            <polygon points={cell.points.map((p) => p.join(',')).join(' ')} />
          </g>
        );
      })}
      {/* Labels are drawn after every cell so a crowded house is never hidden by its neighbour. */}
      {cells.map((cell) => {
        const labels: { text: string; cls: string }[] = [];
        if (cell.sign === lagnaSign && style !== 'north') labels.push({ text: 'As', cls: 'asc' });
        for (const o of occupants[cell.sign] ?? []) {
          labels.push({
            text: o.id + (o.retrograde && o.id !== 'Ra' && o.id !== 'Ke' ? '℞' : ''),
            cls: selectedGraha === o.id ? 'graha hit' : 'graha',
          });
        }
        const crowded = labels.length > 2 * cell.perRow;
        const size = crowded ? font * 0.85 : font;
        const rows: (typeof labels)[] = [];
        for (let i = 0; i < labels.length; i += cell.perRow) rows.push(labels.slice(i, i + cell.perRow));
        const lineH = size * 1.18;
        const top = cell.cy - ((rows.length - 1) * lineH) / 2;
        return (
          <g key={cell.sign} className="labels" aria-hidden={interactive || undefined}>
            <text className="mark" x={cell.mx} y={cell.my} fontSize={markFont} textAnchor="middle" dominantBaseline="central">
              {style === 'north' ? cell.sign + 1 : SIGN_ABBR[cell.sign]}
            </text>
            {rows.map((row, r) => (
              <text key={r} x={cell.cx} y={top + r * lineH} fontSize={size} textAnchor="middle" dominantBaseline="central">
                {row.map((l, i) => (
                  <tspan key={i} className={l.cls} dx={i ? size * 0.35 : 0}>
                    {l.text}
                  </tspan>
                ))}
              </text>
            ))}
          </g>
        );
      })}
      {style !== 'north' && title && (
        <text className="center-title" x={S / 2} y={S / 2} fontSize={compact ? 24 : 18} textAnchor="middle" dominantBaseline="central">
          {title}
        </text>
      )}
    </svg>
  );
}
