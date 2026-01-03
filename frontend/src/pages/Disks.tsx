import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout';
import { Card, CardHeader } from '../components/ui';
import { MetricCard, EmptyState } from '../components/data-display';
import { useAllDisks, useDisksSummary } from '../hooks/useDisks';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { clsx } from 'clsx';

// Icons
const DiskIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <circle cx="12" cy="12" r="3" />
    <line x1="4" y1="8" x2="8" y2="8" />
  </svg>
);

const ThermometerIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function getTemperatureColor(temp: number): string {
  if (temp >= 55) return 'text-red-500';
  if (temp >= 45) return 'text-amber-500';
  return 'text-emerald-500';
}

function formatPowerHours(hours: number): string {
  const years = Math.floor(hours / 8760);
  const months = Math.floor((hours % 8760) / 730);
  if (years > 0) {
    return `${years}y ${months}m`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface DiskCardProps {
  diskId: string;
  systemName: string;
  systemId: string;
  attributes: Record<string, { value: number; unit: string | null; metadata?: Record<string, unknown> }>;
  onClick?: () => void;
}

function DiskCard({ diskId, systemName, attributes, onClick }: DiskCardProps) {
  const temp = attributes.temperature?.value;
  const smartStatus = attributes.smart_status?.value;
  const powerHours = attributes.power_hours?.value;
  const reallocated = attributes.reallocated_sectors?.value ?? 0;
  const pending = attributes.pending_sectors?.value ?? 0;

  const metadata = attributes.temperature?.metadata as Record<string, unknown> | undefined;
  const model = metadata?.model as string | undefined;
  const diskType = metadata?.type as string | undefined;
  const sizeTb = metadata?.size_tb as number | undefined;

  const hasWarning = (temp && temp >= 45) || reallocated > 0 || pending > 0;
  const isCritical = smartStatus === 0 || (temp && temp >= 55);

  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-xl p-5 transition-all duration-150',
        onClick && 'cursor-pointer hover:shadow-md'
      )}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${isCritical ? '#ef4444' : hasWarning ? '#f59e0b' : 'var(--color-border)'}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isCritical ? 'bg-red-100 text-red-600' : hasWarning ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
            )}
          >
            <DiskIcon />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--color-foreground)' }}>{diskId}</h3>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{systemName}</p>
          </div>
        </div>
        <Badge variant={isCritical ? 'critical' : hasWarning ? 'warning' : 'success'}>
          {isCritical ? 'Critical' : hasWarning ? 'Warning' : 'Healthy'}
        </Badge>
      </div>

      {/* Model info */}
      {model && (
        <div className="mb-4 pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <p className="text-sm font-medium truncate" style={{ color: 'var(--color-foreground)' }}>{model}</p>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            {diskType} {sizeTb && `- ${sizeTb >= 1 ? `${sizeTb} TB` : `${sizeTb * 1000} GB`}`}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {/* Temperature */}
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-page-bg)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Temperature</p>
          <p className={clsx('text-lg font-semibold', temp ? getTemperatureColor(temp) : '')}>
            {temp ? `${temp}°C` : '—'}
          </p>
        </div>

        {/* SMART Status */}
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-page-bg)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>SMART</p>
          <div className="flex items-center gap-1">
            {smartStatus === 1 ? (
              <span className="text-emerald-500 flex items-center gap-1">
                <CheckIcon /> PASS
              </span>
            ) : smartStatus === 0 ? (
              <span className="text-red-500 font-semibold">FAIL</span>
            ) : (
              <span style={{ color: 'var(--color-muted)' }}>—</span>
            )}
          </div>
        </div>

        {/* Power Hours */}
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-page-bg)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Power On</p>
          <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
            {powerHours ? formatPowerHours(powerHours) : '—'}
          </p>
        </div>

        {/* Reallocated Sectors */}
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-page-bg)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Reallocated</p>
          <p className={clsx('text-sm font-medium', reallocated > 0 ? 'text-amber-500' : '')} style={reallocated === 0 ? { color: 'var(--color-foreground)' } : {}}>
            {reallocated} sectors
          </p>
        </div>
      </div>
    </div>
  );
}

export function Disks() {
  const navigate = useNavigate();
  const { summary, loading: summaryLoading } = useDisksSummary();
  const { systemsDisks, loading: disksLoading } = useAllDisks();

  // Flatten all disks for display
  const allDisks: Array<{
    diskId: string;
    systemId: string;
    systemName: string;
    attributes: Record<string, { value: number; unit: string | null; metadata?: Record<string, unknown> }>;
  }> = [];

  systemsDisks.forEach((system) => {
    Object.values(system.disks).forEach((disk) => {
      allDisks.push({
        diskId: disk.disk_id,
        systemId: system.system_id,
        systemName: system.system_name,
        attributes: disk.attributes,
      });
    });
  });

  // Sort: critical first, then warnings, then healthy
  allDisks.sort((a, b) => {
    const aStatus = a.attributes.smart_status?.value ?? 1;
    const bStatus = b.attributes.smart_status?.value ?? 1;
    const aTemp = a.attributes.temperature?.value ?? 0;
    const bTemp = b.attributes.temperature?.value ?? 0;

    // SMART failures first
    if (aStatus !== bStatus) return aStatus - bStatus;
    // Then by temperature (hottest first)
    return bTemp - aTemp;
  });

  return (
    <div>
      <PageHeader
        title="Disk Health"
        description="SMART monitoring across all systems"
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
              label="Total Disks"
              value={summary?.total_disks ?? 0}
              icon={<DiskIcon />}
            />
            <MetricCard
              label="Healthy"
              value={summary?.healthy_disks ?? 0}
              subValue={summary?.total_disks ? `${Math.round((summary.healthy_disks / summary.total_disks) * 100)}%` : undefined}
              icon={<CheckIcon />}
            />
            <MetricCard
              label="Avg Temperature"
              value={summary?.avg_temperature ? `${summary.avg_temperature}°C` : '—'}
              subValue={summary?.hottest_disk ? `Hottest: ${summary.hottest_disk.disk} (${summary.hottest_disk.temperature}°C)` : undefined}
              icon={<ThermometerIcon />}
            />
            <MetricCard
              label="Issues"
              value={(summary?.warnings ?? 0) + (summary?.critical ?? 0)}
              subValue={summary?.smart_failures ? `${summary.smart_failures} SMART failures` : undefined}
              trend={summary?.critical ? 'down' : 'neutral'}
              icon={<AlertIcon />}
            />
          </>
        )}
      </div>

      {/* Disks Grid */}
      <Card>
        <CardHeader
          title="All Disks"
          description={`${allDisks.length} disks across ${systemsDisks.length} systems`}
        />

        {disksLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : allDisks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allDisks.map((disk) => (
              <DiskCard
                key={`${disk.systemId}-${disk.diskId}`}
                diskId={disk.diskId}
                systemId={disk.systemId}
                systemName={disk.systemName}
                attributes={disk.attributes}
                onClick={() => navigate(`/systems/${disk.systemId}`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No disk data"
            description="Disk metrics will appear once systems start reporting SMART data"
          />
        )}
      </Card>
    </div>
  );
}
