import { Link, useNavigate } from 'react-router-dom';
import BirthForm from '../components/BirthForm';
import { longDate } from '../lib/format';
import { deleteProfile, saveProfile, useProfiles } from '../store/profiles';
import { updateSettings } from '../store/settings';

export default function Home() {
  const profiles = useProfiles();
  const navigate = useNavigate();

  return (
    <div className="home">
      <section className="hero">
        <h1>Cast a Vedic horoscope</h1>
        <p>
          Enter a birth date, time and place to get the rasi and divisional charts, Vimshottari dasha,
          a written reading, kundli matching and the daily panchang.
        </p>
      </section>
      <div className="home-grid">
        <section className="card">
          <h2>New chart</h2>
          <BirthForm
            onSubmit={(birth) => {
              const p = saveProfile(birth);
              updateSettings({ lastPlace: birth.place });
              navigate(`/chart/${p.id}`);
            }}
          />
        </section>
        <section className="card">
          <h2>Saved charts</h2>
          {profiles.length === 0 ? (
            <p className="muted">Charts you cast appear here, saved in this browser only.</p>
          ) : (
            <ul className="profile-list">
              {profiles.map((p) => (
                <li key={p.id}>
                  <Link to={`/chart/${p.id}`}>
                    <strong>{p.name}</strong>
                    <span>{longDate(p.date)}, {p.time} · {p.place.name}</span>
                  </Link>
                  <button
                    type="button"
                    className="btn ghost small"
                    aria-label={`Delete ${p.name}`}
                    onClick={() => {
                      if (confirm(`Delete the chart for ${p.name}?`)) deleteProfile(p.id);
                    }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
