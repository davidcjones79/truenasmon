# TrueNAS Mon - Setup Guide

A quick guide to get TrueNAS Mon running on your system.

## Prerequisites

- A Linux VM (Ubuntu 22.04 recommended) or any system with Docker
- Docker and Docker Compose installed
- Port 8000 available

## Quick Setup (5 minutes)

### Option 1: One-Line Install (Ubuntu VM)

```bash
curl -fsSL https://raw.githubusercontent.com/davidcjones79/truenasmon/main/deploy.sh | bash
```

This will:
- Install Docker if not present
- Clone the repository
- Generate secure secrets
- Start the application

### Option 2: Manual Docker Setup

```bash
# Clone the repo
git clone https://github.com/davidcjones79/truenasmon.git
cd truenasmon

# Create environment file
cp .env.example .env

# Generate a secure JWT secret
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env

# Start the application
docker compose up -d --build
```

## First Login

1. Open your browser to `http://YOUR_SERVER_IP:8000`

2. Login with default credentials:
   - **Email:** `admin@truenas-mon.local`
   - **Password:** `admin`

3. You'll be prompted to change your password immediately

## Generate Demo Data

To populate the dashboard with sample TrueNAS systems:

```bash
cd ~/truenasmon
docker compose exec truenas-mon python generate_mock_data.py
```

This creates 5 sample systems with 48 hours of historical metrics.

## Connecting to n8n

TrueNAS Mon receives metrics via webhook from n8n workflows.

### Webhook Endpoint

```
POST http://YOUR_SERVER_IP:8000/webhook/metrics
Header: X-API-Key: YOUR_WEBHOOK_API_KEY
```

The webhook API key is generated during setup and shown in the terminal output. You can also find it in your `.env` file.

### Sample n8n Workflow

Your n8n workflow should:
1. Query TrueNAS API for system info, pools, disks, replication tasks
2. Format the data as JSON
3. POST to the webhook endpoint

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

## User Roles

| Role | Can View | Can Acknowledge Alerts | Can Manage Users |
|------|----------|------------------------|------------------|
| Admin | Yes | Yes | Yes |
| Operator | Yes | Yes | No |
| Viewer | Yes | No | No |

## Useful Commands

```bash
# View logs
docker compose logs -f

# Restart the application
docker compose restart

# Stop the application
docker compose down

# Update to latest version
git pull && docker compose up -d --build
```

## Troubleshooting

### Can't connect to the dashboard
- Check if the container is running: `docker compose ps`
- Check the logs: `docker compose logs`
- Ensure port 8000 is not blocked by firewall

### Login not working
- Clear your browser cache/cookies
- Check the logs for errors: `docker compose logs`

### Webhook not receiving data
- Verify your API key matches what's in `.env`
- Check CORS_ORIGINS in `.env` includes your n8n server

## Support

- GitHub: https://github.com/davidcjones79/truenasmon
- Issues: https://github.com/davidcjones79/truenasmon/issues
