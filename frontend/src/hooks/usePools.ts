import { useState, useEffect, useCallback } from 'react';
import { getSystemPools, getAllPools, getPoolsSummary } from '../api';
import type { PoolHealth, SystemPools, PoolsSummary } from '../api/types';

export function useSystemPools(systemId: string | null) {
  const [pools, setPools] = useState<PoolHealth[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPools = useCallback(async () => {
    if (!systemId) {
      setPools([]);
      return;
    }

    try {
      setLoading(true);
      const data = await getSystemPools(systemId);
      setPools(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch pool data'));
    } finally {
      setLoading(false);
    }
  }, [systemId]);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  return { pools, loading, error, refetch: fetchPools };
}

export function useAllPools() {
  const [systemsPools, setSystemsPools] = useState<SystemPools[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPools = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllPools();
      setSystemsPools(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch pools data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  return { systemsPools, loading, error, refetch: fetchPools };
}

export function usePoolsSummary() {
  const [summary, setSummary] = useState<PoolsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPoolsSummary();
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch pools summary'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}
