"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { friendlyError } from "./errors";

/** Loads data on mount (and when `deps` change); exposes reload + loading/error states. */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(loader);
  const seq = useRef(0);

  // Always call the latest loader without re-running the effect on every render.
  useLayoutEffect(() => {
    loaderRef.current = loader;
  });

  const reload = useCallback(async () => {
    const id = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const res = await loaderRef.current();
      if (id === seq.current) setData(res);
    } catch (e) {
      if (id === seq.current) setError(friendlyError(e));
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetching on mount / when inputs change is the purpose of this hook.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, reload, setData };
}

export function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
