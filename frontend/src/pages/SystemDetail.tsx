import { useParams, Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout';
import { Card, CardHeader, Button } from '../components/ui';
import { EmptyState } from '../components/data-display';
import { useSystems, useSystemMetrics } from '../hooks/useSystems';
import { useAlerts } from '../hooks/useAlerts';
import { useSystemNotes } from '../hooks/useSystemNotes';
import { useFavorites } from '../hooks/useFavorites';
import { useSystemDisks } from '../hooks/useDisks';
import { useSystemReplication } from '../hooks/useReplication';
import { useSystemPools } from '../hooks/usePools';
import { formatTimeAgo, isSystemStale } from '../utils/formatters';
import { Badge, SeverityBadge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';

const StarIcon = ({ filled, className }: { filled: boolean; className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export function SystemDetail() {
  const { systemId } = useParams<{ systemId: string }>();
  const { systems, loading: systemsLoading } = useSystems();
  const { alerts } = useAlerts(true); // Include acknowledged
  const { notes, setNotes, hasNotes } = useSystemNotes(systemId || null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState('');

  const system = systems.find((s) => s.id === systemId);
  const isSystemFavorite = systemId ? isFavorite(systemId) : false;

  const handleEditNotes = () => {
    setNotesInput(notes);
    setIsEditingNotes(true);
  };

  const handleSaveNotes = () => {
    setNotes(notesInput);
    setIsEditingNotes(false);
  };

  const handleCancelNotes = () => {
    setNotesInput(notes);
    setIsEditingNotes(false);
  };

  const { metrics, loading: metricsLoading } = useSystemMetrics(
    systemId || null,
    { hours: 24, metricType: 'pool' }
  );

  const { disks, loading: disksLoading } = useSystemDisks(systemId || null);
  const { tasks: replicationTasks, loading: replicationLoading } = useSystemReplication(systemId || null);
  const { pools: poolHealthData, loading: poolsHealthLoading } = useSystemPools(systemId || null);

  // Filter alerts for this system
  const systemAlerts = alerts.filter((a) => a.system_id === systemId).slice(0, 5);

  // Process pool metrics
  const poolData = useMemo(() => {
    if (!metrics.length) return [];

    const poolMap = new Map<string, { used: number; total: number }>();

    metrics.forEach((m) => {
      const baseName = m.metric_name.replace(/_used$/, '').replace(/_total$/, '');

      if (!poolMap.has(baseName)) {
        poolMap.set(baseName, { used: 0, total: 0 });
      }

      const pool = poolMap.get(baseName)!;
      if (m.metric_name.endsWith('_used')) {
        pool.used = m.value;
      } else if (m.metric_name.endsWith('_total')) {
        pool.total = m.value;
      }
    });

    return Array.from(poolMap.entries()).map(([name, data]) => ({
      name,
      ...data,
    }));
  }, [metrics]);

  if (systemsLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!system) {
    return (
      <div>
        <PageHeader title="System Not Found" />
        <Card>
          <EmptyState
            title="System not found"
            description="The system you're looking for doesn't exist or has been removed."
            action={
              <Link to="/">
                <Button variant="secondary">Back to Dashboard</Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  const stale = isSystemStale(system.last_seen);

  return (
    <div>
      <div className="mb-8">
        <Link
          to="/"
          className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <div
            className={`w-3 h-3 rounded-full ${stale ? 'bg-red-500' : 'bg-emerald-500'}`}
          />
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--color-foreground)' }}>
            {system.name}
          </h1>
          <Badge variant={stale ? 'critical' : 'success'}>
            {stale ? 'Stale' : 'Active'}
          </Badge>
          <button
            onClick={() => systemId && toggleFavorite(systemId)}
            className={`p-1 rounded-md transition-colors ${
              isSystemFavorite
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-300 hover:text-yellow-500'
            }`}
            title={isSystemFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <StarIcon filled={isSystemFavorite} className="w-6 h-6" />
          </button>
        </div>
        {system.client_name && (
          <p className="text-gray-500 mt-1">{system.client_name}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* System Info */}
        <Card className="lg:col-span-1">
          <CardHeader title="System Information" />
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Hostname</span>
              <span className="font-mono text-sm">{system.hostname || '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Version</span>
              <span>{system.version || '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Client</span>
              <span>{system.client_name || '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Last Seen</span>
              <span className={stale ? 'text-red-500' : 'text-gray-700'}>
                {formatTimeAgo(system.last_seen)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">System ID</span>
              <span className="font-mono text-xs text-gray-400">{system.id}</span>
            </div>
          </div>
        </Card>

        {/* Storage Pools */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Storage Pools"
            action={
              <Link to="/pools">
                <Button variant="ghost" size="sm">
                  View All Pools →
                </Button>
              </Link>
            }
          />
          {metricsLoading || poolsHealthLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : poolData.length > 0 ? (
            <div className="space-y-4">
              {poolData.map((pool) => {
                // Find matching health data
                const healthData = poolHealthData.find(p => p.pool_name === pool.name);
                const state = healthData?.metrics.state?.value;
                const scrubLast = healthData?.metrics.scrub_last?.value;
                const scrubErrors = healthData?.metrics.scrub_errors?.value ?? 0;
                const checksumErrors = healthData?.metrics.checksum_errors?.value ?? 0;
                const resilverStatus = healthData?.metrics.resilver_status?.value;
                const resilverProgress = healthData?.metrics.resilver_progress?.value;

                const isDegraded = state === 0;
                const needsScrub = scrubLast && (Date.now() / 1000 - scrubLast) > 7 * 24 * 3600;
                const hasErrors = scrubErrors > 0 || checksumErrors > 0;
                const hasResiliverActive = resilverStatus === 1;
                const usedPercent = (pool.used / pool.total) * 100;
                const capacityWarning = usedPercent > 80;
                const capacityCritical = usedPercent > 90;

                return (
                  <div
                    key={pool.name}
                    className="rounded-lg p-4"
                    style={{
                      backgroundColor: 'var(--color-page-bg)',
                      border: `1px solid ${isDegraded ? '#ef4444' : needsScrub || hasErrors ? '#f59e0b' : 'var(--color-border)'}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold" style={{ color: 'var(--color-foreground)' }}>{pool.name}</h4>
                        <Badge variant={isDegraded ? 'critical' : 'success'}>
                          {isDegraded ? 'Degraded' : 'Online'}
                        </Badge>
                      </div>
                      <span className={`text-sm font-medium ${capacityCritical ? 'text-red-500' : capacityWarning ? 'text-amber-500' : ''}`} style={!capacityCritical && !capacityWarning ? { color: 'var(--color-foreground)' } : {}}>
                        {usedPercent.toFixed(1)}%
                      </span>
                    </div>

                    {/* Capacity Bar */}
                    <div className="mb-3">
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                        <div
                          className={`h-full rounded-full transition-all ${capacityCritical ? 'bg-red-500' : capacityWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(usedPercent, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                        <span>{(pool.used / 1024).toFixed(1)} TB used</span>
                        <span>{(pool.total / 1024).toFixed(1)} TB total</span>
                      </div>
                    </div>

                    {/* Health Info */}
                    {healthData && (
                      <div className="grid grid-cols-3 gap-3 text-center pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <div>
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Last Scrub</p>
                          <p className={`text-sm font-medium ${needsScrub ? 'text-amber-500' : ''}`} style={!needsScrub ? { color: 'var(--color-foreground)' } : {}}>
                            {scrubLast ? formatTimeAgo(new Date(scrubLast * 1000).toISOString()) : 'Never'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Scrub Errors</p>
                          <p className={`text-sm font-medium ${scrubErrors > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {scrubErrors}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Checksum</p>
                          <p className={`text-sm font-medium ${checksumErrors > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {checksumErrors}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Resilver Progress */}
                    {hasResiliverActive && resilverProgress !== undefined && (
                      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-amber-500">Resilver in Progress</span>
                          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{resilverProgress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                          <div
                            className="h-full rounded-full bg-amber-500"
                            style={{ width: `${resilverProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No storage metrics"
              description="Storage data will appear once metrics are received"
            />
          )}
        </Card>
      </div>

      {/* Disk Health */}
      <div className="mt-8">
        <Card>
          <CardHeader
            title="Disk Health"
            description="SMART monitoring for this system's disks"
            action={
              <Link to="/disks">
                <Button variant="ghost" size="sm">
                  View All Disks →
                </Button>
              </Link>
            }
          />
          {disksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ) : disks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {disks.map((disk) => {
                const temp = disk.metrics.temperature?.value;
                const smartStatus = disk.metrics.smart_status?.value;
                const reallocated = disk.metrics.reallocated_sectors?.value ?? 0;
                const pending = disk.metrics.pending_sectors?.value ?? 0;
                const powerHours = disk.metrics.power_hours?.value;

                const hasWarning = (temp && temp >= 45) || reallocated > 0 || pending > 0;
                const isCritical = smartStatus === 0 || (temp && temp >= 55);

                const metadata = disk.metrics.temperature?.metadata;
                const model = metadata?.model as string | undefined;

                return (
                  <div
                    key={disk.disk_id}
                    className="rounded-lg p-4"
                    style={{
                      backgroundColor: 'var(--color-page-bg)',
                      border: `1px solid ${isCritical ? '#ef4444' : hasWarning ? '#f59e0b' : 'var(--color-border)'}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>
                          {disk.disk_id}
                        </p>
                        {model && (
                          <p className="text-xs truncate max-w-[150px]" style={{ color: 'var(--color-muted)' }}>
                            {model}
                          </p>
                        )}
                      </div>
                      <Badge variant={isCritical ? 'critical' : hasWarning ? 'warning' : 'success'}>
                        {isCritical ? 'Critical' : hasWarning ? 'Warning' : 'OK'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Temp</p>
                        <p className={`text-sm font-medium ${
                          temp ? (temp >= 55 ? 'text-red-500' : temp >= 45 ? 'text-amber-500' : 'text-emerald-500') : ''
                        }`} style={!temp ? { color: 'var(--color-foreground)' } : {}}>
                          {temp ? `${temp}°C` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>SMART</p>
                        <p className={`text-sm font-medium ${smartStatus === 1 ? 'text-emerald-500' : smartStatus === 0 ? 'text-red-500' : ''}`}>
                          {smartStatus === 1 ? 'PASS' : smartStatus === 0 ? 'FAIL' : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Age</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                          {powerHours ? (powerHours >= 8760 ? `${Math.floor(powerHours / 8760)}y` : `${Math.floor(powerHours / 24)}d`) : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No disk data"
              description="Disk metrics will appear once SMART data is received"
            />
          )}
        </Card>
      </div>

      {/* Replication Tasks */}
      <div className="mt-8">
        <Card>
          <CardHeader
            title="Replication Tasks"
            description="Backup and replication status for this system"
            action={
              <Link to="/replication">
                <Button variant="ghost" size="sm">
                  View All Tasks →
                </Button>
              </Link>
            }
          />
          {replicationLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ) : replicationTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {replicationTasks.map((task) => {
                const status = task.metrics.status?.value;
                const lastRun = task.metrics.last_run?.value;
                const bytes = task.metrics.bytes?.value;
                const duration = task.metrics.duration?.value;

                const isFailed = status === 0;
                const isStale = lastRun && (Date.now() / 1000 - lastRun) > 24 * 3600;
                const effectiveStatus = isStale && status === 2 ? 'stale' : (isFailed ? 'failed' : 'success');

                const metadata = task.metrics.status?.metadata;
                const source = metadata?.source as string | undefined;

                return (
                  <div
                    key={task.task_id}
                    className="rounded-lg p-4"
                    style={{
                      backgroundColor: 'var(--color-page-bg)',
                      border: `1px solid ${isFailed ? '#ef4444' : isStale ? '#f59e0b' : 'var(--color-border)'}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>
                          {task.task_id}
                        </p>
                        {source && (
                          <p className="text-xs truncate max-w-[150px]" style={{ color: 'var(--color-muted)' }}>
                            {source}
                          </p>
                        )}
                      </div>
                      <Badge variant={effectiveStatus === 'failed' ? 'critical' : effectiveStatus === 'stale' ? 'warning' : 'success'}>
                        {effectiveStatus === 'failed' ? 'Failed' : effectiveStatus === 'stale' ? 'Stale' : 'OK'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Last Run</p>
                        <p className={`text-sm font-medium ${isStale ? 'text-amber-500' : ''}`} style={!isStale ? { color: 'var(--color-foreground)' } : {}}>
                          {lastRun ? formatTimeAgo(new Date(lastRun * 1000).toISOString()) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Size</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                          {bytes ? (bytes >= 1024**3 ? `${(bytes / 1024**3).toFixed(1)}GB` : `${(bytes / 1024**2).toFixed(0)}MB`) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Duration</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                          {duration ? (duration >= 3600 ? `${Math.floor(duration/3600)}h` : `${Math.floor(duration/60)}m`) : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No replication data"
              description="Replication metrics will appear once backup tasks are reported"
            />
          )}
        </Card>
      </div>

      {/* Notes Section */}
      <div className="mt-8">
        <Card>
          <CardHeader
            title="Notes"
            description="Add documentation or notes about this system"
            action={
              !isEditingNotes && (
                <Button variant="ghost" size="sm" onClick={handleEditNotes}>
                  {hasNotes ? 'Edit' : 'Add Note'}
                </Button>
              )
            }
          />
          {isEditingNotes ? (
            <div className="space-y-3">
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Add notes about this system... (e.g., maintenance schedule, contact info, special configurations)"
                className="input min-h-[120px] resize-y"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancelNotes}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveNotes}>
                  Save Notes
                </Button>
              </div>
            </div>
          ) : hasNotes ? (
            <div
              className="text-sm whitespace-pre-wrap"
              style={{ color: 'var(--color-foreground)' }}
            >
              {notes}
            </div>
          ) : (
            <EmptyState
              title="No notes"
              description="Click 'Add Note' to add documentation for this system"
            />
          )}
        </Card>
      </div>

      {/* Recent Alerts */}
      <div className="mt-8">
        <Card>
          <CardHeader
            title="Recent Alerts"
            description="Alerts from this system"
            action={
              <Link to={`/alerts?system=${systemId}`}>
                <Button variant="ghost" size="sm">
                  View All →
                </Button>
              </Link>
            }
          />
          {systemAlerts.length > 0 ? (
            <div className="space-y-3">
              {systemAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
                >
                  <SeverityBadge severity={alert.severity} />
                  <span className="flex-1 text-sm text-gray-700 truncate">
                    {alert.message}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTimeAgo(alert.timestamp)}
                  </span>
                  {alert.acknowledged && (
                    <span className="text-xs text-gray-400">✓</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No alerts"
              description="This system has no recent alerts"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
