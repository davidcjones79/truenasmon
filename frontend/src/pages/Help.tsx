import { useState } from 'react';
import { PageHeader } from '../components/layout';
import { Card, Button } from '../components/ui';

// Chevron icon component
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-5 h-5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// Section component for cleaner accordion
interface SectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, icon, description, expanded, onToggle, children }: SectionProps) {
  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left transition-colors hover:bg-[var(--color-page-bg)]"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--color-accent-50)', color: 'var(--color-accent-600)' }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold" style={{ color: 'var(--color-foreground)' }}>{title}</h3>
          <p className="text-sm truncate" style={{ color: 'var(--color-muted)' }}>{description}</p>
        </div>
        <div style={{ color: 'var(--color-muted)' }}>
          <ChevronIcon expanded={expanded} />
        </div>
      </button>
      <div
        className={`transition-all duration-300 ease-in-out ${
          expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="px-5 pb-5 pt-0">
          <div
            className="pt-4"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            {children}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Code block component
function CodeBlock({ children, copyText }: { children: string; copyText?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(copyText || children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre
        className="rounded-xl p-4 text-xs overflow-x-auto font-mono"
        style={{
          backgroundColor: 'var(--color-page-bg)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-foreground)',
        }}
      >
        {children}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          backgroundColor: copied ? 'var(--color-accent-500)' : 'var(--color-surface)',
          color: copied ? 'white' : 'var(--color-muted)',
          border: '1px solid var(--color-border)',
        }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

// Info box component
function InfoBox({ type, title, children }: { type: 'info' | 'warning' | 'success'; title: string; children: React.ReactNode }) {
  const styles = {
    info: { bg: 'var(--color-accent-50)', border: 'var(--color-accent-200)', text: 'var(--color-accent-600)' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: '#D97706' },
    success: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: '#059669' },
  };

  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: styles[type].bg, border: `1px solid ${styles[type].border}` }}
    >
      <p className="font-semibold text-sm" style={{ color: styles[type].text }}>{title}</p>
      <div className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>{children}</div>
    </div>
  );
}

// Icons
const icons = {
  overview: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  prerequisites: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  api: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),
  n8n: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  workflow: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  code: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  test: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  help: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
};

export function Help() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const webhookPayload = `{
  "system": {
    "id": "truenas-unique-id",
    "name": "TrueNAS-ClientName",
    "hostname": "nas.client.local",
    "version": "TrueNAS-SCALE-24.04",
    "client_name": "Client Name"
  },
  "metrics": [
    {
      "system_id": "truenas-unique-id",
      "metric_type": "pool",
      "metric_name": "tank_used",
      "value": 5200,
      "unit": "GB"
    },
    {
      "system_id": "truenas-unique-id",
      "metric_type": "disk",
      "metric_name": "sda_temperature",
      "value": 35,
      "unit": "C"
    }
  ],
  "alerts": [
    {
      "system_id": "truenas-unique-id",
      "severity": "warning",
      "message": "Pool tank is 85% full"
    }
  ]
}`;

  const curlCommand = `curl -X POST ${apiUrl}/webhook/metrics \\
  -H "Content-Type: application/json" \\
  -d '{
    "system": {
      "id": "test-system",
      "name": "Test TrueNAS",
      "hostname": "test.local"
    },
    "metrics": [],
    "alerts": []
  }'`;

  return (
    <div>
      <PageHeader
        title="Integration Guide"
        description="Connect your TrueNAS systems via n8n workflows"
      />

      {/* Quick Start Banner */}
      <div
        className="mb-8 rounded-2xl p-6 animate-fade-in-up max-w-4xl"
        style={{
          background: 'var(--gradient-accent)',
          boxShadow: '0 4px 20px rgba(6, 182, 212, 0.25)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white mb-1">Webhook Endpoint</h2>
            <p className="text-white/80 text-sm">Send your TrueNAS metrics to this URL</p>
          </div>
          <div className="flex items-center gap-2">
            <code className="px-4 py-2 rounded-lg bg-white/20 text-white font-mono text-sm">
              POST {apiUrl}/webhook/metrics
            </code>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigator.clipboard.writeText(`${apiUrl}/webhook/metrics`)}
              className="!bg-white/20 !text-white hover:!bg-white/30"
            >
              Copy
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4 max-w-4xl">
        {/* Overview */}
        <Section
          id="overview"
          title="How It Works"
          icon={icons.overview}
          description="Architecture overview of the monitoring system"
          expanded={expandedSections.has('overview')}
          onToggle={() => toggleSection('overview')}
        >
          <div className="space-y-6">
            <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>
              TrueNAS Mon uses <strong>n8n</strong> as a data collector. Your n8n instance polls TrueNAS systems
              on a schedule and forwards the metrics here for visualization and alerting.
            </p>

            <CodeBlock>{`TrueNAS Systems  ──▶  n8n Workflow  ──▶  TrueNAS Mon  ──▶  Dashboard
     (API)           (Every 5 min)       (Webhook)        (You)`}</CodeBlock>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { num: '1', title: 'TrueNAS API', desc: 'Each system exposes REST APIs with pool, disk, and alert data' },
                { num: '2', title: 'n8n Workflow', desc: 'Collects data from multiple systems and transforms it' },
                { num: '3', title: 'TrueNAS Mon', desc: 'Stores metrics, tracks trends, and displays alerts' },
              ].map((step) => (
                <div
                  key={step.num}
                  className="rounded-xl p-4"
                  style={{ backgroundColor: 'var(--color-accent-50)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: 'var(--color-accent-500)', color: 'white' }}
                    >
                      {step.num}
                    </span>
                    <span className="font-semibold text-sm" style={{ color: 'var(--color-accent-600)' }}>{step.title}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Prerequisites */}
        <Section
          id="prerequisites"
          title="Prerequisites"
          icon={icons.prerequisites}
          description="What you need before getting started"
          expanded={expandedSections.has('prerequisites')}
          onToggle={() => toggleSection('prerequisites')}
        >
          <ul className="space-y-4">
            {[
              { title: 'n8n instance', desc: 'Self-hosted or n8n Cloud. Must be able to reach your TrueNAS systems.' },
              { title: 'TrueNAS API access', desc: 'API key with read permissions on each TrueNAS system.' },
              { title: 'Network connectivity', desc: 'n8n must reach TrueNAS (port 443) and this backend (port 8000).' },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: 'var(--color-accent-100)', color: 'var(--color-accent-600)' }}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <div>
                  <span className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>{item.title}</span>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        {/* Step 1: TrueNAS API */}
        <Section
          id="truenas-api"
          title="Step 1: Create TrueNAS API Key"
          icon={icons.api}
          description="Generate an API key for each TrueNAS system"
          expanded={expandedSections.has('truenas-api')}
          onToggle={() => toggleSection('truenas-api')}
        >
          <div className="space-y-4">
            <ol className="space-y-3 text-sm" style={{ color: 'var(--color-foreground)' }}>
              {[
                'Log into your TrueNAS web interface',
                <>Navigate to <code className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--color-page-bg)' }}>Settings → API Keys</code></>,
                <>Click <strong>Add</strong> to create a new API key</>,
                <>Name it something descriptive like <code className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--color-page-bg)' }}>n8n-monitoring</code></>,
                'Copy the generated API key (you won\'t see it again!)',
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-accent-100)', color: 'var(--color-accent-600)' }}
                  >
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>

            <InfoBox type="info" title="TrueNAS API Endpoints">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {[
                  { ep: '/api/v2.0/pool', desc: 'Pool status & usage' },
                  { ep: '/api/v2.0/disk', desc: 'Disk health & temps' },
                  { ep: '/api/v2.0/replication', desc: 'Replication tasks' },
                  { ep: '/api/v2.0/alert/list', desc: 'Active alerts' },
                ].map((api) => (
                  <div key={api.ep} className="flex gap-2 text-xs">
                    <code style={{ color: 'var(--color-accent-600)' }}>{api.ep}</code>
                    <span>— {api.desc}</span>
                  </div>
                ))}
              </div>
            </InfoBox>
          </div>
        </Section>

        {/* Step 2: n8n Credentials */}
        <Section
          id="n8n-credentials"
          title="Step 2: Configure n8n Credentials"
          icon={icons.n8n}
          description="Store your TrueNAS API keys securely in n8n"
          expanded={expandedSections.has('n8n-credentials')}
          onToggle={() => toggleSection('n8n-credentials')}
        >
          <div className="space-y-4">
            <ol className="space-y-3 text-sm" style={{ color: 'var(--color-foreground)' }}>
              {[
                <>In n8n, go to <code className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--color-page-bg)' }}>Settings → Credentials</code></>,
                <>Click <strong>Add Credential</strong> and select <strong>Header Auth</strong></>,
                'Configure the credential with your TrueNAS API key',
                'Repeat for each TrueNAS system you want to monitor',
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-accent-100)', color: 'var(--color-accent-600)' }}
                  >
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>

            <CodeBlock>{`Name:          TrueNAS-ClientName
Header Name:   Authorization
Header Value:  Bearer YOUR_API_KEY_HERE`}</CodeBlock>

            <InfoBox type="warning" title="Security Tip">
              Create read-only API keys for monitoring. Never use admin credentials in automation workflows.
            </InfoBox>
          </div>
        </Section>

        {/* Step 3: n8n Workflow */}
        <Section
          id="n8n-workflow"
          title="Step 3: Create n8n Workflow"
          icon={icons.workflow}
          description="Build the data collection workflow"
          expanded={expandedSections.has('n8n-workflow')}
          onToggle={() => toggleSection('n8n-workflow')}
        >
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>
              Create a new workflow with these nodes connected in sequence:
            </p>

            <div className="space-y-3">
              {[
                { title: 'Schedule Trigger', desc: 'Run every 5 minutes', config: 'Cron: */5 * * * *' },
                { title: 'HTTP Request - Get Pools', desc: 'Fetch pool data', config: 'GET https://truenas-host/api/v2.0/pool' },
                { title: 'HTTP Request - Get Disks', desc: 'Fetch disk data', config: 'GET https://truenas-host/api/v2.0/disk' },
                { title: 'Code Node', desc: 'Transform & combine data', config: 'Format data for TrueNAS Mon' },
                { title: 'HTTP Request - Send', desc: 'Post to webhook', config: `POST ${apiUrl}/webhook/metrics` },
              ].map((node, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--color-page-bg)', border: '1px solid var(--color-border)' }}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-accent-500)', color: 'white' }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>{node.title}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{node.desc}</p>
                  </div>
                  <code className="text-xs hidden md:block" style={{ color: 'var(--color-accent-600)' }}>{node.config}</code>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Webhook Payload */}
        <Section
          id="payload"
          title="Webhook Payload Format"
          icon={icons.code}
          description="The JSON structure TrueNAS Mon expects"
          expanded={expandedSections.has('payload')}
          onToggle={() => toggleSection('payload')}
        >
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>
              Your n8n workflow should POST this JSON structure to the webhook endpoint:
            </p>

            <CodeBlock copyText={webhookPayload}>{webhookPayload}</CodeBlock>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoBox type="info" title="Required Fields">
                <ul className="space-y-1 mt-2 text-xs">
                  <li><code>system.id</code> — Unique identifier</li>
                  <li><code>system.name</code> — Display name</li>
                </ul>
              </InfoBox>
              <InfoBox type="info" title="Optional Fields">
                <ul className="space-y-1 mt-2 text-xs">
                  <li><code>metrics[]</code> — Pool/disk metrics</li>
                  <li><code>alerts[]</code> — Active alerts</li>
                </ul>
              </InfoBox>
            </div>
          </div>
        </Section>

        {/* Testing */}
        <Section
          id="testing"
          title="Test Your Integration"
          icon={icons.test}
          description="Verify everything is working correctly"
          expanded={expandedSections.has('testing')}
          onToggle={() => toggleSection('testing')}
        >
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>
              Test with a simple curl command:
            </p>

            <CodeBlock copyText={curlCommand.replace(/\\\n\s*/g, '')}>{curlCommand}</CodeBlock>

            <InfoBox type="success" title="Expected Response">
              <code className="text-xs font-mono">{`{"status": "ok", "metrics_received": 0, "alerts_received": 0}`}</code>
            </InfoBox>

            <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
              <p className="font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>After sending test data:</p>
              <ul className="space-y-1 text-xs">
                <li>• Check the <strong>Systems</strong> page — your test system should appear</li>
                <li>• Check the <strong>Dashboard</strong> — metrics should update</li>
                <li>• Verify in n8n that the workflow executes without errors</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* Troubleshooting */}
        <Section
          id="troubleshooting"
          title="Troubleshooting"
          icon={icons.help}
          description="Common issues and solutions"
          expanded={expandedSections.has('troubleshooting')}
          onToggle={() => toggleSection('troubleshooting')}
        >
          <div className="space-y-4">
            {[
              {
                problem: 'System not appearing in dashboard',
                solutions: [
                  'Verify the webhook URL is correct',
                  'Check that system.id is unique and consistent',
                  'Look for errors in n8n execution logs',
                ],
              },
              {
                problem: 'TrueNAS API returns 401/403',
                solutions: [
                  'Verify API key is correct and active',
                  'Ensure header format is "Authorization: Bearer YOUR_KEY"',
                  'Check TrueNAS user has API access permissions',
                ],
              },
              {
                problem: 'Connection timeout from n8n',
                solutions: [
                  'Verify network connectivity between n8n and TrueNAS',
                  'Check firewall rules allow HTTPS (443) traffic',
                  'Ensure TrueNAS web interface is accessible',
                ],
              },
              {
                problem: 'Metrics showing as stale',
                solutions: [
                  'Check n8n workflow is running on schedule',
                  'Verify workflow execution completed successfully',
                  'Ensure system clocks are synchronized (NTP)',
                ],
              },
            ].map((item) => (
              <div
                key={item.problem}
                className="rounded-xl p-4"
                style={{ backgroundColor: 'var(--color-page-bg)', border: '1px solid var(--color-border)' }}
              >
                <p className="font-semibold text-sm" style={{ color: 'var(--color-foreground)' }}>{item.problem}</p>
                <ul className="mt-2 space-y-1">
                  {item.solutions.map((sol, i) => (
                    <li key={i} className="text-xs flex gap-2" style={{ color: 'var(--color-muted)' }}>
                      <span>•</span>
                      <span>{sol}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
