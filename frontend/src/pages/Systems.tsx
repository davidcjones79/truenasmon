import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui';
import { SystemCard, EmptyState } from '../components/data-display';
import { useSystems } from '../hooks/useSystems';
import { useFavorites } from '../hooks/useFavorites';
import { SkeletonCard, Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { formatTimeAgo, isSystemStale } from '../utils/formatters';
import type { System } from '../api/types';

type ViewMode = 'grid' | 'list';

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function SystemListRow({ system, onClick }: { system: System; onClick: () => void }) {
  const stale = isSystemStale(system.last_seen);

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
    >
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${stale ? 'bg-red-500' : 'bg-emerald-500'}`} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{system.name}</div>
        {system.client_name && (
          <div className="text-sm text-gray-500 truncate">{system.client_name}</div>
        )}
      </div>
      <div className="hidden md:block text-sm text-gray-500 truncate max-w-[150px]">
        {system.hostname || '—'}
      </div>
      <div className="hidden lg:block text-sm text-gray-500 truncate max-w-[120px]">
        {system.version || '—'}
      </div>
      <div className="text-sm text-gray-400 whitespace-nowrap">
        {formatTimeAgo(system.last_seen)}
      </div>
      <Badge variant={stale ? 'critical' : 'success'} className="flex-shrink-0">
        {stale ? 'Stale' : 'Active'}
      </Badge>
      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

export function Systems() {
  const navigate = useNavigate();
  const { systems, loading: systemsLoading } = useSystems();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Separate healthy and stale systems
  const healthySystems = systems.filter((s) => {
    const lastSeen = new Date(s.last_seen);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSeen >= fiveMinutesAgo;
  });

  const staleSystems = systems.filter((s) => {
    const lastSeen = new Date(s.last_seen);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSeen < fiveMinutesAgo;
  });

  const renderSystemsGrid = (systemsList: System[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {systemsList.map((system) => (
        <SystemCard
          key={system.id}
          system={system}
          onClick={() => navigate(`/systems/${system.id}`)}
          isFavorite={isFavorite(system.id)}
          onToggleFavorite={() => toggleFavorite(system.id)}
        />
      ))}
    </div>
  );

  const renderSystemsList = (systemsList: System[]) => (
    <Card className="overflow-hidden">
      <div className="divide-y divide-gray-100">
        {systemsList.map((system) => (
          <SystemListRow
            key={system.id}
            system={system}
            onClick={() => navigate(`/systems/${system.id}`)}
          />
        ))}
      </div>
    </Card>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Systems</h1>
          <p className="text-gray-500 mt-1">
            {systems.length} TrueNAS system{systems.length !== 1 ? 's' : ''} registered
          </p>
        </div>

        {/* View toggle - only visible on desktop */}
        <div className="hidden lg:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Grid view"
          >
            <GridIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title="List view"
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {systemsLoading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <Card>
            <div className="space-y-3 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </Card>
        )
      ) : systems.length === 0 ? (
        <Card>
          <EmptyState
            title="No systems registered"
            description="Send data via the webhook endpoint to get started"
          />
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Healthy Systems */}
          {healthySystems.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                Active ({healthySystems.length})
              </h2>
              {/* Always show grid on mobile, respect viewMode on desktop */}
              <div className="lg:hidden">
                {renderSystemsGrid(healthySystems)}
              </div>
              <div className="hidden lg:block">
                {viewMode === 'grid' ? renderSystemsGrid(healthySystems) : renderSystemsList(healthySystems)}
              </div>
            </div>
          )}

          {/* Stale Systems */}
          {staleSystems.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                Stale ({staleSystems.length})
              </h2>
              {/* Always show grid on mobile, respect viewMode on desktop */}
              <div className="lg:hidden">
                {renderSystemsGrid(staleSystems)}
              </div>
              <div className="hidden lg:block">
                {viewMode === 'grid' ? renderSystemsGrid(staleSystems) : renderSystemsList(staleSystems)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
