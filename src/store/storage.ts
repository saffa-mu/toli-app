import type { StateStorage } from 'zustand/middleware';

/** localStorage when it works; an in-memory map when it throws (private mode, blocked storage). */
export function safeStorage(): StateStorage {
  const memory = new Map<string, string>();
  const ls = (): Storage | undefined => {
    try {
      const s = window.localStorage;
      const probe = '__toli_probe__';
      s.setItem(probe, '1');
      s.removeItem(probe);
      return s;
    } catch {
      return undefined;
    }
  };
  const store = ls();
  return {
    getItem: (k) => {
      try {
        return store ? store.getItem(k) : (memory.get(k) ?? null);
      } catch {
        return memory.get(k) ?? null;
      }
    },
    setItem: (k, v) => {
      try {
        if (store) store.setItem(k, v);
        else memory.set(k, v);
      } catch {
        memory.set(k, v);
      }
    },
    removeItem: (k) => {
      try {
        store?.removeItem(k);
      } catch {
        // storage unavailable: memory copy is removed below
      }
      memory.delete(k);
    },
  };
}
