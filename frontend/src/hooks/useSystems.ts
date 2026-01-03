import { useState, useEffect, useCallback } from 'react';
import { getSystems, getSystemMetrics } from '../api';
import type { System, Metric } from '../api/types';

export function useSystems() {
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSystems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSystems();
      setSystems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch systems'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  return { systems, loading, error, refetch: fetchSystems };
}

export function useSystemMetrics(
  systemId: string | null,
  options?: { hours?: number; metricType?: string }
) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!systemId) {
      setMetrics([]);
      return;
    }

    try {
      setLoading(true);
      const data = await getSystemMetrics(systemId, options);
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch metrics'));
    } finally {
      setLoading(false);
    }
  }, [systemId, options?.hours, options?.metricType]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
}
