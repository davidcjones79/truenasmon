# TrueNAS Mon

A modern fleet monitoring dashboard for TrueNAS systems, built for MSPs and homelab enthusiasts. Integrates with n8n workflows to provide real-time visibility into your TrueNAS infrastructure.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![React](https://img.shields.io/badge/react-18-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

## Features

### Monitoring
- **Fleet Dashboard** - Real-time overview of all TrueNAS systems at a glance
- **Pool Health** - Capacity tracking, scrub status, resilver progress, ZFS errors
- **Disk/SMART Data** - Temperature trends, power-on hours, reallocated sectors, read errors
- **Replication Status** - Backup task monitoring, stale replication detection
- **48-Hour Trending** - Historical data visualization for capacity planning

### Alerting
- **Real-time Alerts** - Critical, warning, and info severity levels
- **Alert Acknowledgment** - Track who acknowledged what and when
- **PSA Integration** - Create tickets in Autotask, HaloPSA, or ConnectWise
- **Card & List Views** - Toggle between view modes for alerts

### User Experience
- **Dark/Light Mode** - System-aware theme with manual toggle
- **Customizable Accent Colors** - Personalize your dashboard
- **Collapsible Sidebar** - More screen space when you need it
- **System Favorites** - Pin important systems for quick access
- **System Notes** - Add documentation per system
- **Toast Notifications** - Feedback for all actions
- **Loading Skeletons** - Smooth loading states
- **Session Timeout** - Auto-logout after 30 min idle with 5-min warning
- **Mobile Responsive** - Works on tablet and mobile

### Security
- **JWT Authentication** - Secure token-based auth (8-hour expiry)
- **Role-Based Access Control** - Admin, Operator, and Viewer roles
- **Rate Limiting** - 5 login attempts per minute per IP
- **Webhook API Key** - Protect your metrics endpoint
- **Forced Password Change** - Default admin must change password
- **Password Requirements** - Minimum 8 characters
- **CORS Configuration** - Restrict allowed origins

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

### Option 1: One-Line Deploy (Ubuntu VM)

```bash
curl -fsSL https://raw.githubusercontent.com/davidcjones79/truenasmon/main/deploy.sh | bash
```

This automatically installs Docker, configures secrets, and starts the app.

### Option 2: Docker Compose

```bash
# Clone the repository
git clone https://github.com/davidcjones79/truenasmon.git
cd truenasmon

# Copy environment file and configure
cp .env.example .env
# Edit .env and set JWT_SECRET (required)

# Start with Docker Compose
docker compose up -d

# Access the dashboard
open http://localhost:8000
```

### Option 3: Manual Installation

#### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

#### Backend Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export JWT_SECRET="your-secret-key-here"

# Start the API
uvicorn backend:app --host 0.0.0.0 --port 8000
```

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Generate Demo Data

```bash
# If using Docker:
docker compose exec truenas-mon python generate_mock_data.py

# If running locally (requires API running):
python generate_mock_data.py
```

Creates 5 sample TrueNAS systems with 48 hours of historical metrics.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | **Yes** | (random dev key) | Secret key for JWT tokens |
| `WEBHOOK_API_KEY` | Recommended | None | API key for webhook authentication |
| `CORS_ORIGINS` | Recommended | localhost | Comma-separated allowed origins |
| `DB_PATH` | No | `./truenas_metrics.db` | Path to SQLite database |

See `.env.example` for a complete template.

## Default Login

On first run, a default admin account is created:

- **Email:** `admin@truenas-mon.local`
- **Password:** `admin`

⚠️ **You will be forced to change this password on first login.**

## User Roles

| Permission | Admin | Operator | Viewer |
|------------|-------|----------|--------|
| View dashboard & metrics | ✓ | ✓ | ✓ |
| Acknowledge alerts | ✓ | ✓ | ✗ |
| Create tickets | ✓ | ✓ | ✗ |
| Change settings | ✓ | ✓ | ✗ |
| Manage users | ✓ | ✗ | ✗ |

## n8n Integration

### Webhook Endpoint

```
POST /webhook/metrics
Header: X-API-Key: your-webhook-api-key
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

### Supported Metric Types

| Type | Description | Example Metrics |
|------|-------------|-----------------|
| `pool` | Pool capacity | `tank_used`, `tank_total` |
| `pool_health` | Pool status | `tank_state`, `tank_scrub_status`, `tank_checksum_errors` |
| `disk` | Disk SMART data | `ada0_temperature`, `ada0_smart_status`, `ada0_power_hours` |
| `replication` | Backup tasks | `task_status`, `task_last_run`, `task_bytes` |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login, returns JWT token |
| POST | `/auth/logout` | Logout current session |
| GET | `/auth/me` | Get current user info |
| POST | `/auth/change-password` | Change password |

### Users (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users |
| POST | `/users` | Create user |
| PUT | `/users/{id}` | Update user |
| DELETE | `/users/{id}` | Deactivate user |
| POST | `/users/{id}/reset-password` | Reset to temp password |

### Data (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/summary` | Dashboard statistics |
| GET | `/systems` | List all systems |
| GET | `/systems/{id}/metrics` | System metrics (supports `?hours=` param) |
| GET | `/systems/{id}/disks` | System disk data |
| GET | `/systems/{id}/pools` | System pool data |
| GET | `/systems/{id}/replication` | System replication tasks |
| GET | `/alerts` | List alerts (supports `?acknowledged=` filter) |
| POST | `/alerts/{id}/acknowledge` | Acknowledge an alert |
| GET | `/disks/summary` | Fleet-wide disk health |
| GET | `/pools/summary` | Fleet-wide pool health |
| GET | `/replication/summary` | Fleet-wide replication status |

### Webhook
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhook/metrics` | Receive metrics from n8n |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Python 3.10+, FastAPI, Uvicorn |
| Database | SQLite |
| Auth | JWT (python-jose), bcrypt, slowapi |
| Deployment | Docker, Docker Compose |
| Data Collection | n8n (external) |

## Project Structure

```
truenasmon/
├── backend.py              # FastAPI backend
├── requirements.txt        # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── api/            # API client
│   └── package.json
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml      # Container orchestration
├── deploy.sh               # One-line deployment script
└── generate_mock_data.py   # Demo data generator
```

## Roadmap

### Completed ✅
- Core monitoring dashboard
- Pool health & ZFS insights
- Disk health & SMART tracking
- Replication monitoring
- User management & RBAC
- Session management & security
- Toast notifications & UX polish
- Docker deployment

### Coming Soon
- [ ] Container/app monitoring (Docker/K8s on TrueNAS SCALE)
- [ ] Enhanced notifications (Discord, email, webhooks)
- [ ] Hardware monitoring (GPU, UPS, IPMI)
- [ ] Fleet management (system groups, bulk operations)
- [ ] Scheduled PDF reports

See [ROADMAP.md](ROADMAP.md) for the full development roadmap.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - Built for the MSP and homelab community.

## Acknowledgments

Inspired by Tom Lawrence's TrueNAS monitoring workflows and built with the MSP community in mind.
