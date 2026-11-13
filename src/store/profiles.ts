import { BirthData } from '../engine/chart';
import { createStore } from './store';

export interface Profile extends BirthData {
  id: string;
}

const store = createStore<{ list: Profile[] }>('horo.profiles', { list: [] });

export const useProfiles = (): Profile[] => store.use().list;
export const getProfile = (id: string): Profile | undefined => store.get().list.find((p) => p.id === id);

export function saveProfile(birth: BirthData, id?: string): Profile {
  const profile: Profile = { ...birth, id: id ?? Math.random().toString(36).slice(2, 10) };
  store.set((s) => ({
    list: s.list.some((p) => p.id === profile.id)
      ? s.list.map((p) => (p.id === profile.id ? profile : p))
      : [profile, ...s.list],
  }));
  return profile;
}

export function deleteProfile(id: string): void {
  store.set((s) => ({ list: s.list.filter((p) => p.id !== id) }));
}
