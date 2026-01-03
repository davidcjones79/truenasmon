import { clsx } from 'clsx';

type BadgeVariant = 'critical' | 'warning' | 'success' | 'info' | 'neutral';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  critical: 'bg-red-50 text-red-600 border-red-100',
  warning: 'bg-amber-50 text-amber-600 border-amber-100',
  success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  info: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  neutral: 'bg-gray-100 text-gray-600 border-gray-200',
};

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: 'critical' | 'warning' | 'info' }) {
  const labels = {
    critical: 'Critical',
    warning: 'Warning',
    info: 'Info',
  };

  const variants: Record<string, BadgeVariant> = {
    critical: 'critical',
    warning: 'warning',
    info: 'info',
  };

  return <Badge variant={variants[severity]}>{labels[severity]}</Badge>;
}
