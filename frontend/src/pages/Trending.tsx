import { useState, useMemo } from 'react';
import { PageHeader } from '../components/layout';
import { Card, CardHeader, Select } from '../components/ui';
import { LineChart } from '../components/charts';
import { EmptyState } from '../components/data-display';
import { useSystems, useSystemMetrics } from '../hooks/useSystems';
import { Skeleton } from '../components/ui/Skeleton';

const timeRangeOptions = [
  { value: '6', label: 'Last 6 hours' },
  { value: '24', label: 'Last 24 hours' },
  { value: '72', label: 'Last 3 days' },
  { value: '168', label: 'Last 7 days' },
];

const colors = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export function Trending() {
  const { systems, loading: systemsLoading } = useSystems();
  const [selectedSystemId, setSelectedSystemId] = useState<string>('');
  const [hours, setHours] = useState('24');

  const { metrics, loading: metricsLoading } = useSystemMetrics(
    selectedSystemId || null,
    { hours: parseInt(hours), metricType: 'pool' }
  );

  // Auto-select first system
  if (!selectedSystemId && systems.length > 0) {
    setSelectedSystemId(systems[0].id);
  }

  // Process metrics for chart
  const chartData = useMemo(() => {
    if (!metrics.length) return { data: [], lines: [] };

    // Filter to _used metrics only
    const usedMetrics = metrics.filter((m) => m.metric_name.endsWith('_used'));

    // Group by timestamp
    interface DataPoint {
      timestamp: string;
      [key: string]: string | number;
    }
    const timeMap = new Map<string, DataPoint>();
    const poolNames = new Set<string>();

    usedMetrics.forEach((m) => {
      if (!timeMap.has(m.timestamp)) {
        timeMap.set(m.timestamp, { timestamp: m.timestamp });
      }
      const poolName = m.metric_name.replace('_used', '');
      poolNames.add(poolName);
      timeMap.get(m.timestamp)![poolName] = m.value;
    });

    const data = Array.from(timeMap.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const lines = Array.from(poolNames).map((name, i) => ({
      key: name,
      name: `${name} (GB)`,
      color: colors[i % colors.length],
    }));

    return { data, lines };
  }, [metrics]);

  const systemOptions = systems.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  return (
    <div>
      <PageHeader
        title="Trending"
        description="Storage usage trends and capacity planning"
      />

      {systemsLoading ? (
        <Skeleton className="h-10 w-64 mb-8" />
      ) : systems.length === 0 ? (
        <Card>
          <EmptyState
            title="No systems registered"
            description="Send data via the webhook endpoint to get started"
          />
        </Card>
      ) : (
        <>
          <div className="flex gap-4 mb-8">
            <div className="w-64">
              <Select
                options={systemOptions}
                value={selectedSystemId}
                onChange={setSelectedSystemId}
                placeholder="Select a system"
              />
            </div>
            <div className="w-48">
              <Select
                options={timeRangeOptions}
                value={hours}
                onChange={setHours}
              />
            </div>
          </div>

          <Card>
            <CardHeader title="Storage Usage Over Time" />
            {metricsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : chartData.data.length > 0 ? (
              <LineChart
                data={chartData.data as Array<{ timestamp: string; [key: string]: string | number }>}
                lines={chartData.lines}
                height={300}
              />
            ) : (
              <EmptyState
                title="No data available"
                description="Select a different time range or wait for metrics to be collected"
              />
            )}
          </Card>

          <Card className="mt-8">
            <CardHeader title="Capacity Projection" />
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">
                With more historical data, this section will show predicted time to full capacity based on growth trends.
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
