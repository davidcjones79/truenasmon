import axios from 'axios';
import type { System, Metric, Alert, DashboardSummary, TicketCreateRequest, TicketCreateResponse, DiskInfo, SystemDisks, DisksSummary, ReplicationTask, SystemReplications, ReplicationSummary, PoolHealth, SystemPools, PoolsSummary, User, LoginResponse, UserCreateRequest, UserUpdateRequest, PasswordChangeRequest, PasswordResetResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Auth token management
const TOKEN_KEY = 'truenas_mon_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredToken();
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export async function login(email: string, password: string): Promise<LoginResponse> {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const { data } = await api.post<LoginResponse>('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  setStoredToken(data.access_token);

  // Store must_change_password flag if present
  if (data.must_change_password) {
    localStorage.setItem('must_change_password', 'true');
  } else {
    localStorage.removeItem('must_change_password');
  }

  return data;
}

export function getMustChangePassword(): boolean {
  return localStorage.getItem('must_change_password') === 'true';
}

export function clearMustChangePassword(): void {
  localStorage.removeItem('must_change_password');
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<User>('/auth/me');
  return data;
}

export async function changePassword(request: PasswordChangeRequest): Promise<void> {
  await api.post('/auth/change-password', request);
}

export async function logout(): Promise<void> {
  try {
    // Call logout endpoint to invalidate session on server
    await api.post('/auth/logout');
  } catch {
    // Ignore errors - we're logging out anyway
  }
  clearStoredToken();
  clearMustChangePassword();
  window.location.href = '/login';
}

// User management API functions
export async function getUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>('/users');
  return data;
}

export async function createUser(request: UserCreateRequest): Promise<User> {
  const { data } = await api.post<User>('/users', request);
  return data;
}

export async function updateUser(userId: number, request: UserUpdateRequest): Promise<User> {
  const { data } = await api.put<User>(`/users/${userId}`, request);
  return data;
}

export async function deleteUser(userId: number): Promise<void> {
  await api.delete(`/users/${userId}`);
}

export async function resetUserPassword(userId: number): Promise<PasswordResetResponse> {
  const { data } = await api.post<PasswordResetResponse>(`/users/${userId}/reset-password`);
  return data;
}

// Dashboard
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>('/dashboard/summary');
  return data;
}

// Systems
export async function getSystems(): Promise<System[]> {
  const { data } = await api.get<System[]>('/systems');
  return data;
}

export async function getSystemMetrics(
  systemId: string,
  options?: { hours?: number; metricType?: string }
): Promise<Metric[]> {
  const params = new URLSearchParams();
  if (options?.hours) params.set('hours', options.hours.toString());
  if (options?.metricType) params.set('metric_type', options.metricType);

  const { data } = await api.get<Metric[]>(`/systems/${systemId}/metrics?${params}`);
  return data;
}

// Alerts
export async function getAlerts(acknowledged?: boolean): Promise<Alert[]> {
  const params = acknowledged !== undefined ? `?acknowledged=${acknowledged}` : '';
  const { data } = await api.get<Alert[]>(`/alerts${params}`);
  return data;
}

export async function acknowledgeAlert(alertId: number): Promise<void> {
  await api.post(`/alerts/${alertId}/acknowledge`);
}

export async function createTicket(request: TicketCreateRequest): Promise<TicketCreateResponse> {
  const { data } = await api.post<TicketCreateResponse>(
    `/alerts/${request.alert_id}/create-ticket`,
    request
  );
  return data;
}

// Disks
export async function getSystemDisks(systemId: string, hours?: number): Promise<DiskInfo[]> {
  const params = hours ? `?hours=${hours}` : '';
  const { data } = await api.get<DiskInfo[]>(`/systems/${systemId}/disks${params}`);
  return data;
}

export async function getAllDisks(): Promise<SystemDisks[]> {
  const { data } = await api.get<SystemDisks[]>('/disks');
  return data;
}

export async function getDisksSummary(): Promise<DisksSummary> {
  const { data } = await api.get<DisksSummary>('/disks/summary');
  return data;
}

// Replication
export async function getSystemReplication(systemId: string, hours?: number): Promise<ReplicationTask[]> {
  const params = hours ? `?hours=${hours}` : '';
  const { data } = await api.get<ReplicationTask[]>(`/systems/${systemId}/replication${params}`);
  return data;
}

export async function getAllReplication(): Promise<SystemReplications[]> {
  const { data } = await api.get<SystemReplications[]>('/replication');
  return data;
}

export async function getReplicationSummary(): Promise<ReplicationSummary> {
  const { data } = await api.get<ReplicationSummary>('/replication/summary');
  return data;
}

// Pools
export async function getSystemPools(systemId: string): Promise<PoolHealth[]> {
  const { data } = await api.get<PoolHealth[]>(`/systems/${systemId}/pools`);
  return data;
}

export async function getAllPools(): Promise<SystemPools[]> {
  const { data } = await api.get<SystemPools[]>('/pools');
  return data;
}

export async function getPoolsSummary(): Promise<PoolsSummary> {
  const { data } = await api.get<PoolsSummary>('/pools/summary');
  return data;
}

export { api };
