import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout';
import { Card, CardHeader } from '../components/ui';
import { MetricCard, EmptyState } from '../components/data-display';
import { useAllPools, usePoolsSummary } from '../hooks/usePools';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { clsx } from 'clsx';
import { formatTimeAgo } from '../utils/formatters';

// Icons
const PoolIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
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

const ScrubIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 12a9 9 0 11-6.219-8.56" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ResiliverIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const StorageIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" />
    <line x1="6" y1="18" x2="6.01" y2="18" />
  </svg>
);

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

interface PoolCardProps {
  poolName: string;
  systemName: string;
  systemId: string;
  attributes: Record<string, { value: number; unit: string | null; timestamp: string; metadata?: Record<string, unknown> }>;
  onClick?: () => void;
}

function PoolCard({ poolName, systemName, attributes, onClick }: PoolCardProps) {
  const usedAttr = attributes.used;
  const totalAttr = attributes.total;
  const stateAttr = attributes.state;
  const scrubLastAttr = attributes.scrub_last;
  const scrubDurationAttr = attributes.scrub_duration;
  const scrubErrorsAttr = attributes.scrub_errors;
  const checksumErrorsAttr = attributes.checksum_errors;
  const resilverStatusAttr = attributes.resilver_status;
  const resilverProgressAttr = attributes.resilver_progress;

  const usedGB = usedAttr?.value ?? 0;
  const totalGB = totalAttr?.value ?? 1;
  const usedPercent = (usedGB / totalGB) * 100;

  const isOnline = stateAttr?.value === 1;
  const isDegraded = stateAttr?.value === 0;
  const hasResiliverActive = resilverStatusAttr?.value === 1;

  // Check if needs scrub (>7 days since last scrub)
  const lastScrubTimestamp = scrubLastAttr?.value;
  const needsScrub = lastScrubTimestamp && (Date.now() / 1000 - lastScrubTimestamp) > 7 * 24 * 3600;

  const hasCritical = isDegraded;
  const hasWarning = needsScrub || (usedPercent > 80);

  // Calculate capacity status
  const capacityCritical = usedPercent > 90;
  const capacityWarning = usedPercent > 80;

  const scrubErrors = scrubErrorsAttr?.value ?? 0;
  const checksumErrors = checksumErrorsAttr?.value ?? 0;
  const hasErrors = scrubErrors > 0 || checksumErrors > 0;

  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-xl p-5 transition-all duration-150',
        onClick && 'cursor-pointer hover:shadow-md'
      )}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${hasCritical ? '#ef4444' : hasWarning ? '#f59e0b' : 'var(--color-border)'}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isDegraded ? 'bg-red-100 text-red-600' : hasWarning ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
            )}
          >
            <PoolIcon />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--color-foreground)' }}>{poolName}</h3>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{systemName}</p>
          </div>
        </div>
        <Badge variant={isDegraded ? 'critical' : isOnline ? 'success' : 'warning'}>
          {isDegraded ? 'Degraded' : isOnline ? 'Online' : 'Unknown'}
        </Badge>
      </div>

      {/* Capacity Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Capacity</span>
          <span className={clsx(
            'text-xs font-medium',
            capacityCritical ? 'text-red-500' : capacityWarning ? 'text-amber-500' : ''
          )} style={!capacityCritical && !capacityWarning ? { color: 'var(--color-foreground)' } : {}}>
            {usedPercent.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-page-bg)' }}>
          <div
            className={clsx(
              'h-full rounded-full transition-all',
              capacityCritical ? 'bg-red-500' : capacityWarning ? 'bg-amber-500' : 'bg-emerald-500'
            )}
            style={{ width: `${Math.min(usedPercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
            {(usedGB / 1024).toFixed(1)} TB used
          </span>
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
            {(totalGB / 1024).toFixed(1)} TB total
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Last Scrub */}
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-page-bg)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Last Scrub</p>
          <p className={clsx('text-sm font-medium', needsScrub ? 'text-amber-500' : '')} style={!needsScrub ? { color: 'var(--color-foreground)' } : {}}>
            {lastScrubTimestamp ? formatTimeAgo(new Date(lastScrubTimestamp * 1000).toISOString()) : 'Never'}
          </p>
        </div>

        {/* Scrub Duration */}
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-page-bg)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Scrub Duration</p>
          <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
            {scrubDurationAttr ? formatDuration(scrubDurationAttr.value) : '—'}
          </p>
        </div>

        {/* Scrub Errors */}
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-page-bg)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Scrub Errors</p>
          <p className={clsx('text-sm font-medium', scrubErrors > 0 ? 'text-red-500' : '')} style={scrubErrors === 0 ? { color: 'var(--color-foreground)' } : {}}>
            {scrubErrors}
          </p>
        </div>

        {/* Checksum Errors */}
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-page-bg)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Checksum Errors</p>
          <p className={clsx('text-sm font-medium', checksumErrors > 0 ? 'text-red-500' : '')} style={checksumErrors === 0 ? { color: 'var(--color-foreground)' } : {}}>
            {checksumErrors}
          </p>
        </div>
      </div>

      {/* Resilver Progress (if active) */}
      {hasResiliverActive && resilverProgressAttr && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <ResiliverIcon />
            <span className="text-sm font-medium text-amber-500">Resilver in Progress</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-page-bg)' }}>
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${resilverProgressAttr.value}%` }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
            {resilverProgressAttr.value.toFixed(0)}% complete
          </p>
        </div>
      )}

      {/* Warnings */}
      {(needsScrub || hasErrors) && !hasResiliverActive && (
        <div className="mt-3 pt-3 space-y-1" style={{ borderTop: '1px solid var(--color-border)' }}>
          {needsScrub && (
            <p className="text-xs text-amber-500">Scrub overdue ({'>'} 7 days)</p>
          )}
          {hasErrors && (
            <p className="text-xs text-red-500">Errors detected - check ZFS health</p>
          )}
        </div>
      )}
    </div>
  );
}

export function Pools() {
  const navigate = useNavigate();
  const { summary, loading: summaryLoading } = usePoolsSummary();
  const { systemsPools, loading: poolsLoading } = useAllPools();

  // Flatten all pools for display
  const allPools: Array<{
    poolName: string;
    systemId: string;
    systemName: string;
    attributes: Record<string, { value: number; unit: string | null; timestamp: string; metadata?: Record<string, unknown> }>;
  }> = [];

  systemsPools.forEach((system) => {
    Object.values(system.pools).forEach((pool) => {
      allPools.push({
        poolName: pool.pool_name,
        systemId: system.system_id,
        systemName: system.system_name,
        attributes: pool.attributes,
      });
    });
  });

  // Sort: degraded first, then needs scrub, then by capacity (highest first)
  allPools.sort((a, b) => {
    const aState = a.attributes.state?.value ?? 1;
    const bState = b.attributes.state?.value ?? 1;

    // Degraded (0) first
    if (aState !== bState) return aState - bState;

    // Then by capacity usage (highest first)
    const aUsed = a.attributes.used?.value ?? 0;
    const aTotal = a.attributes.total?.value ?? 1;
    const bUsed = b.attributes.used?.value ?? 0;
    const bTotal = b.attributes.total?.value ?? 1;

    return (bUsed / bTotal) - (aUsed / aTotal);
  });

  return (
    <div>
      <PageHeader
        title="Pool Health"
        description="ZFS pool monitoring across all systems"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
        {summaryLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <MetricCard
              label="Total Pools"
              value={summary?.total_pools ?? 0}
              icon={<PoolIcon />}
            />
            <MetricCard
              label="Healthy"
              value={summary?.healthy_pools ?? 0}
              subValue={summary?.total_pools ? `${Math.round((summary.healthy_pools / summary.total_pools) * 100)}%` : undefined}
              icon={<CheckIcon />}
            />
            <MetricCard
              label="Degraded"
              value={summary?.degraded_pools ?? 0}
              trend={summary?.degraded_pools ? 'down' : 'neutral'}
              icon={<AlertIcon />}
            />
            <MetricCard
              label="Needs Scrub"
              value={summary?.needs_scrub ?? 0}
              subValue=">7 days"
              trend={summary?.needs_scrub ? 'down' : 'neutral'}
              icon={<ScrubIcon />}
            />
            <MetricCard
              label="Active Resilvers"
              value={summary?.active_resilvers ?? 0}
              trend={summary?.active_resilvers ? 'down' : 'neutral'}
              icon={<ResiliverIcon />}
            />
            <MetricCard
              label="Capacity Warnings"
              value={summary?.capacity_warnings ?? 0}
              subValue=">80% used"
              trend={summary?.capacity_warnings ? 'down' : 'neutral'}
              icon={<StorageIcon />}
            />
          </>
        )}
      </div>

      {/* Capacity Overview */}
      {!summaryLoading && summary && (
        <Card className="mb-8">
          <CardHeader title="Fleet Storage Overview" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between mb-2">
                <span style={{ color: 'var(--color-muted)' }}>Total Capacity</span>
                <span className="font-semibold" style={{ color: 'var(--color-foreground)' }}>{summary.total_capacity_tb.toFixed(1)} TB</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-page-bg)' }}>
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${(summary.used_capacity_tb / summary.total_capacity_tb) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                <span>{summary.used_capacity_tb.toFixed(1)} TB used</span>
                <span>{(summary.total_capacity_tb - summary.used_capacity_tb).toFixed(1)} TB free</span>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                  {((summary.used_capacity_tb / summary.total_capacity_tb) * 100).toFixed(1)}%
                </p>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Fleet utilization</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Pools Grid */}
      <Card>
        <CardHeader
          title="All Storage Pools"
          description={`${allPools.length} pools across ${systemsPools.length} systems`}
        />

        {poolsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : allPools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allPools.map((pool) => (
              <PoolCard
                key={`${pool.systemId}-${pool.poolName}`}
                poolName={pool.poolName}
                systemId={pool.systemId}
                systemName={pool.systemName}
                attributes={pool.attributes}
                onClick={() => navigate(`/systems/${pool.systemId}`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No pool data"
            description="Pool metrics will appear once systems start reporting ZFS health"
          />
        )}
      </Card>
    </div>
  );
}
