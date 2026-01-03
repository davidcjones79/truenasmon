import { useState, useEffect, useCallback } from 'react';
import { getDashboardSummary } from '../api';
import type { DashboardSummary } from '../api/types';

export function useDashboardSummary() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDashboardSummary();
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch summary'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}
