import { useState, useEffect, useCallback } from 'react';
import { getAlerts, acknowledgeAlert as apiAcknowledgeAlert } from '../api';
import type { Alert } from '../api/types';

export function useAlerts(showAcknowledged: boolean = false) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const acknowledged = showAcknowledged ? undefined : false;
      const data = await getAlerts(acknowledged);
      setAlerts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch alerts'));
    } finally {
      setLoading(false);
    }
  }, [showAcknowledged]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const acknowledgeAlert = async (alertId: number) => {
    await apiAcknowledgeAlert(alertId);
    await fetchAlerts();
  };

  return { alerts, loading, error, refetch: fetchAlerts, acknowledgeAlert };
}

export function useAlertCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const alerts = await getAlerts(false);
        setCount(alerts.filter(a => a.severity === 'critical' || a.severity === 'warning').length);
      } catch {
        setCount(0);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  return { count };
}
