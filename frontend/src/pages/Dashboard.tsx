import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout';
import { Card, CardHeader, Button } from '../components/ui';
import { MetricCard, SystemCard, AlertRow, EmptyState } from '../components/data-display';
import { useDashboardSummary } from '../hooks/useDashboard';
import { useSystems } from '../hooks/useSystems';
import { useAlerts } from '../hooks/useAlerts';
import { useFavorites } from '../hooks/useFavorites';
import { useDisksSummary } from '../hooks/useDisks';
import { useReplicationSummary } from '../hooks/useReplication';
import { usePoolsSummary } from '../hooks/usePools';
import { SkeletonCard, Skeleton } from '../components/ui/Skeleton';

export function Dashboard() {
  const navigate = useNavigate();
  const { summary, loading: summaryLoading } = useDashboardSummary();
  const { systems, loading: systemsLoading } = useSystems();
  const { alerts, loading: alertsLoading } = useAlerts(false);
  const { favorites, toggleFavorite } = useFavorites();
  const { summary: disksSummary, loading: disksLoading } = useDisksSummary();
  const { summary: replicationSummary, loading: replicationLoading } = useReplicationSummary();
  const { summary: poolsSummary, loading: poolsLoading } = usePoolsSummary();

  const recentAlerts = alerts.slice(0, 5);

  // Separate pinned and unpinned systems
  const pinnedSystems = systems.filter((s) => favorites.includes(s.id));
  const unpinnedSystems = systems.filter((s) => !favorites.includes(s.id));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Overview of your TrueNAS fleet"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {summaryLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : summary ? (
          <>
            <div className="animate-fade-in-up stagger-1">
              <MetricCard
                label="Total Systems"
                value={summary.total_systems}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                }
              />
            </div>
            <div className="animate-fade-in-up stagger-2">
              <MetricCard
                label="Healthy"
                value={summary.healthy_systems}
                subValue={summary.stale_systems > 0 ? `${summary.stale_systems} stale` : undefined}
                trend={summary.stale_systems > 0 ? 'down' : 'neutral'}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                }
              />
            </div>
            <div className="animate-fade-in-up stagger-3">
              <MetricCard
                label="Active Alerts"
                value={summary.alerts.critical + summary.alerts.warning}
                subValue={summary.alerts.critical > 0 ? `${summary.alerts.critical} critical` : undefined}
                trend={summary.alerts.critical > 0 ? 'down' : 'neutral'}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                }
              />
            </div>
            <div className="animate-fade-in-up stagger-4">
              <MetricCard
                label="Total Storage"
                value={`${summary.total_storage_tb.toFixed(1)} TB`}
                animateValue={false}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                  </svg>
                }
              />
            </div>
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Systems */}
        <div className="lg:col-span-2 animate-fade-in-up stagger-5">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}
          >
            Systems
          </h2>
          {systemsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : systems.length > 0 ? (
            <div className="space-y-6">
              {/* Pinned Systems */}
              {pinnedSystems.length > 0 && (
                <div>
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider mb-3"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    Pinned
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pinnedSystems.map((system, index) => (
                      <div key={system.id} className={`animate-fade-in-up stagger-${index + 1}`}>
                        <SystemCard
                          system={system}
                          onClick={() => navigate(`/systems/${system.id}`)}
                          isFavorite={true}
                          onToggleFavorite={() => toggleFavorite(system.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Systems */}
              {unpinnedSystems.length > 0 && (
                <div>
                  {pinnedSystems.length > 0 && (
                    <h3
                      className="text-xs font-semibold uppercase tracking-wider mb-3"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      All Systems
                    </h3>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {unpinnedSystems.map((system, index) => (
                      <div key={system.id} className={`animate-fade-in-up stagger-${Math.min(index + 1, 8)}`}>
                        <SystemCard
                          system={system}
                          onClick={() => navigate(`/systems/${system.id}`)}
                          isFavorite={false}
                          onToggleFavorite={() => toggleFavorite(system.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card hover>
              <EmptyState
                title="No systems registered"
                description="Send data via the webhook endpoint to get started"
              />
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6 animate-fade-in-up stagger-6">
          {/* Recent Alerts */}
          <div>
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}
            >
              Recent Alerts
            </h2>
            {alertsLoading ? (
              <div className="space-y-3">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : recentAlerts.length > 0 ? (
              <div className="space-y-3">
                {recentAlerts.map((alert, index) => (
                  <div key={alert.id} className={`animate-fade-in-up stagger-${index + 1}`}>
                    <AlertRow alert={alert} compact />
                  </div>
                ))}
              </div>
            ) : (
              <Card hover>
                <EmptyState
                  title="No active alerts"
                  description="All systems are operating normally"
                />
              </Card>
            )}
          </div>

          {/* Disk Health Summary */}
          <div>
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}
            >
              Disk Health
            </h2>
            {disksLoading ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : disksSummary ? (
              <Card hover>
                <CardHeader
                  title={`${disksSummary.total_disks} Disks`}
                  action={
                    <Link to="/disks">
                      <Button variant="ghost" size="sm">View All →</Button>
                    </Link>
                  }
                />
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className="text-center p-3 rounded-xl transition-colors"
                    style={{ backgroundColor: 'var(--color-page-bg)' }}
                  >
                    <p className="text-2xl font-bold text-emerald-500" style={{ fontFamily: 'var(--font-display)' }}>
                      {disksSummary.healthy_disks}
                    </p>
                    <p className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Healthy</p>
                  </div>
                  <div
                    className="text-center p-3 rounded-xl transition-colors"
                    style={{ backgroundColor: 'var(--color-page-bg)' }}
                  >
                    <p
                      className={`text-2xl font-bold ${(disksSummary.warnings + disksSummary.critical) > 0 ? 'text-amber-500' : ''}`}
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: (disksSummary.warnings + disksSummary.critical) === 0 ? 'var(--color-foreground)' : undefined,
                      }}
                    >
                      {disksSummary.warnings + disksSummary.critical}
                    </p>
                    <p className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Issues</p>
                  </div>
                </div>
                {disksSummary.avg_temperature && (
                  <div className="mt-3 pt-3 text-sm" style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
                    Avg temp: <span className="font-medium" style={{ color: 'var(--color-foreground)' }}>{disksSummary.avg_temperature}°C</span>
                    {disksSummary.smart_failures > 0 && (
                      <span className="text-red-500 font-medium ml-3">{disksSummary.smart_failures} SMART failure{disksSummary.smart_failures !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                )}
              </Card>
            ) : (
              <Card hover>
                <EmptyState
                  title="No disk data"
                  description="Disk metrics will appear once SMART data is received"
                />
              </Card>
            )}
          </div>

          {/* Pool Health Summary */}
          <div>
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}
            >
              Pool Health
            </h2>
            {poolsLoading ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : poolsSummary ? (
              <Card hover>
                <CardHeader
                  title={`${poolsSummary.total_pools} Pools`}
                  action={
                    <Link to="/pools">
                      <Button variant="ghost" size="sm">View All →</Button>
                    </Link>
                  }
                />
                <div className="grid grid-cols-3 gap-3">
                  <div
                    className="text-center p-3 rounded-xl"
                    style={{ backgroundColor: 'var(--color-page-bg)' }}
                  >
                    <p className="text-2xl font-bold text-emerald-500" style={{ fontFamily: 'var(--font-display)' }}>
                      {poolsSummary.healthy_pools}
                    </p>
                    <p className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Healthy</p>
                  </div>
                  <div
                    className="text-center p-3 rounded-xl"
                    style={{ backgroundColor: 'var(--color-page-bg)' }}
                  >
                    <p
                      className={`text-2xl font-bold ${poolsSummary.degraded_pools > 0 ? 'text-red-500' : ''}`}
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: poolsSummary.degraded_pools === 0 ? 'var(--color-foreground)' : undefined,
                      }}
                    >
                      {poolsSummary.degraded_pools}
                    </p>
                    <p className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Degraded</p>
                  </div>
                  <div
                    className="text-center p-3 rounded-xl"
                    style={{ backgroundColor: 'var(--color-page-bg)' }}
                  >
                    <p
                      className={`text-2xl font-bold ${poolsSummary.needs_scrub > 0 ? 'text-amber-500' : ''}`}
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: poolsSummary.needs_scrub === 0 ? 'var(--color-foreground)' : undefined,
                      }}
                    >
                      {poolsSummary.needs_scrub}
                    </p>
                    <p className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Need Scrub</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 text-sm" style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
                  <span className="font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {poolsSummary.used_capacity_tb.toFixed(1)}
                  </span> / {poolsSummary.total_capacity_tb.toFixed(1)} TB used
                  {poolsSummary.active_resilvers > 0 && (
                    <span className="text-amber-500 font-medium ml-3">{poolsSummary.active_resilvers} resilver{poolsSummary.active_resilvers !== 1 ? 's' : ''} active</span>
                  )}
                </div>
              </Card>
            ) : (
              <Card hover>
                <EmptyState
                  title="No pool data"
                  description="Pool metrics will appear once ZFS data is received"
                />
              </Card>
            )}
          </div>

          {/* Replication Summary */}
          <div>
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}
            >
              Replication
            </h2>
            {replicationLoading ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : replicationSummary ? (
              <Card hover>
                <CardHeader
                  title={`${replicationSummary.total_tasks} Tasks`}
                  action={
                    <Link to="/replication">
                      <Button variant="ghost" size="sm">View All →</Button>
                    </Link>
                  }
                />
                <div className="grid grid-cols-3 gap-3">
                  <div
                    className="text-center p-3 rounded-xl"
                    style={{ backgroundColor: 'var(--color-page-bg)' }}
                  >
                    <p className="text-2xl font-bold text-emerald-500" style={{ fontFamily: 'var(--font-display)' }}>
                      {replicationSummary.healthy_tasks}
                    </p>
                    <p className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Healthy</p>
                  </div>
                  <div
                    className="text-center p-3 rounded-xl"
                    style={{ backgroundColor: 'var(--color-page-bg)' }}
                  >
                    <p
                      className={`text-2xl font-bold ${replicationSummary.failed_tasks > 0 ? 'text-red-500' : ''}`}
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: replicationSummary.failed_tasks === 0 ? 'var(--color-foreground)' : undefined,
                      }}
                    >
                      {replicationSummary.failed_tasks}
                    </p>
                    <p className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Failed</p>
                  </div>
                  <div
                    className="text-center p-3 rounded-xl"
                    style={{ backgroundColor: 'var(--color-page-bg)' }}
                  >
                    <p
                      className={`text-2xl font-bold ${replicationSummary.stale_tasks > 0 ? 'text-amber-500' : ''}`}
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: replicationSummary.stale_tasks === 0 ? 'var(--color-foreground)' : undefined,
                      }}
                    >
                      {replicationSummary.stale_tasks}
                    </p>
                    <p className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Stale</p>
                  </div>
                </div>
                {replicationSummary.oldest_stale && (
                  <div className="mt-3 pt-3 text-sm" style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
                    Oldest stale: <span className="text-amber-500 font-medium">{replicationSummary.oldest_stale.task}</span>
                    <span className="ml-1">({replicationSummary.oldest_stale.hours_ago}h ago)</span>
                  </div>
                )}
              </Card>
            ) : (
              <Card hover>
                <EmptyState
                  title="No replication data"
                  description="Replication metrics will appear once backup tasks are reported"
                />
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
