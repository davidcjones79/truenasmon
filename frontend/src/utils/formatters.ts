import { formatDistanceToNow, parseISO } from 'date-fns';

export function formatTimeAgo(isoString: string): string {
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

export function formatStorage(gb: number): string {
  if (gb >= 1000) {
    return `${(gb / 1000).toFixed(1)} TB`;
  }
  return `${gb.toFixed(1)} GB`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

export function isSystemStale(lastSeen: string, thresholdMinutes: number = 60): boolean {
  try {
    const lastSeenDate = parseISO(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    return diffMinutes > thresholdMinutes;
  } catch {
    return true;
  }
}
