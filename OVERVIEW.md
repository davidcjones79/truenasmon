# TrueNAS Mon - Fleet Monitoring for MSPs

A modern web-based dashboard for monitoring multiple TrueNAS systems across client sites. Built for Managed Service Providers who need centralized visibility into their TrueNAS fleet.

## Architecture

```
TrueNAS Systems  -->  n8n Workflow  -->  TrueNAS Mon  -->  Dashboard
     (API)           (Every 5 min)       (Webhook)        (You)
```

- **Data Collection**: Uses n8n workflows to poll TrueNAS APIs on a schedule
- **Backend**: Python/FastAPI with SQLite database
- **Frontend**: React + TypeScript with Vite
- **Authentication**: JWT-based with role-based access control

## Current Features

### Dashboard
- Fleet-wide health overview at a glance
- System count (healthy/stale/total)
- Active alerts by severity (critical/warning/info)
- Total storage capacity across all systems
- Recent alerts feed

### Systems Management
- List all monitored TrueNAS systems
- View system details: hostname, version, client name
- Last-seen timestamps with stale detection
- Drill-down to individual system metrics

### Alerts
- Real-time alert feed from all systems
- Severity levels: Critical, Warning, Info
- Card and list view modes
- Filter by acknowledged/unacknowledged
- **Role-based acknowledgment** (operators and admins only)
- Create ticket integration (Autotask, HaloPSA, ConnectWise)

### Pool Monitoring
- Pool capacity and usage tracking
- Health status (online/degraded)
- Scrub status and last scrub time
- Checksum and scrub error counts
- Active resilver progress tracking
- Capacity warning thresholds

### Disk Health (SMART)
- Temperature monitoring across all disks
- SMART status (pass/fail)
- Power-on hours tracking
- Reallocated sector counts
- Pending sector counts
- Read error tracking
- Disk model and serial number visibility

### Replication Status
- Task status monitoring (success/failed/running)
- Last run timestamps
- Bytes transferred per task
- Duration tracking
- Stale task detection (tasks that haven't run)
- Source/destination visibility

### Trending & Historical Data
- 48-hour historical metrics retention
- Pool usage trends over time
- Temperature trends
- Visual charts for capacity planning

### User Management
- **Role-based access control**:
  - **Admin**: Full access, can manage users
  - **Operator**: Can acknowledge alerts, change settings
  - **Viewer**: Read-only dashboard access
- User creation/editing (admin only)
- Password reset with temporary passwords
- Account activation/deactivation

### Authentication & Security
- JWT token-based authentication
- Secure password hashing (bcrypt)
- Session timeout with warning (30 min idle)
- Auto-logout with "Stay Logged In" option
- Protected API endpoints

### User Experience
- **Dark/Light mode** toggle
- Responsive design (mobile-friendly)
- Collapsible sidebar
- Toast notifications for actions
- Loading skeletons
- Real-time data refresh

### Integration Guide
- Built-in help documentation
- Step-by-step n8n workflow setup
- TrueNAS API key instructions
- Webhook payload format reference
- Troubleshooting guide
- Copy-to-clipboard code blocks

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, CSS Variables |
| Backend | Python, FastAPI, Uvicorn |
| Database | SQLite |
| Auth | JWT (python-jose), bcrypt |
| Data Collection | n8n (external) |

## API Endpoints

### Authentication
- `POST /auth/login` - Login, returns JWT
- `GET /auth/me` - Current user info
- `POST /auth/change-password` - Change own password

### User Management (Admin)
- `GET /users` - List all users
- `POST /users` - Create user
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Deactivate user
- `POST /users/{id}/reset-password` - Reset password

### Data
- `GET /dashboard/summary` - Dashboard stats
- `GET /systems` - List systems
- `GET /systems/{id}/metrics` - System metrics
- `GET /alerts` - List alerts
- `POST /alerts/{id}/acknowledge` - Acknowledge alert
- `GET /disks/summary` - Disk health summary
- `GET /pools/summary` - Pool health summary
- `GET /replication/summary` - Replication status

### Webhook
- `POST /webhook/metrics` - Receive metrics from n8n

## Quick Start

```bash
# Backend
cd truenasmon
pip install -r requirements.txt
uvicorn backend:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

Default admin credentials (created on first run):
- Email: `admin@truenas-mon.local`
- Password: `admin`

## Sample Data

Generate demo data for testing:
```bash
python3 generate_mock_data.py
```

Creates 5 sample TrueNAS systems with 48 hours of historical metrics.

## Roadmap Ideas

- Email/webhook notifications for critical alerts
- PDF report generation
- Multi-tenant support
- API key authentication for webhook
- Docker containerization
- Prometheus/Grafana export

---

Built for MSPs managing TrueNAS fleets.
