import { useState, useEffect, useCallback } from 'react';
import { getSystemReplication, getAllReplication, getReplicationSummary } from '../api';
import type { ReplicationTask, SystemReplications, ReplicationSummary } from '../api/types';

export function useSystemReplication(systemId: string | null, hours: number = 24) {
  const [tasks, setTasks] = useState<ReplicationTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!systemId) {
      setTasks([]);
      return;
    }

    try {
      setLoading(true);
      const data = await getSystemReplication(systemId, hours);
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch replication data'));
    } finally {
      setLoading(false);
    }
  }, [systemId, hours]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { tasks, loading, error, refetch: fetchTasks };
}

export function useAllReplication() {
  const [systemsReplication, setSystemsReplication] = useState<SystemReplications[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReplication = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllReplication();
      setSystemsReplication(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch replication data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReplication();
  }, [fetchReplication]);

  return { systemsReplication, loading, error, refetch: fetchReplication };
}

export function useReplicationSummary() {
  const [summary, setSummary] = useState<ReplicationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getReplicationSummary();
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch replication summary'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}
