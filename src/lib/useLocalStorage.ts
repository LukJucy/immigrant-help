import { useCallback, useEffect, useState } from "react";

/** Persist a JSON-serialisable value in localStorage, reactively. */
export function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [key, value]);

  return [value, setValue];
}

/** A localStorage-backed Set<string> with a toggle helper. */
export function useStoredSet(key: string): {
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  size: number;
} {
  const [ids, setIds] = useLocalStorage<string[]>(key, []);
  const set = new Set(ids);
  const has = useCallback((id: string) => set.has(id), [ids]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = useCallback(
    (id: string) =>
      setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    [setIds],
  );
  return { has, toggle, size: ids.length };
}
