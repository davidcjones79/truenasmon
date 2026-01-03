import { clsx } from 'clsx';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  onChange?: (checked: boolean) => void;
}

export function Checkbox({ label, checked, onChange, className, ...props }: CheckboxProps) {
  return (
    <label className={clsx('inline-flex items-center gap-2 cursor-pointer', className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="checkbox-accent w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-offset-0 cursor-pointer"
        {...props}
      />
      <span className="text-sm" style={{ color: 'var(--color-foreground)' }}>{label}</span>
    </label>
  );
}
