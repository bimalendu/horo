import { useSyncExternalStore } from 'react';

/** A small localStorage-backed store. Falls back to memory if storage is unavailable. */
export function createStore<T>(key: string, initial: T) {
  let value = initial;
  try {
    const raw = localStorage.getItem(key);
    if (raw) value = { ...initial, ...JSON.parse(raw) } as T;
  } catch {
    /* keep the initial value */
  }
  const listeners = new Set<() => void>();

  const get = () => value;
  const set = (next: T | ((prev: T) => T)) => {
    value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or blocked: state still lives in memory */
    }
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  const use = () => useSyncExternalStore(subscribe, get, get);
  return { get, set, use };
}
