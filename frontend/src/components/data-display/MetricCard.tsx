import { clsx } from 'clsx';
import { useEffect, useState, useRef } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  animateValue?: boolean;
}

function useAnimatedNumber(value: number, duration: number = 800): number {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const current = startValue + (endValue - startValue) * easeOut;
      setDisplayValue(Math.round(current));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return displayValue;
}

export function MetricCard({
  label,
  value,
  subValue,
  trend,
  trendLabel,
  icon,
  className,
  animateValue = true,
}: MetricCardProps) {
  const isNumeric = typeof value === 'number';
  const animatedValue = useAnimatedNumber(isNumeric ? value : 0);
  const displayValue = isNumeric && animateValue ? animatedValue : value;

  const trendColors = {
    up: 'text-emerald-500',
    down: 'text-red-500',
    neutral: '',
  };

  const trendIcons = {
    up: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    ),
    down: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    ),
    neutral: null,
  };

  return (
    <div
      className={clsx(
        'rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group',
        className
      )}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-muted)' }}
          >
            {label}
          </p>
          <p
            className="mt-3 text-4xl font-bold tracking-tight metric-value"
            style={{
              color: 'var(--color-foreground)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {displayValue}
          </p>
          {subValue && (
            <p
              className="mt-1.5 text-sm font-medium"
              style={{ color: trend === 'down' ? 'var(--color-status-critical)' : 'var(--color-muted)' }}
            >
              {subValue}
            </p>
          )}
          {trend && trendLabel && (
            <div
              className={clsx(
                'mt-3 flex items-center gap-1.5 text-sm font-medium',
                trendColors[trend]
              )}
              style={trend === 'neutral' ? { color: 'var(--color-muted)' } : {}}
            >
              {trendIcons[trend]}
              <span>{trendLabel}</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            style={{
              background: 'var(--gradient-accent)',
              color: 'white',
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
