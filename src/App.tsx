import { useEffect, useRef, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import ChartPage from './pages/ChartPage';
import Home from './pages/Home';
import MatchPage from './pages/MatchPage';
import PanchangPage from './pages/PanchangPage';
import { ChartStyle, Theme, applyTheme, updateSettings, useSettings } from './store/settings';
import { NodeType } from './engine/positions';

function Segmented<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: [T, string][]; onChange: (v: T) => void;
}) {
  return (
    <fieldset className="segmented">
      <legend>{label}</legend>
      <div>
        {options.map(([v, text]) => (
          <label key={v} className={v === value ? 'on' : ''}>
            <input type="radio" name={label} checked={v === value} onChange={() => onChange(v)} />
            {text}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SettingsMenu() {
  const settings = useSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => applyTheme(settings.theme), [settings.theme]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="settings" ref={ref}>
      <button type="button" className="btn ghost" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((o) => !o)}>
        Settings
      </button>
      {open && (
        <div className="popover" role="dialog" aria-label="Settings">
          <Segmented<ChartStyle>
            label="Chart style"
            value={settings.chartStyle}
            options={[['north', 'North'], ['south', 'South'], ['east', 'East']]}
            onChange={(chartStyle) => updateSettings({ chartStyle })}
          />
          <Segmented<NodeType>
            label="Rahu and Ketu"
            value={settings.node}
            options={[['mean', 'Mean node'], ['true', 'True node']]}
            onChange={(node) => updateSettings({ node })}
          />
          <Segmented<Theme>
            label="Theme"
            value={settings.theme}
            options={[['system', 'System'], ['light', 'Light'], ['dark', 'Dark']]}
            onChange={(theme) => updateSettings({ theme })}
          />
          <p className="hint">Lahiri ayanamsa, whole-sign houses.</p>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <>
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="Horo home">
          <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
            <path d="M16 3 29 16 16 29 3 16Z" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M3 3h26v26H3Z" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".45" />
            <circle cx="16" cy="16" r="2.6" fill="currentColor" />
          </svg>
          Horo
        </NavLink>
        <nav aria-label="Main">
          <NavLink to="/" end>Charts</NavLink>
          <NavLink to="/match">Match</NavLink>
          <NavLink to="/panchang">Panchang</NavLink>
        </nav>
        <SettingsMenu />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chart/:id" element={<ChartPage />} />
          <Route path="/match" element={<MatchPage />} />
          <Route path="/panchang" element={<PanchangPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <footer className="footer">
        Calculated in your browser. Birth details are stored only on this device.
      </footer>
    </>
  );
}
