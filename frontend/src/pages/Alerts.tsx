import { useState } from 'react';
import { Card, Checkbox, Button } from '../components/ui';
import { AlertRow, EmptyState } from '../components/data-display';
import { useAlerts } from '../hooks/useAlerts';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Skeleton } from '../components/ui/Skeleton';
import { SeverityBadge } from '../components/ui/Badge';
import { formatTimeAgo } from '../utils/formatters';
import type { Alert } from '../api/types';
import { clsx } from 'clsx';

type ViewMode = 'cards' | 'list';

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

interface AlertListRowProps {
  alert: Alert;
  onAcknowledge?: (id: number) => void;
  onCreateTicket?: (id: number) => void;
}

function AlertListRow({ alert, onAcknowledge, onCreateTicket }: AlertListRowProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0',
        alert.acknowledged && 'opacity-60'
      )}
    >
      <SeverityBadge severity={alert.severity} />
      <div className="flex-1 min-w-0">
        <span className="font-medium text-gray-900">{alert.system_name}</span>
      </div>
      <div className="hidden md:block flex-[2] min-w-0">
        <span className="text-sm text-gray-600 truncate block">{alert.message}</span>
      </div>
      <div className="hidden lg:block text-sm text-gray-400 whitespace-nowrap w-24">
        {formatTimeAgo(alert.timestamp)}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!alert.acknowledged ? (
          <>
            {onAcknowledge && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onAcknowledge(alert.id)}
              >
                Ack
              </Button>
            )}
            {onCreateTicket && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCreateTicket(alert.id)}
                className="hidden xl:inline-flex"
              >
                Ticket
              </Button>
            )}
          </>
        ) : (
          <span className="text-xs text-gray-400 whitespace-nowrap">✓ Ack'd</span>
        )}
      </div>
    </div>
  );
}

export function Alerts() {
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const { alerts, loading, acknowledgeAlert } = useAlerts(showAcknowledged);
  const { canAcknowledgeAlerts } = useAuth();
  const { showToast } = useToast();

  const handleAcknowledge = async (alertId: number) => {
    try {
      await acknowledgeAlert(alertId);
      showToast('success', 'Alert acknowledged');
    } catch {
      showToast('error', 'Failed to acknowledge alert');
    }
  };

  const handleCreateTicket = (alertId: number) => {
    // TODO: Implement ticket creation modal
    console.log('Create ticket for alert:', alertId);
  };

  // Only pass handlers if user has permission
  const acknowledgeHandler = canAcknowledgeAlerts ? handleAcknowledge : undefined;
  const ticketHandler = canAcknowledgeAlerts ? handleCreateTicket : undefined;

  const renderCardsView = () => (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <AlertRow
          key={alert.id}
          alert={alert}
          onAcknowledge={acknowledgeHandler}
          onCreateTicket={ticketHandler}
        />
      ))}
    </div>
  );

  const renderListView = () => (
    <Card className="overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div className="w-20">Severity</div>
        <div className="flex-1">System</div>
        <div className="hidden md:block flex-[2]">Message</div>
        <div className="hidden lg:block w-24">Time</div>
        <div className="w-24">Actions</div>
      </div>
      <div className="divide-y divide-gray-100">
        {alerts.map((alert) => (
          <AlertListRow
            key={alert.id}
            alert={alert}
            onAcknowledge={acknowledgeHandler}
            onCreateTicket={ticketHandler}
          />
        ))}
      </div>
    </Card>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Alerts</h1>
          <p className="text-gray-500 mt-1">
            {alerts.length} alert{alerts.length !== 1 ? 's' : ''} {showAcknowledged ? 'total' : 'active'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Checkbox
            label="Show acknowledged"
            checked={showAcknowledged}
            onChange={setShowAcknowledged}
          />

          {/* View toggle - only visible on desktop */}
          <div className="hidden lg:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Card view"
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
      </div>

      {loading ? (
        viewMode === 'cards' ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : (
          <Card>
            <div className="space-y-3 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        )
      ) : alerts.length > 0 ? (
        <>
          {/* Always show cards on mobile, respect viewMode on desktop */}
          <div className="lg:hidden">
            {renderCardsView()}
          </div>
          <div className="hidden lg:block">
            {viewMode === 'cards' ? renderCardsView() : renderListView()}
          </div>
        </>
      ) : (
        <Card>
          <EmptyState
            title={showAcknowledged ? 'No alerts' : 'No active alerts'}
            description={
              showAcknowledged
                ? 'No alerts match your filter'
                : 'All systems are operating normally'
            }
          />
        </Card>
      )}
    </div>
  );
}
