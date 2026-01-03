# TrueNAS Fleet Monitor - Project Specification

## Overview

A monitoring dashboard and data layer for MSPs managing TrueNAS systems across multiple client sites. Designed to complement Tom Lawrence's n8n workflows that collect metrics from TrueNAS systems.

**The problem:** MSPs have no good way to monitor a fleet of TrueNAS systems securely. Tom Lawrence is building n8n workflows to collect the data - we're building the visualization, storage, and ticketing layer that sits behind those workflows.

**Target users:** MSPs (Managed Service Providers) running TrueNAS at client sites

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   TrueNAS       │────▶│    n8n Workflow  │────▶│  Fleet Monitor  │
│   Systems       │     │  (Tom's work)    │     │     Backend     │
│   (at client    │     │                  │     │    (FastAPI)    │
│    sites)       │     │  - Polls API     │     │                 │
└─────────────────┘     │  - Formats data  │     └────────┬────────┘
                        │  - POSTs to us   │              │
                        └──────────────────┘              ▼
                                                ┌─────────────────┐
                                                │   Database      │
                                                │  (SQLite/       │
                                                │   PostgreSQL)   │
                                                └────────┬────────┘
                                                         │
                        ┌────────────────────────────────┼────────────────────────────────┐
                        │                                │                                │
                        ▼                                ▼                                ▼
               ┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
               │    Streamlit    │             │  PSA Integration │             │   Alerting      │
               │    Dashboard    │             │  (Autotask/Halo) │             │  (Email/SMS)    │
               └─────────────────┘             └─────────────────┘             └─────────────────┘
```

## Tech Stack

- **Backend:** FastAPI (Python)
- **Frontend:** Streamlit (for rapid prototyping) - may migrate to React later
- **Database:** SQLite for dev, PostgreSQL + TimescaleDB for production
- **Charts:** Plotly
- **Deployment:** Docker

## Data Model

### Systems
Tracks each TrueNAS instance being monitored.

| Field | Type | Description |
|-------|------|-------------|
| id | string (PK) | Unique identifier (from n8n) |
| name | string | Friendly name |
| hostname | string | FQDN or IP |
| version | string | TrueNAS version |
| client_name | string | MSP client name |
| last_seen | timestamp | Last successful metric push |

### Metrics
Time-series data for trending and analysis.

| Field | Type | Description |
|-------|------|-------------|
| id | int (PK) | Auto-increment |
| system_id | string (FK) | Reference to system |
| timestamp | timestamp | When metric was recorded |
| metric_type | string | Category: pool, disk, cpu, memory, network |
| metric_name | string | Specific metric: tank_used, ada0_temp, etc. |
| value | float | Numeric value |
| unit | string | GB, %, °C, etc. |
| metadata | json | Additional context |

### Alerts
Events requiring attention.

| Field | Type | Description |
|-------|------|-------------|
| id | int (PK) | Auto-increment |
| system_id | string (FK) | Reference to system |
| timestamp | timestamp | When alert was created |
| severity | string | critical, warning, info |
| message | string | Human-readable description |
| acknowledged | bool | Has someone seen this? |
| ticket_id | string | PSA ticket reference if created |

## Metric Types to Support

### Pool Metrics
- `{pool_name}_used` - GB used
- `{pool_name}_total` - GB total
- `{pool_name}_health` - ONLINE, DEGRADED, FAULTED
- `{pool_name}_fragmentation` - percentage

### Disk Metrics
- `{disk_id}_temperature` - °C
- `{disk_id}_smart_status` - PASS, FAIL
- `{disk_id}_power_on_hours`
- `{disk_id}_reallocated_sectors`

### System Metrics
- `cpu_usage` - percentage
- `memory_used` - GB
- `memory_total` - GB
- `uptime` - seconds

### Replication Metrics (future)
- `{task_name}_last_run` - timestamp
- `{task_name}_status` - SUCCESS, FAILED
- `{task_name}_bytes_transferred`

## API Endpoints

### Webhook (n8n pushes here)
```
POST /webhook/metrics
```

### Systems
```
GET  /systems                    - List all systems
GET  /systems/{id}               - Get single system
GET  /systems/{id}/metrics       - Get metrics (with time filters)
GET  /systems/{id}/alerts        - Get alerts for system
```

### Alerts
```
GET  /alerts                     - List all alerts
POST /alerts/{id}/acknowledge    - Mark as acknowledged
POST /alerts/{id}/create-ticket  - Create PSA ticket
```

### Dashboard
```
GET /dashboard/summary           - Aggregate stats for dashboard
GET /dashboard/capacity-forecast - Predicted time-to-full per pool
```

## PSA Integrations

Priority order:
1. **Autotask** - Most common in MSP space
2. **Halo PSA** - Growing popularity
3. **ConnectWise Manage** - Also common

Each integration needs:
- API credentials storage (encrypted)
- Ticket creation with:
  - Title from alert message
  - Description with system details and metrics
  - Priority mapped from severity
  - Company/client mapping
- Optional: Auto-acknowledge alert when ticket created

## Alert Thresholds (Configurable)

| Metric | Warning | Critical |
|--------|---------|----------|
| Pool usage | 80% | 90% |
| Disk temperature | 45°C | 55°C |
| SMART status | - | FAIL |
| System offline | 30 min | 60 min |

## Features Roadmap

### Phase 1 - MVP (Current)
- [x] Webhook endpoint for n8n
- [x] SQLite storage
- [x] Basic dashboard with fleet overview
- [x] Alert list with acknowledge
- [x] Storage trending charts
- [ ] Docker deployment

### Phase 2 - PSA Integration
- [ ] Autotask integration
- [ ] Halo PSA integration
- [ ] Ticket creation from alerts
- [ ] Auto-ticketing rules

### Phase 3 - Advanced Analytics
- [ ] Capacity forecasting (linear regression on usage trends)
- [ ] Anomaly detection (unusual growth patterns)
- [ ] Disk failure prediction (SMART trend analysis)
- [ ] Monthly capacity reports per client

### Phase 4 - Production Ready
- [ ] PostgreSQL + TimescaleDB
- [ ] Multi-tenant support (for MSPs with many techs)
- [ ] Role-based access control
- [ ] Email/SMS alerting
- [ ] API rate limiting and authentication

### Phase 5 - Advanced Features
- [ ] Replication monitoring
- [ ] Snapshot management visibility
- [ ] Network throughput tracking
- [ ] Mobile app / responsive design

## n8n Webhook Payload Format

Expected payload from Tom's n8n workflow:

```json
{
  "system": {
    "id": "unique-system-id",
    "name": "TrueNAS-ClientName",
    "hostname": "nas.client.local",
    "version": "TrueNAS-SCALE-24.04",
    "client_name": "Acme Corp"
  },
  "metrics": [
    {
      "system_id": "unique-system-id",
      "metric_type": "pool",
      "metric_name": "tank_used",
      "value": 5200.5,
      "unit": "GB",
      "metadata": {"status": "ONLINE"}
    }
  ],
  "alerts": [
    {
      "system_id": "unique-system-id",
      "severity": "warning",
      "message": "Pool 'tank' is 85% full"
    }
  ]
}
```

## Environment Variables

```bash
# Database
DATABASE_URL=sqlite:///truenas_metrics.db  # or postgresql://...

# PSA - Autotask
AUTOTASK_API_USER=
AUTOTASK_API_SECRET=
AUTOTASK_INTEGRATION_CODE=

# PSA - Halo
HALO_CLIENT_ID=
HALO_CLIENT_SECRET=
HALO_TENANT=

# Alerting (future)
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
ALERT_EMAIL_TO=
```

## Development Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run backend
uvicorn backend:app --reload

# Run dashboard
streamlit run dashboard.py

# Generate mock data
python generate_mock_data.py

# Run tests (when added)
pytest
```

## Notes for AI Assistant

When working on this project:
1. Keep the code simple and readable - this may be open-sourced for the MSP community
2. Add docstrings and comments for complex logic
3. Use type hints throughout
4. Write tests for new features
5. Consider that MSPs are the target users - they need reliable, low-maintenance tools
6. Tom Lawrence's n8n workflow is the data source - we don't poll TrueNAS directly
7. PSA integration is high priority - this is what makes it useful for MSPs vs. just using Grafana
