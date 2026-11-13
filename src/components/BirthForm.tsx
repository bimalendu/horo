import { FormEvent, useId, useState } from 'react';
import { BirthData, Place } from '../engine/chart';
import PlacePicker from './PlacePicker';

interface Props {
  initial?: BirthData;
  submitLabel?: string;
  onSubmit: (birth: BirthData) => void;
  onCancel?: () => void;
}

export default function BirthForm({ initial, submitLabel = 'Cast chart', onSubmit, onCancel }: Props) {
  const id = useId();
  const [name, setName] = useState(initial?.name ?? '');
  const [date, setDate] = useState(initial?.date ?? '');
  const [time, setTime] = useState(initial?.time ?? '');
  const [place, setPlace] = useState<Place | null>(initial?.place ?? null);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const year = Number(date.slice(0, 4));
    if (!date || !time) return setError('Enter the date and time of birth.');
    if (!(year >= 1600 && year <= 2400)) return setError('Enter a year between 1600 and 2400.');
    if (!place) return setError('Choose a place from the list, or enter its coordinates.');
    setError(null);
    onSubmit({ name: name.trim() || 'Unnamed', date, time, place });
  };

  return (
    <form className="birth-form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor={`${id}-name`}>Name</label>
        <input id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor={`${id}-date`}>Date of birth</label>
          <input id={`${id}-date`} type="date" min="1600-01-01" max="2400-12-31" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor={`${id}-time`}>Time (local, 24h)</label>
          <input id={`${id}-time`} type="time" step={60} value={time} onChange={(e) => setTime(e.target.value)} required />
        </div>
      </div>
      <PlacePicker value={place} onChange={setPlace} />
      {error && <p className="hint error" role="alert">{error}</p>}
      <div className="actions">
        <button type="submit" className="btn primary">{submitLabel}</button>
        {onCancel && <button type="button" className="btn" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
