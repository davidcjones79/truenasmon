"""
Mock Data Generator for TrueNAS Fleet Monitor
Populates the database with realistic sample data for demo purposes
"""

import requests
import random
from datetime import datetime, timedelta
import time

API_URL = "http://localhost:8000"

# Sample MSP client data
SAMPLE_SYSTEMS = [
    {
        "id": "truenas-001",
        "name": "TrueNAS-Acme",
        "hostname": "nas01.acme.local",
        "version": "TrueNAS-SCALE-24.04",
        "client_name": "Acme Corp"
    },
    {
        "id": "truenas-002",
        "name": "TrueNAS-Contoso",
        "hostname": "storage.contoso.local",
        "version": "TrueNAS-SCALE-24.04",
        "client_name": "Contoso Ltd"
    },
    {
        "id": "truenas-003",
        "name": "TrueNAS-Northwind",
        "hostname": "nas.northwind.local",
        "version": "TrueNAS-CORE-13.0",
        "client_name": "Northwind Traders"
    },
    {
        "id": "truenas-004",
        "name": "TrueNAS-Fabrikam",
        "hostname": "fileserver.fabrikam.local",
        "version": "TrueNAS-SCALE-23.10",
        "client_name": "Fabrikam Inc"
    },
    {
        "id": "truenas-005",
        "name": "TrueNAS-Tailspin",
        "hostname": "backup.tailspin.local",
        "version": "TrueNAS-SCALE-24.04",
        "client_name": "Tailspin Toys"
    }
]

# Pool configurations per system
POOL_CONFIGS = {
    "truenas-001": [
        {"name": "tank", "total": 8000, "base_used": 5200},
        {"name": "backup", "total": 4000, "base_used": 2800}
    ],
    "truenas-002": [
        {"name": "data", "total": 16000, "base_used": 9500}
    ],
    "truenas-003": [
        {"name": "storage", "total": 4000, "base_used": 3200},
        {"name": "archive", "total": 8000, "base_used": 6500}
    ],
    "truenas-004": [
        {"name": "main", "total": 12000, "base_used": 4200}
    ],
    "truenas-005": [
        {"name": "backups", "total": 20000, "base_used": 14000}
    ]
}

# Disk configurations per system
DISK_CONFIGS = {
    "truenas-001": [
        {"id": "ada0", "model": "WDC WD80EFZX", "serial": "WD-CA1234567", "size_tb": 8, "type": "HDD", "power_hours": 12500, "temp_base": 35},
        {"id": "ada1", "model": "WDC WD80EFZX", "serial": "WD-CA1234568", "size_tb": 8, "type": "HDD", "power_hours": 12480, "temp_base": 36},
        {"id": "ada2", "model": "WDC WD80EFZX", "serial": "WD-CA1234569", "size_tb": 8, "type": "HDD", "power_hours": 12510, "temp_base": 34},
        {"id": "nvme0", "model": "Samsung 970 EVO", "serial": "S4EVNX0T123456", "size_tb": 0.5, "type": "NVMe", "power_hours": 8200, "temp_base": 42},
    ],
    "truenas-002": [
        {"id": "da0", "model": "HGST HUH728080AL", "serial": "2EKWXYZA", "size_tb": 8, "type": "SAS", "power_hours": 28400, "temp_base": 38},
        {"id": "da1", "model": "HGST HUH728080AL", "serial": "2EKWXYZB", "size_tb": 8, "type": "SAS", "power_hours": 28350, "temp_base": 39},
        {"id": "da2", "model": "HGST HUH728080AL", "serial": "2EKWXYZC", "size_tb": 8, "type": "SAS", "power_hours": 28420, "temp_base": 37},
        {"id": "da3", "model": "HGST HUH728080AL", "serial": "2EKWXYZD", "size_tb": 8, "type": "SAS", "power_hours": 28380, "temp_base": 40},
    ],
    "truenas-003": [
        {"id": "ada0", "model": "Seagate IronWolf", "serial": "ZA123456", "size_tb": 4, "type": "HDD", "power_hours": 45200, "temp_base": 41},
        {"id": "ada1", "model": "Seagate IronWolf", "serial": "ZA123457", "size_tb": 4, "type": "HDD", "power_hours": 45180, "temp_base": 42},
        {"id": "ada2", "model": "Seagate IronWolf", "serial": "ZA123458", "size_tb": 4, "type": "HDD", "power_hours": 44900, "temp_base": 40, "failing": True},
    ],
    "truenas-004": [
        {"id": "ada0", "model": "Toshiba MG08", "serial": "Y9K0A12345", "size_tb": 16, "type": "HDD", "power_hours": 5200, "temp_base": 33},
        {"id": "ada1", "model": "Toshiba MG08", "serial": "Y9K0A12346", "size_tb": 16, "type": "HDD", "power_hours": 5180, "temp_base": 34},
    ],
    "truenas-005": [
        {"id": "ada0", "model": "WDC WD120EFBX", "serial": "WD-CA9876543", "size_tb": 12, "type": "HDD", "power_hours": 8900, "temp_base": 36},
        {"id": "ada1", "model": "WDC WD120EFBX", "serial": "WD-CA9876544", "size_tb": 12, "type": "HDD", "power_hours": 8880, "temp_base": 37},
        {"id": "ada2", "model": "WDC WD120EFBX", "serial": "WD-CA9876545", "size_tb": 12, "type": "HDD", "power_hours": 8920, "temp_base": 35},
        {"id": "ada3", "model": "WDC WD120EFBX", "serial": "WD-CA9876546", "size_tb": 12, "type": "HDD", "power_hours": 8860, "temp_base": 38},
        {"id": "nvme0", "model": "Intel Optane 905P", "serial": "PHLF123456", "size_tb": 0.38, "type": "NVMe", "power_hours": 6500, "temp_base": 45},
    ]
}

# Pool health configurations per system
POOL_HEALTH_CONFIGS = {
    "truenas-001": [
        {
            "name": "tank",
            "scrub_interval_days": 7,
            "last_scrub_hours_ago": 48,
            "scrub_duration_seconds": 3600,
            "scrub_errors": 0,
            "checksum_errors": 0,
            "state": "online"
        },
        {
            "name": "backup",
            "scrub_interval_days": 7,
            "last_scrub_hours_ago": 72,
            "scrub_duration_seconds": 1800,
            "scrub_errors": 0,
            "checksum_errors": 0,
            "state": "online"
        }
    ],
    "truenas-002": [
        {
            "name": "data",
            "scrub_interval_days": 7,
            "last_scrub_hours_ago": 24,
            "scrub_duration_seconds": 7200,
            "scrub_errors": 0,
            "checksum_errors": 0,
            "state": "online"
        }
    ],
    "truenas-003": [
        {
            "name": "storage",
            "scrub_interval_days": 7,
            "last_scrub_hours_ago": 200,  # Needs scrub - over 7 days
            "scrub_duration_seconds": 2400,
            "scrub_errors": 3,  # Previous scrub had errors
            "checksum_errors": 5,
            "state": "online"
        },
        {
            "name": "archive",
            "scrub_interval_days": 7,
            "last_scrub_hours_ago": 96,
            "scrub_duration_seconds": 5400,
            "scrub_errors": 0,
            "checksum_errors": 0,
            "state": "online"
        }
    ],
    "truenas-004": [
        {
            "name": "main",
            "scrub_interval_days": 7,
            "last_scrub_hours_ago": 12,
            "scrub_duration_seconds": 4800,
            "scrub_errors": 0,
            "checksum_errors": 0,
            "state": "online",
            "resilver_active": True,  # Active resilver
            "resilver_progress": 67
        }
    ],
    "truenas-005": [
        {
            "name": "backups",
            "scrub_interval_days": 7,
            "last_scrub_hours_ago": 36,
            "scrub_duration_seconds": 10800,
            "scrub_errors": 0,
            "checksum_errors": 0,
            "state": "degraded"  # Degraded pool
        }
    ]
}

# Replication task configurations per system
REPLICATION_CONFIGS = {
    "truenas-001": [
        {
            "id": "tank-to-backup",
            "source": "tank/data",
            "destination": "backup-server/tank",
            "schedule": "daily",
            "bytes_base": 50 * 1024**3,  # 50 GB
            "duration_base": 1800,  # 30 minutes
            "success_rate": 0.95
        },
        {
            "id": "tank-offsite",
            "source": "tank/critical",
            "destination": "offsite-nas/acme",
            "schedule": "hourly",
            "bytes_base": 5 * 1024**3,  # 5 GB
            "duration_base": 300,  # 5 minutes
            "success_rate": 0.98
        }
    ],
    "truenas-002": [
        {
            "id": "data-backup",
            "source": "data/production",
            "destination": "backup-pool/contoso",
            "schedule": "daily",
            "bytes_base": 120 * 1024**3,  # 120 GB
            "duration_base": 3600,  # 1 hour
            "success_rate": 0.92
        }
    ],
    "truenas-003": [
        {
            "id": "storage-archive",
            "source": "storage/files",
            "destination": "archive/northwind",
            "schedule": "weekly",
            "bytes_base": 200 * 1024**3,  # 200 GB
            "duration_base": 7200,  # 2 hours
            "success_rate": 0.90,
            "stale": True  # This one hasn't run in a while
        }
    ],
    "truenas-004": [
        {
            "id": "main-sync",
            "source": "main/shared",
            "destination": "dr-site/fabrikam",
            "schedule": "daily",
            "bytes_base": 80 * 1024**3,  # 80 GB
            "duration_base": 2400,  # 40 minutes
            "success_rate": 0.97
        }
    ],
    "truenas-005": [
        {
            "id": "backups-offsite",
            "source": "backups/all",
            "destination": "cloud-s3/tailspin",
            "schedule": "daily",
            "bytes_base": 500 * 1024**3,  # 500 GB
            "duration_base": 14400,  # 4 hours
            "success_rate": 0.85,
            "failing": True  # This one is currently failing
        },
        {
            "id": "backups-local",
            "source": "backups/critical",
            "destination": "local-backup/tailspin",
            "schedule": "hourly",
            "bytes_base": 10 * 1024**3,  # 10 GB
            "duration_base": 600,  # 10 minutes
            "success_rate": 0.99
        }
    ]
}

SAMPLE_ALERTS = [
    {"severity": "critical", "message": "Pool 'tank' is 92% full - immediate action required"},
    {"severity": "critical", "message": "Disk ada2 SMART test failed - replacement recommended"},
    {"severity": "warning", "message": "Pool 'backup' is 85% full"},
    {"severity": "warning", "message": "ZFS scrub found 3 checksum errors on pool 'storage'"},
    {"severity": "warning", "message": "UPS battery runtime below 30 minutes"},
    {"severity": "info", "message": "Weekly scrub completed successfully"},
    {"severity": "info", "message": "System update available: TrueNAS-SCALE-24.04.1"},
]


def send_metrics(system, metrics, alerts=None):
    """Send metrics to the API"""
    payload = {
        "system": system,
        "metrics": metrics,
        "alerts": alerts or []
    }
    
    try:
        resp = requests.post(f"{API_URL}/webhook/metrics", json=payload, timeout=5)
        resp.raise_for_status()
        return True
    except Exception as e:
        print(f"Error sending metrics: {e}")
        return False


def generate_disk_metrics(system_id, disks, hour_offset=0):
    """Generate SMART disk metrics for a system"""
    metrics = []

    for disk in disks:
        disk_id = disk["id"]

        # Temperature varies slightly over time
        temp_variance = random.uniform(-3, 5)
        temperature = disk["temp_base"] + temp_variance

        # SMART status (1 = healthy, 0 = failing)
        smart_status = 0 if disk.get("failing") else 1

        # Power on hours increases over time
        power_hours = disk["power_hours"] + (48 - hour_offset)

        # Reallocated sectors (usually 0, sometimes non-zero for older drives)
        reallocated = 0
        if disk.get("failing"):
            reallocated = random.randint(5, 25)
        elif disk["power_hours"] > 40000:
            reallocated = random.randint(0, 3)

        # Pending sectors
        pending = random.randint(0, 2) if disk.get("failing") else 0

        # Read/write errors (usually 0)
        read_errors = random.randint(0, 5) if disk.get("failing") else 0

        # Add temperature metric
        metrics.append({
            "system_id": system_id,
            "metric_type": "disk",
            "metric_name": f"{disk_id}_temperature",
            "value": round(temperature, 1),
            "unit": "C",
            "metadata": {
                "model": disk["model"],
                "serial": disk["serial"],
                "type": disk["type"],
                "size_tb": disk["size_tb"]
            }
        })

        # Add SMART status
        metrics.append({
            "system_id": system_id,
            "metric_type": "disk",
            "metric_name": f"{disk_id}_smart_status",
            "value": smart_status,
            "unit": "bool",
            "metadata": {"description": "1=PASSED, 0=FAILED"}
        })

        # Add power on hours
        metrics.append({
            "system_id": system_id,
            "metric_type": "disk",
            "metric_name": f"{disk_id}_power_hours",
            "value": power_hours,
            "unit": "hours"
        })

        # Add reallocated sectors
        metrics.append({
            "system_id": system_id,
            "metric_type": "disk",
            "metric_name": f"{disk_id}_reallocated_sectors",
            "value": reallocated,
            "unit": "count"
        })

        # Add pending sectors
        metrics.append({
            "system_id": system_id,
            "metric_type": "disk",
            "metric_name": f"{disk_id}_pending_sectors",
            "value": pending,
            "unit": "count"
        })

        # Add read errors
        metrics.append({
            "system_id": system_id,
            "metric_type": "disk",
            "metric_name": f"{disk_id}_read_errors",
            "value": read_errors,
            "unit": "count"
        })

    return metrics


def generate_replication_metrics(system_id, tasks, hour_offset=0):
    """Generate replication task metrics for a system"""
    metrics = []
    current_time = time.time()

    for task in tasks:
        task_id = task["id"]

        # Determine if this task ran in this time window
        schedule = task.get("schedule", "daily")
        run_interval_hours = {"hourly": 1, "daily": 24, "weekly": 168}.get(schedule, 24)

        # For stale tasks, last run was 48+ hours ago
        if task.get("stale"):
            last_run_timestamp = current_time - (48 + hour_offset) * 3600
            status = 2  # Last run was successful, but it's stale
        elif task.get("failing"):
            # Failing task - last attempt failed
            last_run_timestamp = current_time - hour_offset * 3600
            status = 0  # Failed
        else:
            # Normal task - runs on schedule
            last_run_timestamp = current_time - (hour_offset % run_interval_hours) * 3600
            # Randomly determine success based on success_rate
            if random.random() < task.get("success_rate", 0.95):
                status = 2  # Success
            else:
                status = 0  # Failed

        # Bytes transferred with variance
        bytes_transferred = task["bytes_base"] * random.uniform(0.8, 1.2)

        # Duration with variance
        duration = task["duration_base"] * random.uniform(0.9, 1.3)

        # Add status metric
        metrics.append({
            "system_id": system_id,
            "metric_type": "replication",
            "metric_name": f"{task_id}_status",
            "value": status,
            "unit": "enum",
            "metadata": {
                "source": task["source"],
                "destination": task["destination"],
                "schedule": task["schedule"],
                "description": "0=failed, 1=running, 2=success"
            }
        })

        # Add last_run metric (Unix timestamp)
        metrics.append({
            "system_id": system_id,
            "metric_type": "replication",
            "metric_name": f"{task_id}_last_run",
            "value": int(last_run_timestamp),
            "unit": "timestamp",
            "metadata": {
                "source": task["source"],
                "destination": task["destination"]
            }
        })

        # Add bytes transferred (only if ran successfully)
        if status == 2:
            metrics.append({
                "system_id": system_id,
                "metric_type": "replication",
                "metric_name": f"{task_id}_bytes",
                "value": round(bytes_transferred),
                "unit": "bytes",
                "metadata": {
                    "source": task["source"],
                    "destination": task["destination"]
                }
            })

            # Add duration
            metrics.append({
                "system_id": system_id,
                "metric_type": "replication",
                "metric_name": f"{task_id}_duration",
                "value": round(duration),
                "unit": "seconds"
            })

    return metrics


def generate_pool_health_metrics(system_id, pools, hour_offset=0):
    """Generate pool health metrics for a system"""
    metrics = []
    current_time = time.time()

    for pool in pools:
        pool_name = pool["name"]

        # State: 1=online, 0=degraded
        state = 0 if pool.get("state") == "degraded" else 1

        # Scrub status: 0=never, 1=in_progress, 2=completed
        scrub_status = 2  # Default to completed

        # Last scrub timestamp
        last_scrub = current_time - (pool["last_scrub_hours_ago"] + hour_offset) * 3600

        # Add state metric
        metrics.append({
            "system_id": system_id,
            "metric_type": "pool_health",
            "metric_name": f"{pool_name}_state",
            "value": state,
            "unit": "enum",
            "metadata": {"description": "0=degraded, 1=online"}
        })

        # Add scrub status
        metrics.append({
            "system_id": system_id,
            "metric_type": "pool_health",
            "metric_name": f"{pool_name}_scrub_status",
            "value": scrub_status,
            "unit": "enum",
            "metadata": {"description": "0=never, 1=in_progress, 2=completed"}
        })

        # Add last scrub timestamp
        metrics.append({
            "system_id": system_id,
            "metric_type": "pool_health",
            "metric_name": f"{pool_name}_scrub_last",
            "value": int(last_scrub),
            "unit": "timestamp"
        })

        # Add scrub duration
        metrics.append({
            "system_id": system_id,
            "metric_type": "pool_health",
            "metric_name": f"{pool_name}_scrub_duration",
            "value": pool["scrub_duration_seconds"],
            "unit": "seconds"
        })

        # Add scrub errors
        metrics.append({
            "system_id": system_id,
            "metric_type": "pool_health",
            "metric_name": f"{pool_name}_scrub_errors",
            "value": pool["scrub_errors"],
            "unit": "count"
        })

        # Add checksum errors
        metrics.append({
            "system_id": system_id,
            "metric_type": "pool_health",
            "metric_name": f"{pool_name}_checksum_errors",
            "value": pool["checksum_errors"],
            "unit": "count"
        })

        # Add resilver status: 0=none, 1=in_progress
        resilver_status = 1 if pool.get("resilver_active") else 0
        metrics.append({
            "system_id": system_id,
            "metric_type": "pool_health",
            "metric_name": f"{pool_name}_resilver_status",
            "value": resilver_status,
            "unit": "enum",
            "metadata": {"description": "0=none, 1=in_progress"}
        })

        # Add resilver progress if active
        if pool.get("resilver_active"):
            # Progress increases over time (simulated)
            base_progress = pool.get("resilver_progress", 50)
            progress = min(99, base_progress + (hour_offset * 2))  # 2% per hour
            metrics.append({
                "system_id": system_id,
                "metric_type": "pool_health",
                "metric_name": f"{pool_name}_resilver_progress",
                "value": progress,
                "unit": "percent"
            })

    return metrics


def generate_historical_data(hours=24):
    """Generate historical data points"""
    print(f"Generating {hours} hours of historical data...")

    # Generate data points for each hour going back
    for hour_offset in range(hours, 0, -1):
        timestamp = datetime.utcnow() - timedelta(hours=hour_offset)

        for system in SAMPLE_SYSTEMS:
            pools = POOL_CONFIGS.get(system["id"], [])
            disks = DISK_CONFIGS.get(system["id"], [])
            metrics = []

            # Pool metrics
            for pool in pools:
                # Add some growth over time (0.5% per day = ~0.02% per hour)
                growth_factor = 1 + (0.0002 * (hours - hour_offset))
                used = pool["base_used"] * growth_factor

                # Add some random noise
                used += random.uniform(-50, 50)

                metrics.append({
                    "system_id": system["id"],
                    "metric_type": "pool",
                    "metric_name": f"{pool['name']}_used",
                    "value": round(used, 2),
                    "unit": "GB"
                })

                metrics.append({
                    "system_id": system["id"],
                    "metric_type": "pool",
                    "metric_name": f"{pool['name']}_total",
                    "value": pool["total"],
                    "unit": "GB"
                })

            # Disk metrics (every 4 hours for historical data)
            if hour_offset % 4 == 0:
                disk_metrics = generate_disk_metrics(system["id"], disks, hour_offset)
                metrics.extend(disk_metrics)

            # Replication metrics (every 6 hours for historical data)
            if hour_offset % 6 == 0:
                replication_tasks = REPLICATION_CONFIGS.get(system["id"], [])
                replication_metrics = generate_replication_metrics(system["id"], replication_tasks, hour_offset)
                metrics.extend(replication_metrics)

            # Pool health metrics (every 6 hours for historical data)
            if hour_offset % 6 == 0:
                pool_health = POOL_HEALTH_CONFIGS.get(system["id"], [])
                pool_health_metrics = generate_pool_health_metrics(system["id"], pool_health, hour_offset)
                metrics.extend(pool_health_metrics)

            send_metrics(system, metrics)

        # Progress indicator
        if hour_offset % 6 == 0:
            print(f"  Generated data for -{hour_offset} hours")

    print("Historical data generation complete!")


def generate_alerts():
    """Generate some sample alerts"""
    print("Generating sample alerts...")
    
    # Pick random systems for alerts
    for _ in range(5):
        system = random.choice(SAMPLE_SYSTEMS)
        alert = random.choice(SAMPLE_ALERTS)
        
        send_metrics(system, [], [{
            "system_id": system["id"],
            "severity": alert["severity"],
            "message": alert["message"]
        }])
    
    print("Alerts generated!")


def send_current_metrics():
    """Send current metric readings for all systems"""
    print("Sending current metrics...")

    for system in SAMPLE_SYSTEMS:
        pools = POOL_CONFIGS.get(system["id"], [])
        disks = DISK_CONFIGS.get(system["id"], [])
        metrics = []

        # Pool metrics
        for pool in pools:
            # Current usage with small random variation
            used = pool["base_used"] + random.uniform(-20, 50)

            metrics.append({
                "system_id": system["id"],
                "metric_type": "pool",
                "metric_name": f"{pool['name']}_used",
                "value": round(used, 2),
                "unit": "GB"
            })

            metrics.append({
                "system_id": system["id"],
                "metric_type": "pool",
                "metric_name": f"{pool['name']}_total",
                "value": pool["total"],
                "unit": "GB"
            })

        # Disk metrics
        disk_metrics = generate_disk_metrics(system["id"], disks, 0)
        metrics.extend(disk_metrics)

        # Replication metrics
        replication_tasks = REPLICATION_CONFIGS.get(system["id"], [])
        replication_metrics = generate_replication_metrics(system["id"], replication_tasks, 0)
        metrics.extend(replication_metrics)

        # Pool health metrics
        pool_health = POOL_HEALTH_CONFIGS.get(system["id"], [])
        pool_health_metrics = generate_pool_health_metrics(system["id"], pool_health, 0)
        metrics.extend(pool_health_metrics)

        send_metrics(system, metrics)

    print("Current metrics sent!")


def main():
    # Check API is running
    try:
        resp = requests.get(f"{API_URL}/", timeout=5)
        resp.raise_for_status()
        print("✓ API is running")
    except:
        print("✗ API is not running. Start it with:")
        print("  uvicorn backend:app --reload")
        return
    
    print("\n" + "="*50)
    print("TrueNAS Fleet Monitor - Mock Data Generator")
    print("="*50 + "\n")
    
    # Generate historical data
    generate_historical_data(hours=48)
    
    print()
    
    # Generate alerts
    generate_alerts()
    
    print()
    
    # Send current metrics
    send_current_metrics()
    
    print("\n" + "="*50)
    print("Mock data generation complete!")
    print("  Open the dashboard to see the data:")
    print("  http://localhost:5173 (dev) or http://localhost:8000 (Docker)")
    print("="*50)


if __name__ == "__main__":
    main()
