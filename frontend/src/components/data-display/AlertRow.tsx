import type { Alert } from '../../api/types';
import { formatTimeAgo } from '../../utils/formatters';
import { SeverityBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { clsx } from 'clsx';

interface AlertRowProps {
  alert: Alert;
  onAcknowledge?: (id: number) => void;
  onCreateTicket?: (id: number) => void;
  compact?: boolean;
}

export function AlertRow({ alert, onAcknowledge, onCreateTicket, compact = false }: AlertRowProps) {
  return (
    <div
      className={clsx(
        'rounded-lg transition-all duration-150',
        compact ? 'p-3' : 'p-4',
        alert.acknowledged && 'opacity-60'
      )}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-start gap-4">
        <SeverityBadge severity={alert.severity} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium" style={{ color: 'var(--color-foreground)' }}>{alert.system_name}</span>
            {alert.ticket_id && (
              <span className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>{alert.ticket_id}</span>
            )}
          </div>
          <p className={clsx(compact ? 'text-sm line-clamp-1' : 'text-sm')} style={{ color: 'var(--color-muted)' }}>
            {alert.message}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)', opacity: 0.7 }}>
            {formatTimeAgo(alert.timestamp)}
          </p>
        </div>

        {!compact && !alert.acknowledged && (
          <div className="flex items-center gap-2 shrink-0">
            {onAcknowledge && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onAcknowledge(alert.id)}
              >
                Acknowledge
              </Button>
            )}
            {onCreateTicket && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCreateTicket(alert.id)}
              >
                Create Ticket
              </Button>
            )}
          </div>
        )}

        {!compact && alert.acknowledged && (
          <span className="text-xs shrink-0" style={{ color: 'var(--color-muted)' }}>✓ Acknowledged</span>
        )}
      </div>
    </div>
  );
}
