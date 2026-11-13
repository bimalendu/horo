import { Place } from '../engine/chart';
import { NodeType } from '../engine/positions';
import { createStore } from './store';

export type ChartStyle = 'north' | 'south' | 'east';
export type Theme = 'system' | 'light' | 'dark';

export interface Settings {
  chartStyle: ChartStyle;
  node: NodeType;
  theme: Theme;
  lastPlace: Place | null;
}

const store = createStore<Settings>('horo.settings', {
  chartStyle: 'north',
  node: 'mean',
  theme: 'system',
  lastPlace: null,
});

export const useSettings = (): Settings => store.use();
export const getSettings = (): Settings => store.get();
export const updateSettings = (patch: Partial<Settings>): void => store.set((s) => ({ ...s, ...patch }));

export function applyTheme(theme: Theme): void {
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}
