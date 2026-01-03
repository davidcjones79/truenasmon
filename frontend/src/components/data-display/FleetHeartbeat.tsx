import { useEffect, useState } from 'react';

interface FleetHeartbeatProps {
  systemCount: number;
  healthyCount: number;
}

export function FleetHeartbeat({ systemCount, healthyCount }: FleetHeartbeatProps) {
  const [offset, setOffset] = useState(0);
  const healthPercentage = systemCount > 0 ? (healthyCount / systemCount) * 100 : 100;

  // Animate the heartbeat line
  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Generate heartbeat path based on system health
  const generateHeartbeatPath = () => {
    const width = 400;
    const height = 32;
    const midY = height / 2;

    // More active heartbeat when systems are healthy
    const amplitude = healthPercentage > 80 ? 10 : healthPercentage > 50 ? 6 : 3;
    const frequency = healthPercentage > 80 ? 0.15 : 0.1;

    let path = `M 0 ${midY}`;

    for (let x = 0; x < width; x += 2) {
      const adjustedX = (x + offset * 4) % width;

      // Create heartbeat spikes at regular intervals
      if (adjustedX % 80 < 20) {
        const progress = (adjustedX % 80) / 20;
        const spikeY =
          progress < 0.25
            ? midY - amplitude * (progress * 4)
            : progress < 0.5
            ? midY + amplitude * 1.5 * ((progress - 0.25) * 4)
            : progress < 0.75
            ? midY + amplitude * 1.5 - amplitude * 2 * ((progress - 0.5) * 4)
            : midY - amplitude * 0.5 + amplitude * 0.5 * ((progress - 0.75) * 4);
        path += ` L ${x} ${spikeY}`;
      } else {
        // Small wave between spikes
        const wave = Math.sin(x * frequency) * 1.5;
        path += ` L ${x} ${midY + wave}`;
      }
    }

    return path;
  };

  // Color based on health
  const strokeColor =
    healthPercentage > 80
      ? '#10b981' // emerald
      : healthPercentage > 50
      ? '#f59e0b' // amber
      : '#ef4444'; // red

  const glowColor =
    healthPercentage > 80
      ? 'rgba(16, 185, 129, 0.5)'
      : healthPercentage > 50
      ? 'rgba(245, 158, 11, 0.5)'
      : 'rgba(239, 68, 68, 0.5)';

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              backgroundColor: strokeColor,
              boxShadow: `0 0 8px ${glowColor}`,
            }}
          />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-muted)' }}
          >
            Fleet Pulse
          </span>
        </div>
        <span
          className="text-xs font-mono font-medium"
          style={{ color: strokeColor }}
        >
          {healthyCount}/{systemCount} online
        </span>
      </div>

      <div className="h-8 relative">
        <svg
          className="w-full h-full"
          viewBox="0 0 400 32"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="heartbeat-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0" />
              <stop offset="20%" stopColor={strokeColor} stopOpacity="1" />
              <stop offset="80%" stopColor={strokeColor} stopOpacity="1" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Glow effect */}
          <path
            d={generateHeartbeatPath()}
            fill="none"
            stroke={glowColor}
            strokeWidth="4"
            filter="url(#glow)"
          />

          {/* Main line */}
          <path
            d={generateHeartbeatPath()}
            fill="none"
            stroke="url(#heartbeat-gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Fade edges */}
        <div
          className="absolute inset-y-0 left-0 w-8"
          style={{
            background: 'linear-gradient(to right, var(--color-surface), transparent)',
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-8"
          style={{
            background: 'linear-gradient(to left, var(--color-surface), transparent)',
          }}
        />
      </div>
    </div>
  );
}
