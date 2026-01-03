import { useState, useEffect, useCallback } from 'react';
import { getSystemDisks, getAllDisks, getDisksSummary } from '../api';
import type { DiskInfo, SystemDisks, DisksSummary } from '../api/types';

export function useSystemDisks(systemId: string | null, hours: number = 24) {
  const [disks, setDisks] = useState<DiskInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDisks = useCallback(async () => {
    if (!systemId) {
      setDisks([]);
      return;
    }

    try {
      setLoading(true);
      const data = await getSystemDisks(systemId, hours);
      setDisks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch disk data'));
    } finally {
      setLoading(false);
    }
  }, [systemId, hours]);

  useEffect(() => {
    fetchDisks();
  }, [fetchDisks]);

  return { disks, loading, error, refetch: fetchDisks };
}

export function useAllDisks() {
  const [systemsDisks, setSystemsDisks] = useState<SystemDisks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDisks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllDisks();
      setSystemsDisks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch disk data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisks();
  }, [fetchDisks]);

  return { systemsDisks, loading, error, refetch: fetchDisks };
}

export function useDisksSummary() {
  const [summary, setSummary] = useState<DisksSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDisksSummary();
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch disk summary'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}
