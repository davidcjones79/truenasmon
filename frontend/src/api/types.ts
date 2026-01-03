export interface System {
  id: string;
  name: string;
  hostname: string | null;
  version: string | null;
  client_name: string | null;
  last_seen: string;
}

export interface Metric {
  id: number;
  system_id: string;
  timestamp: string;
  metric_type: 'pool' | 'pool_health' | 'disk' | 'cpu' | 'memory' | 'network' | 'replication';
  metric_name: string;
  value: number;
  unit: string | null;
  metadata: Record<string, unknown> | null;
}

export interface Alert {
  id: number;
  system_id: string;
  system_name: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  acknowledged: boolean;
  ticket_id: string | null;
}

export interface DashboardSummary {
  total_systems: number;
  healthy_systems: number;
  stale_systems: number;
  alerts: {
    critical: number;
    warning: number;
    info: number;
  };
  total_storage_tb: number;
}

export interface TicketCreateRequest {
  alert_id: number;
  psa: 'autotask' | 'halo' | 'connectwise';
}

export interface TicketCreateResponse {
  status: string;
  ticket_id: string;
  psa: string;
  message: string;
}

// Disk/SMART types
export interface DiskAttribute {
  value: number;
  unit: string | null;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface DiskInfo {
  disk_id: string;
  system_id: string;
  last_updated: string;
  metrics: {
    temperature?: DiskAttribute;
    smart_status?: DiskAttribute;
    power_hours?: DiskAttribute;
    reallocated_sectors?: DiskAttribute;
    pending_sectors?: DiskAttribute;
    read_errors?: DiskAttribute;
  };
  history: Array<{
    attribute: string;
    value: number;
    timestamp: string;
  }>;
}

export interface SystemDisks {
  system_id: string;
  system_name: string;
  client_name: string | null;
  disks: Record<string, {
    disk_id: string;
    attributes: Record<string, DiskAttribute>;
  }>;
}

export interface DisksSummary {
  total_disks: number;
  healthy_disks: number;
  warnings: number;
  critical: number;
  smart_failures: number;
  avg_temperature: number | null;
  hottest_disk: {
    disk: string;
    temperature: number;
    system_id: string;
  } | null;
}

// Replication types
export interface ReplicationAttribute {
  value: number;
  unit: string | null;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ReplicationTask {
  task_id: string;
  system_id: string;
  last_updated: string;
  metrics: {
    status?: ReplicationAttribute;
    last_run?: ReplicationAttribute;
    bytes?: ReplicationAttribute;
    duration?: ReplicationAttribute;
  };
  history: Array<{
    attribute: string;
    value: number;
    timestamp: string;
  }>;
}

export interface SystemReplications {
  system_id: string;
  system_name: string;
  client_name: string | null;
  tasks: Record<string, {
    task_id: string;
    attributes: Record<string, ReplicationAttribute>;
  }>;
}

export interface ReplicationSummary {
  total_tasks: number;
  healthy_tasks: number;
  failed_tasks: number;
  stale_tasks: number;
  last_success: string | null;
  oldest_stale: {
    task: string;
    system_id: string;
    hours_ago: number;
  } | null;
}

// Pool Health types
export interface PoolHealthAttribute {
  value: number;
  unit: string | null;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PoolHealth {
  pool_name: string;
  system_id: string;
  last_updated: string;
  metrics: {
    used?: PoolHealthAttribute;
    total?: PoolHealthAttribute;
    state?: PoolHealthAttribute;
    scrub_status?: PoolHealthAttribute;
    scrub_last?: PoolHealthAttribute;
    scrub_duration?: PoolHealthAttribute;
    scrub_errors?: PoolHealthAttribute;
    checksum_errors?: PoolHealthAttribute;
    resilver_status?: PoolHealthAttribute;
    resilver_progress?: PoolHealthAttribute;
  };
  history: Array<{
    attribute: string;
    value: number;
    timestamp: string;
  }>;
}

export interface SystemPools {
  system_id: string;
  system_name: string;
  client_name: string | null;
  pools: Record<string, {
    pool_name: string;
    attributes: Record<string, PoolHealthAttribute>;
  }>;
}

export interface PoolsSummary {
  total_pools: number;
  healthy_pools: number;
  degraded_pools: number;
  needs_scrub: number;
  active_resilvers: number;
  capacity_warnings: number;
  total_capacity_tb: number;
  used_capacity_tb: number;
}

// Auth types
export type UserRole = 'admin' | 'operator' | 'viewer';

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  username: string; // OAuth2 uses username field (will be email)
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  must_change_password?: boolean;
}

export interface UserCreateRequest {
  email: string;
  password: string;
  full_name?: string;
  role: UserRole;
}

export interface UserUpdateRequest {
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface PasswordResetResponse {
  status: string;
  message: string;
  temporary_password: string;
}
