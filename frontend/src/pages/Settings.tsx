import { useState } from 'react';
import { PageHeader } from '../components/layout';
import { Card, CardHeader, Button } from '../components/ui';
import { useTheme, themeColors } from '../hooks/useTheme';
import { clsx } from 'clsx';

// Default thresholds
const DEFAULT_THRESHOLDS = {
  storageWarning: 80,
  storageCritical: 90,
  staleMinutes: 60,
  diskTempWarning: 45,
  diskTempCritical: 55,
  scrubDaysWarning: 7,
  replicationStaleHours: 24,
};

export function Settings() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const { mode, color, setMode, setColor } = useTheme();
  const [copied, setCopied] = useState(false);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [showPayload, setShowPayload] = useState(false);

  const copyEndpoint = async () => {
    await navigator.clipboard.writeText(`${apiUrl}/webhook/metrics`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleThresholdChange = (key: keyof typeof thresholds, value: number) => {
    setThresholds(prev => ({ ...prev, [key]: value }));
  };

  const samplePayload = `{
  "system": {
    "id": "truenas-001",
    "name": "TrueNAS-Acme",
    "hostname": "nas01.acme.local",
    "version": "TrueNAS-SCALE-24.04",
    "client_name": "Acme Corp"
  },
  "metrics": [
    {
      "system_id": "truenas-001",
      "metric_type": "pool",
      "metric_name": "tank_used",
      "value": 5200,
      "unit": "GB"
    },
    {
      "system_id": "truenas-001",
      "metric_type": "disk",
      "metric_name": "ada0_temperature",
      "value": 35,
      "unit": "C",
      "metadata": {
        "model": "WDC WD80EFZX",
        "serial": "WD-CA1234567"
      }
    }
  ],
  "alerts": [
    {
      "system_id": "truenas-001",
      "severity": "warning",
      "message": "Pool tank is 80% full"
    }
  ]
}`;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure integrations and thresholds"
      />

      <div className="space-y-8 max-w-2xl">
        {/* Appearance */}
        <Card>
          <CardHeader
            title="Appearance"
            description="Customize the look and feel of the application"
          />

          <div className="space-y-6">
            {/* Theme Mode */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-foreground)' }}>
                Mode
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setMode('light')}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all',
                    mode === 'light' ? 'border-2' : 'border opacity-60 hover:opacity-100'
                  )}
                  style={{
                    borderColor: mode === 'light' ? 'var(--color-accent-500)' : 'var(--color-border)',
                    backgroundColor: mode === 'light' ? 'var(--color-accent-50)' : 'var(--color-surface)',
                    color: 'var(--color-foreground)',
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                  <span className="font-medium">Light</span>
                </button>
                <button
                  onClick={() => setMode('dark')}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all',
                    mode === 'dark' ? 'border-2' : 'border opacity-60 hover:opacity-100'
                  )}
                  style={{
                    borderColor: mode === 'dark' ? 'var(--color-accent-500)' : 'var(--color-border)',
                    backgroundColor: mode === 'dark' ? 'var(--color-accent-50)' : 'var(--color-surface)',
                    color: 'var(--color-foreground)',
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  <span className="font-medium">Dark</span>
                </button>
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-foreground)' }}>
                Accent Color
              </label>
              <div className="flex gap-3">
                {themeColors.map((themeColor) => (
                  <button
                    key={themeColor.id}
                    onClick={() => setColor(themeColor.id)}
                    className={clsx(
                      'w-10 h-10 rounded-full transition-all flex items-center justify-center',
                      color === themeColor.id ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-110'
                    )}
                    style={{
                      backgroundColor: themeColor.primary,
                      ['--tw-ring-color' as string]: themeColor.primary,
                      ['--tw-ring-offset-color' as string]: 'var(--color-surface)',
                    }}
                    title={themeColor.label}
                  >
                    {color === themeColor.id && (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>
                Selected: {themeColors.find(c => c.id === color)?.label}
              </p>
            </div>
          </div>
        </Card>

        {/* Webhook Info */}
        <Card>
          <CardHeader
            title="Webhook Configuration"
            description="Configure your n8n workflow to send TrueNAS metrics to this endpoint"
          />

          <div className="space-y-4">
            {/* Endpoint */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
                Webhook Endpoint
              </label>
              <div className="flex gap-2">
                <div
                  className="flex-1 rounded-lg p-3 font-mono text-sm overflow-x-auto"
                  style={{ backgroundColor: 'var(--color-page-bg)', border: '1px solid var(--color-border)' }}
                >
                  <span style={{ color: 'var(--color-accent-600)' }}>POST</span>{' '}
                  <span style={{ color: 'var(--color-foreground)' }}>{apiUrl}/webhook/metrics</span>
                </div>
                <Button variant={copied ? 'primary' : 'secondary'} size="sm" onClick={copyEndpoint}>
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>

            {/* Metric Types */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
                Supported Metric Types
              </label>
              <div className="flex flex-wrap gap-2">
                {['pool', 'pool_health', 'disk', 'replication', 'cpu', 'memory', 'network'].map((type) => (
                  <span
                    key={type}
                    className="px-2 py-1 rounded text-xs font-mono"
                    style={{ backgroundColor: 'var(--color-accent-50)', color: 'var(--color-accent-600)' }}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            {/* Sample Payload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                  Sample Payload
                </label>
                <button
                  onClick={() => setShowPayload(!showPayload)}
                  className="text-sm"
                  style={{ color: 'var(--color-accent-600)' }}
                >
                  {showPayload ? 'Hide' : 'Show'}
                </button>
              </div>
              {showPayload && (
                <pre
                  className="rounded-lg p-4 text-xs overflow-x-auto"
                  style={{ backgroundColor: 'var(--color-page-bg)', border: '1px solid var(--color-border)', color: 'var(--color-foreground)' }}
                >
                  {samplePayload}
                </pre>
              )}
            </div>

            {/* n8n Integration Note */}
            <div
              className="rounded-lg p-4 text-sm"
              style={{ backgroundColor: 'var(--color-accent-50)', color: 'var(--color-foreground)' }}
            >
              <p className="font-medium mb-1">n8n Integration</p>
              <p style={{ color: 'var(--color-muted)' }}>
                Create an n8n workflow that collects data from TrueNAS API and sends it to this webhook.
                The workflow should run on a schedule (recommended: every 5-15 minutes).
              </p>
            </div>
          </div>
        </Card>

        {/* Alert Thresholds */}
        <Card>
          <CardHeader
            title="Alert Thresholds"
            description="Configure when alerts should be triggered"
          />

          <div className="space-y-6">
            {/* Storage Thresholds */}
            <div>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>Storage</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
                    Warning Level
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={thresholds.storageWarning}
                    onChange={(e) => handleThresholdChange('storageWarning', parseInt(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                    <span className="text-amber-500 font-medium">{thresholds.storageWarning}%</span> capacity
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
                    Critical Level
                  </label>
                  <input
                    type="range"
                    min="60"
                    max="99"
                    value={thresholds.storageCritical}
                    onChange={(e) => handleThresholdChange('storageCritical', parseInt(e.target.value))}
                    className="w-full accent-red-500"
                  />
                  <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                    <span className="text-red-500 font-medium">{thresholds.storageCritical}%</span> capacity
                  </p>
                </div>
              </div>
            </div>

            {/* Disk Temperature Thresholds */}
            <div>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>Disk Temperature</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
                    Warning Level
                  </label>
                  <input
                    type="range"
                    min="35"
                    max="60"
                    value={thresholds.diskTempWarning}
                    onChange={(e) => handleThresholdChange('diskTempWarning', parseInt(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                    <span className="text-amber-500 font-medium">{thresholds.diskTempWarning}°C</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
                    Critical Level
                  </label>
                  <input
                    type="range"
                    min="45"
                    max="70"
                    value={thresholds.diskTempCritical}
                    onChange={(e) => handleThresholdChange('diskTempCritical', parseInt(e.target.value))}
                    className="w-full accent-red-500"
                  />
                  <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                    <span className="text-red-500 font-medium">{thresholds.diskTempCritical}°C</span>
                  </p>
                </div>
              </div>
            </div>

            {/* System & Replication Thresholds */}
            <div>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>System Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
                    Stale System
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="180"
                    step="15"
                    value={thresholds.staleMinutes}
                    onChange={(e) => handleThresholdChange('staleMinutes', parseInt(e.target.value))}
                    className="w-full accent-[var(--color-accent-500)]"
                  />
                  <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                    After <span style={{ color: 'var(--color-foreground)' }} className="font-medium">{thresholds.staleMinutes} min</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
                    Scrub Overdue
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="30"
                    value={thresholds.scrubDaysWarning}
                    onChange={(e) => handleThresholdChange('scrubDaysWarning', parseInt(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                    After <span className="text-amber-500 font-medium">{thresholds.scrubDaysWarning} days</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
                    Stale Replication
                  </label>
                  <input
                    type="range"
                    min="6"
                    max="72"
                    step="6"
                    value={thresholds.replicationStaleHours}
                    onChange={(e) => handleThresholdChange('replicationStaleHours', parseInt(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                    After <span className="text-amber-500 font-medium">{thresholds.replicationStaleHours} hours</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex items-center gap-4">
            <Button>Save Thresholds</Button>
            <button
              onClick={() => setThresholds(DEFAULT_THRESHOLDS)}
              className="text-sm"
              style={{ color: 'var(--color-muted)' }}
            >
              Reset to Defaults
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
