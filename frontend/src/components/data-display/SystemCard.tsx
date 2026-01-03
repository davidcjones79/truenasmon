import { clsx } from 'clsx';
import type { System } from '../../api/types';
import { formatTimeAgo, isSystemStale } from '../../utils/formatters';

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

interface StatusDotProps {
  healthy: boolean;
}

function StatusDot({ healthy }: StatusDotProps) {
  return (
    <div className="relative flex-shrink-0">
      <div
        className={clsx(
          'w-2.5 h-2.5 rounded-full',
          healthy ? 'bg-emerald-500' : 'bg-red-500'
        )}
        style={healthy ? {
          boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
        } : {
          boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
        }}
      />
      {healthy && (
        <div
          className="absolute inset-0 rounded-full bg-emerald-500 animate-ping"
          style={{ animationDuration: '2s' }}
        />
      )}
    </div>
  );
}

interface SystemCardProps {
  system: System;
  onClick?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

export function SystemCard({ system, onClick, isFavorite = false, onToggleFavorite }: SystemCardProps) {
  const stale = isSystemStale(system.last_seen);

  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-xl p-5 relative group transition-all duration-300',
        onClick && 'cursor-pointer hover:-translate-y-1'
      )}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card-hover)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)';
      }}
    >
      {/* Gradient border on hover */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'var(--gradient-accent)',
          padding: '1px',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      {/* Favorite button */}
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(e);
          }}
          className={clsx(
            'absolute top-3 right-3 p-1.5 rounded-lg transition-all duration-200 z-10',
            isFavorite
              ? 'text-amber-500 hover:text-amber-400 hover:bg-amber-500/10'
              : 'text-gray-300 hover:text-amber-500 hover:bg-amber-500/10 opacity-0 group-hover:opacity-100'
          )}
          style={isFavorite ? {} : {}}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <StarIcon filled={isFavorite} className="w-5 h-5" />
        </button>
      )}

      <div className="flex items-center gap-3 mb-3">
        <StatusDot healthy={!stale} />
        <h3
          className="font-semibold truncate pr-8"
          style={{
            color: 'var(--color-foreground)',
            fontFamily: 'var(--font-display)',
          }}
        >
          {system.name}
        </h3>
      </div>

      <div className="space-y-1.5 text-sm">
        {system.client_name && (
          <p className="font-medium" style={{ color: 'var(--color-muted)' }}>{system.client_name}</p>
        )}
        {system.hostname && (
          <p
            className="font-mono text-xs px-2 py-0.5 rounded-md inline-block"
            style={{
              color: 'var(--color-accent-600)',
              backgroundColor: 'var(--color-accent-50)',
            }}
          >
            {system.hostname}
          </p>
        )}
        {system.version && (
          <p className="text-xs" style={{ color: 'var(--color-muted)', opacity: 0.7 }}>{system.version}</p>
        )}
      </div>

      <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between">
          <p
            className={clsx('text-xs font-medium', stale ? 'text-red-500' : '')}
            style={stale ? {} : { color: 'var(--color-muted)' }}
          >
            {stale ? 'Last seen ' : 'Active '}
            {formatTimeAgo(system.last_seen)}
          </p>
          {!stale && (
            <div
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                color: 'var(--color-status-success)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
              }}
            >
              Online
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
