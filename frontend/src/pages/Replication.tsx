import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout';
import { Card, CardHeader } from '../components/ui';
import { MetricCard, EmptyState } from '../components/data-display';
import { useAllReplication, useReplicationSummary } from '../hooks/useReplication';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { clsx } from 'clsx';
import { formatTimeAgo } from '../utils/formatters';

// Icons
const ReplicationIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 4) return `${(bytes / 1024 ** 4).toFixed(1)} TB`;
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function formatDuration(seconds: number): string {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
  if (seconds >= 60) {
    return `${Math.floor(seconds / 60)}m`;
  }
  return `${seconds}s`;
}

function getStatusFromValue(value: number): 'success' | 'failed' | 'running' | 'stale' {
  switch (value) {
    case 0: return 'failed';
    case 1: return 'running';
    case 2: return 'success';
    default: return 'success';
  }
}

interface ReplicationCardProps {
  taskId: string;
  systemName: string;
  systemId: string;
  attributes: Record<string, { value: number; unit: string | null; timestamp: string; metadata?: Record<string, unknown> }>;
  onClick?: () => void;
}

function ReplicationCard({ taskId, systemName, attributes, onClick }: ReplicationCardProps) {
  const statusAttr = attributes.status;
  const lastRunAttr = attributes.last_run;
  const bytesAttr = attributes.bytes;
  const durationAttr = attributes.duration;

  const status = statusAttr ? getStatusFromValue(statusAttr.value) : 'success';
  const metadata = statusAttr?.metadata as Record<string, unknown> | undefined;
  const source = metadata?.source as string | undefined;
  const destination = metadata?.destination as string | undefined;
  const schedule = metadata?.schedule as string | undefined;

  // Check if stale (last_run is Unix timestamp, check if > 24 hours ago)
  const lastRunTimestamp = lastRunAttr?.value;
  const isStale = lastRunTimestamp && (Date.now() / 1000 - lastRunTimestamp) > 24 * 3600;
  const effectiveStatus = isStale && status === 'success' ? 'stale' : status;

  const isFailed = effectiveStatus === 'failed';
  const isStaleStatus = effectiveStatus === 'stale';

  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-xl p-5 transition-all duration-150',
        onClick && 'cursor-pointer hover:shadow-md'
      )}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${isFailed ? '#ef4444' : isStaleStatus ? '#f59e0b' : 'var(--color-border)'}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isFailed ? 'bg-red-100 text-red-600' : isStaleStatus ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
            )}
          >
            <ReplicationIcon />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--color-foreground)' }}>{taskId}</h3>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{systemName}</p>
          </div>
        </div>
        <Badge variant={isFailed ? 'critical' : isStaleStatus ? 'warning' : 'success'}>
          {isFailed ? 'Failed' : isStaleStatus ? 'Stale' : 'Healthy'}
        </Badge>
      </div>

      {/* Source/Destination */}
      {source && destination && (
        <div className="mb-4 pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium truncate" style={{ color: 'var(--color-foreground)' }}>{source}</span>
            <span style={{ color: 'var(--color-muted)' }}>→</span>
            <span className="truncate" style={{ color: 'var(--color-muted)' }}>{destination}</span>
          </div>
          {schedule && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
              Schedule: {schedule}
            </p>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {/* Last Run */}
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-page-bg)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Last Run</p>
          <p className={clsx('text-sm font-medium', isStaleStatus ? 'text-amber-500' : '')} style={!isStaleStatus ? { color: 'var(--color-foreground)' } : {}}>
            {lastRunTimestamp ? formatTimeAgo(new Date(lastRunTimestamp * 1000).toISOString()) : '—'}
          </p>
        </div>

        {/* Status */}
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-page-bg)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Status</p>
          <p className={clsx(
            'text-sm font-medium',
            isFailed ? 'text-red-500' : isStaleStatus ? 'text-amber-500' : 'text-emerald-500'
          )}>
            {isFailed ? 'FAILED' : isStaleStatus ? 'STALE' : 'OK'}
          </p>
        </div>

        {/* Transfer Size */}
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-page-bg)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Last Transfer</p>
          <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
            {bytesAttr ? formatBytes(bytesAttr.value) : '—'}
          </p>
        </div>

        {/* Duration */}
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-page-bg)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Duration</p>
          <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
            {durationAttr ? formatDuration(durationAttr.value) : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Replication() {
  const navigate = useNavigate();
  const { summary, loading: summaryLoading } = useReplicationSummary();
  const { systemsReplication, loading: replicationLoading } = useAllReplication();

  // Flatten all tasks for display
  const allTasks: Array<{
    taskId: string;
    systemId: string;
    systemName: string;
    attributes: Record<string, { value: number; unit: string | null; timestamp: string; metadata?: Record<string, unknown> }>;
  }> = [];

  systemsReplication.forEach((system) => {
    Object.values(system.tasks).forEach((task) => {
      allTasks.push({
        taskId: task.task_id,
        systemId: system.system_id,
        systemName: system.system_name,
        attributes: task.attributes,
      });
    });
  });

  // Sort: failed first, then stale, then healthy
  allTasks.sort((a, b) => {
    const aStatus = a.attributes.status?.value ?? 2;
    const bStatus = b.attributes.status?.value ?? 2;
    const aLastRun = a.attributes.last_run?.value ?? Date.now() / 1000;
    const bLastRun = b.attributes.last_run?.value ?? Date.now() / 1000;

    // Failed (0) first
    if (aStatus !== bStatus) return aStatus - bStatus;
    // Then by last run (oldest first for stale detection)
    return aLastRun - bLastRun;
  });

  return (
    <div>
      <PageHeader
        title="Replication Tasks"
        description="Backup and replication monitoring across all systems"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {summaryLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <MetricCard
              label="Total Tasks"
              value={summary?.total_tasks ?? 0}
              icon={<ReplicationIcon />}
            />
            <MetricCard
              label="Healthy"
              value={summary?.healthy_tasks ?? 0}
              subValue={summary?.total_tasks ? `${Math.round((summary.healthy_tasks / summary.total_tasks) * 100)}%` : undefined}
              icon={<CheckIcon />}
            />
            <MetricCard
              label="Failed"
              value={summary?.failed_tasks ?? 0}
              trend={summary?.failed_tasks ? 'down' : 'neutral'}
              icon={<AlertIcon />}
            />
            <MetricCard
              label="Stale"
              value={summary?.stale_tasks ?? 0}
              subValue={summary?.oldest_stale ? `Oldest: ${summary.oldest_stale.hours_ago}h ago` : undefined}
              trend={summary?.stale_tasks ? 'down' : 'neutral'}
              icon={<ClockIcon />}
            />
          </>
        )}
      </div>

      {/* Tasks Grid */}
      <Card>
        <CardHeader
          title="All Replication Tasks"
          description={`${allTasks.length} tasks across ${systemsReplication.length} systems`}
        />

        {replicationLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : allTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allTasks.map((task) => (
              <ReplicationCard
                key={`${task.systemId}-${task.taskId}`}
                taskId={task.taskId}
                systemId={task.systemId}
                systemName={task.systemName}
                attributes={task.attributes}
                onClick={() => navigate(`/systems/${task.systemId}`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No replication data"
            description="Replication metrics will appear once systems start reporting backup status"
          />
        )}
      </Card>
    </div>
  );
}
