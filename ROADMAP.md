# TrueNAS Fleet Monitor - Product Roadmap

> A modern monitoring dashboard for TrueNAS systems, built for MSPs and homelab enthusiasts.

---

## Vision

Create the most intuitive and comprehensive TrueNAS fleet monitoring solution that provides real-time visibility, predictive insights, and seamless alerting—all from a single pane of glass.

---

## Phase 1: Core Monitoring ✅ COMPLETE

### Completed
- [x] Multi-system dashboard with health overview
- [x] Real-time system status indicators
- [x] Storage pool capacity visualization
- [x] Alert management with acknowledge/dismiss
- [x] Dark/light mode with customizable accent colors
- [x] Favorites/pinned systems
- [x] System notes and documentation
- [x] Responsive design for mobile/tablet
- [x] Webhook endpoint for n8n/automation integration
- [x] Historical data retention (48 hours)

---

## Phase 2: Disk Health & SMART ✅ COMPLETE

### Completed
- [x] SMART dashboard - view all SMART attributes per disk
- [x] Health trends - track reallocated sectors, pending sectors over time
- [x] Temperature monitoring with historical trends
- [x] Power-on hours tracking
- [x] Read error counts
- [x] Disk model and serial number visibility
- [x] Per-system disk breakdown

---

## Phase 3: Replication & Backup Monitoring ✅ COMPLETE

### Completed
- [x] Replication status - real-time task status (running/completed/failed)
- [x] Last success timestamp - when was each dataset last replicated
- [x] Stale task detection - alert if backup is older than threshold
- [x] Transfer metrics - bytes transferred per replication
- [x] Duration tracking per task
- [x] Source/destination visibility

---

## Phase 4: Pool Health & ZFS Insights ✅ COMPLETE

### Completed
- [x] Scrub monitoring - last scrub date, duration, errors found
- [x] Resilver tracking - progress and status during resilver
- [x] Checksum error tracking
- [x] Pool state monitoring (online/degraded)
- [x] Capacity tracking with usage percentages
- [x] Scrub error counts

### Remaining
- [ ] Capacity forecasting - predict when pool will reach capacity
- [ ] Pool history - historical view of pool health events
- [ ] Deduplication stats

---

## Phase 5: User Management & Security ✅ COMPLETE

### Completed
- [x] JWT-based authentication
- [x] Role-based access control (Admin, Operator, Viewer)
- [x] User management (create, edit, deactivate)
- [x] Password reset with temporary passwords
- [x] Profile page with password change
- [x] Session timeout with warning (30 min idle)
- [x] Auto-logout with "Stay Logged In" option
- [x] Protected API endpoints

---

## Phase 6: UX Enhancements ✅ COMPLETE

### Completed
- [x] Toast notification system (success/error/warning/info)
- [x] Role-based UI (hide features from viewers)
- [x] Loading skeletons
- [x] Collapsible sidebar
- [x] Integration guide with copy-to-clipboard
- [x] Card and list view modes for alerts

---

## Phase 7: App & Container Monitoring

### Objectives
Monitor Docker/Kubernetes workloads running on TrueNAS SCALE.

### Features
| Feature | Priority | Description |
|---------|----------|-------------|
| Container Status | High | Running, stopped, crashed states |
| Auto-Restart Alerts | High | Notify when containers restart unexpectedly |
| Resource Usage | Medium | CPU/memory per container |
| Log Aggregation | Medium | Centralized container logs |
| Health Checks | Medium | Custom health check endpoints |
| Update Notifications | Low | Alert when container images have updates |

### Technical Approach
- Docker API integration for container stats
- Kubernetes API for TrueNAS SCALE apps
- Prometheus metrics collection

---

## Phase 8: Enhanced Notifications

### Objectives
Flexible, powerful alerting that reaches users where they are.

### Features
| Feature | Priority | Description |
|---------|----------|-------------|
| Discord Webhook | High | Native Discord integration |
| Email Notifications | High | SMTP-based email alerts |
| Generic Webhook | High | Custom webhook for any service |
| Alert Digest | Medium | Hourly/daily summary emails |
| Severity Routing | Medium | Different channels per severity |
| Maintenance Windows | Medium | Suppress alerts during maintenance |
| Escalation Policies | Low | Auto-escalate unacknowledged alerts |

### Technical Approach
- Webhook dispatcher with retry logic
- Template system for notification formatting
- Schedule-based alert suppression

---

## Phase 9: Hardware Monitoring

### Objectives
Monitor hardware health beyond just disks.

### Features
| Feature | Priority | Description |
|---------|----------|-------------|
| GPU Monitoring | High | Utilization, temperature, transcoding sessions |
| UPS Integration | High | Battery level, runtime, power events |
| CPU/Memory Trends | Medium | Historical resource utilization |
| Network Interfaces | Medium | Throughput, errors, connection counts |
| IPMI Sensors | Low | Fan speeds, voltages, temperatures |
| Power Consumption | Low | Track power usage over time |

### Technical Approach
- NVIDIA/AMD GPU APIs for GPU stats
- NUT integration for UPS monitoring
- SNMP for network device metrics

---

## Phase 10: Fleet Management

### Objectives
Enterprise features for managing large TrueNAS deployments.

### Features
| Feature | Priority | Description |
|---------|----------|-------------|
| System Groups | High | Organize systems by client/location |
| Fleet Comparison | High | Side-by-side system comparison |
| Health Heatmap | Medium | Visual overview of all systems |
| Bulk Operations | Medium | Apply settings to multiple systems |
| Scheduled Reports | Medium | Weekly/monthly PDF reports |
| Audit Logging | Medium | Track all user actions |
| Multi-tenant | Low | Separate data per client/organization |

### Technical Approach
- Hierarchical system organization
- Report generation with PDF export
- Comprehensive event logging

---

## Technical Debt & Infrastructure

### Performance
- [ ] Implement data retention policies (configurable)
- [ ] Add database indexing for large deployments
- [ ] Optimize API queries with caching
- [ ] Code splitting for faster initial load

### Reliability
- [x] Add health check endpoints
- [ ] Implement graceful degradation
- [x] Add comprehensive error handling

### Developer Experience
- [ ] API documentation (OpenAPI/Swagger)
- [ ] End-to-end testing suite
- [ ] CI/CD pipeline
- [ ] Docker containerization

---

## Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Time to detect failure | < 5 minutes | ✅ Achieved |
| False positive rate | < 5% | ✅ Achieved |
| Dashboard load time | < 2 seconds | ✅ Achieved |
| Uptime | 99.9% | Target |

---

## Community Feedback Sources

- [TrueNAS Community Forums](https://forums.truenas.com)
- [TrueNAS Subreddit](https://reddit.com/r/truenas)
- [Homelab Subreddit](https://reddit.com/r/homelab)
- GitHub Issues (coming soon)

---

*Last updated: January 2026*
