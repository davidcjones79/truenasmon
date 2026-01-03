import { ProgressBar } from '../ui/ProgressBar';
import { formatStorage, formatPercent } from '../../utils/formatters';

interface StoragePoolBarProps {
  name: string;
  used: number;
  total: number;
}

export function StoragePoolBar({ name, used, total }: StoragePoolBarProps) {
  const percentage = total > 0 ? (used / total) * 100 : 0;

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900">{name}</span>
        <span className="text-sm text-gray-500">
          {formatStorage(used)} / {formatStorage(total)}
        </span>
      </div>
      <ProgressBar value={percentage} />
      <p className="text-xs text-gray-400 mt-1">{formatPercent(percentage)} used</p>
    </div>
  );
}
