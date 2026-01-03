# TrueNAS Mon

A modern fleet monitoring dashboard for TrueNAS systems, built for MSPs and homelab enthusiasts. Integrates with n8n workflows to provide real-time visibility into your TrueNAS infrastructure.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![React](https://img.shields.io/badge/react-18-blue.svg)

## Features

- **Fleet Dashboard** - Real-time overview of all TrueNAS systems at a glance
- **Pool Health Monitoring** - Track capacity, scrub status, resilver progress, and ZFS errors
- **Disk/SMART Tracking** - Temperature trends, power-on hours, reallocated sectors
- **Replication Status** - Monitor backup tasks, detect stale replications
- **Alert Management** - Acknowledge alerts, create PSA tickets (Autotask, Halo, ConnectWise)
- **User Management** - Role-based access control (Admin, Operator, Viewer)
- **Dark/Light Mode** - Customizable theme with accent colors
- **48-Hour Trending** - Historical data for capacity planning

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   TrueNAS       │────▶│   n8n Workflow   │────▶│   TrueNAS Mon   │
│   Systems       │     │  (every 5 min)   │     │   Backend API   │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                        ┌─────────────────────────────────┼─────────────────────────────────┐
                        │                                 │                                 │
                        ▼                                 ▼                                 ▼
               ┌─────────────────┐               ┌─────────────────┐               ┌─────────────────┐
               │   SQLite DB     │               │  React Frontend │               │  Your Browser   │
               │  (metrics)      │◀─────────────▶│  (Vite + TS)    │──────────────▶│                 │
               └─────────────────┘               └─────────────────┘               └─────────────────┘
```

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/davidcjones79/truenasmon.git
cd truenasmon

# Copy environment file and configure
cp .env.example .env
# Edit .env with your settings (see Environment Variables below)

# Start with Docker Compose
docker-compose up -d

# Access the dashboard
open http://localhost:5173
```

### Option 2: Manual Installation

#### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

#### Backend Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Set environment variables (see below)
export JWT_SECRET="your-secret-key-here"

# Start the API
uvicorn backend:app --host 0.0.0.0 --port 8000
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Generate Demo Data (Optional)

```bash
python generate_mock_data.py
```

This creates 5 sample TrueNAS systems with 48 hours of historical metrics.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | (random) | Secret key for JWT tokens. **Set this in production!** |
| `WEBHOOK_API_KEY` | Recommended | None | API key for webhook authentication |
| `CORS_ORIGINS` | Recommended | localhost | Comma-separated allowed origins |

See `.env.example` for a complete list.

## Default Login

On first run, a default admin account is created:
- **Email:** `admin@truenas-mon.local`
- **Password:** `admin`

**You will be required to change this password on first login.**

## n8n Integration

### Webhook Endpoint

```
POST /webhook/metrics
Header: X-API-Key: your-webhook-api-key (if configured)
```

### Payload Format

```json
{
  "system": {
    "id": "unique-system-id",
    "name": "TrueNAS-ClientName",
    "hostname": "nas.client.local",
    "version": "TrueNAS-SCALE-24.04",
    "client_name": "Client Name"
  },
  "metrics": [
    {
      "system_id": "unique-system-id",
      "metric_type": "pool",
      "metric_name": "tank_used",
      "value": 5200.5,
      "unit": "GB"
    }
  ],
  "alerts": [
    {
      "system_id": "unique-system-id",
      "severity": "warning",
      "message": "Pool is 85% full"
    }
  ]
}
```

### Metric Types

| Type | Description | Example metric_name |
|------|-------------|---------------------|
| `pool` | Pool capacity | `tank_used`, `tank_total` |
| `pool_health` | Pool status | `tank_state`, `tank_scrub_status` |
| `disk` | Disk SMART data | `ada0_temperature`, `ada0_smart_status` |
| `replication` | Backup tasks | `tank-backup_status`, `tank-backup_last_run` |

## API Endpoints

### Authentication
- `POST /auth/login` - Login, returns JWT token
- `GET /auth/me` - Get current user info
- `POST /auth/change-password` - Change password

### Data (requires authentication)
- `GET /dashboard/summary` - Dashboard statistics
- `GET /systems` - List all systems
- `GET /systems/{id}/metrics` - System metrics
- `GET /alerts` - List alerts
- `POST /alerts/{id}/acknowledge` - Acknowledge alert
- `GET /disks/summary` - Disk health overview
- `GET /pools/summary` - Pool health overview
- `GET /replication/summary` - Replication status

### Webhook
- `POST /webhook/metrics` - Receive metrics from n8n

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI, Uvicorn |
| Database | SQLite |
| Auth | JWT (python-jose), bcrypt |
| Data Collection | n8n (external) |

## Security Features

- JWT-based authentication with configurable expiry
- Role-based access control (Admin/Operator/Viewer)
- Rate limiting on login (5 attempts/minute)
- Webhook API key authentication
- CORS configuration
- Password strength requirements
- Session timeout with warning

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full development roadmap.

### Completed
- [x] Core monitoring dashboard
- [x] Disk health & SMART tracking
- [x] Replication monitoring
- [x] Pool health & ZFS insights
- [x] User management & RBAC
- [x] UX enhancements (toasts, themes)

### Coming Soon
- [ ] Container/app monitoring (Docker/K8s)
- [ ] Enhanced notifications (Discord, email)
- [ ] Hardware monitoring (GPU, UPS)
- [ ] Fleet management features

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT - Built for the MSP and homelab community.

## Credits

Inspired by Tom Lawrence's TrueNAS monitoring workflows. Built with the MSP community in mind.
