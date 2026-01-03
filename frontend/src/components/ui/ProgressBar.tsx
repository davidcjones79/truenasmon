import { clsx } from 'clsx';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  // Color based on percentage - returns style object for dynamic accent color
  const getBarStyle = (): React.CSSProperties => {
    if (percentage >= 90) return { backgroundColor: '#ef4444' }; // red-500
    if (percentage >= 80) return { backgroundColor: '#f59e0b' }; // amber-500
    return { backgroundColor: 'var(--color-accent-500)' };
  };

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={clsx('w-full', className)}>
      <div className={clsx('w-full bg-gray-100 rounded-full overflow-hidden', sizeClasses[size])} style={{ backgroundColor: 'var(--color-border)' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%`, ...getBarStyle() }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</p>
      )}
    </div>
  );
}
