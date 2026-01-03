import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  gradient?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ children, className, padding = 'md', hover = false, gradient = false }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl',
        paddingClasses[padding],
        hover && 'transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
        gradient && 'card-gradient-border',
        className
      )}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: gradient ? 'none' : '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-base font-semibold" style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}>{title}</h3>
        {description && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
