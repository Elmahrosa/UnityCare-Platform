# UnityCare Platform — Monitoring Plan (Railway)

## Health Check Endpoints

| Service | Endpoint | Expected | Purpose |
|---------|----------|----------|---------|
| Backend | `/health` | `{"status":"healthy","database":"connected"}` | Primary health + DB check |
| Backend | `/status` | `{"app","version","environment","database"}` | Detailed status |
| Backend | `/version` | `{"app","version","framework","python"}` | Version info |
| Frontend | `/health` | `{"status":"healthy","app":"UnityCare MVP Frontend"}` | Frontend health |
| Frontend | `/status` | `{"app","version","framework","node"}` | Frontend status |
| Frontend | `/version` | `{"app","version","framework","node"}` | Frontend version |

## Railway Health Checks (Configured in railway.toml)

- **Backend**: `/health` every 30s, 30s timeout, restart on failure
- **Frontend**: `/health` every 30s, 10s timeout, restart on failure

## Monitoring Services

### Uptime Monitoring (Recommended)
- [UptimeRobot](https://uptimerobot.com) or [Better Stack](https://betterstack.com)
- Check `/health` on both services every 5 minutes
- Alert on 3 consecutive failures

### Railway Built-in Metrics
- CPU, Memory, Network — available in Railway Dashboard per service
- Alert thresholds: CPU > 80%, Memory > 85%

### Error Tracking (Recommended)
- Integrate Sentry or similar for backend error tracking

## Backups

### PostgreSQL (Railway Plugin)
- Railway provides automated daily backups
- Retention: 7 daily backups provided by default
- Download critical backups manually before schema changes

### Manual Backup Procedure
```bash
# Via Railway CLI
railway connect
pg_dump --no-owner -d "$DATABASE_URL" > unitycare-backup-$(date +%Y%m%d).sql
```

## Alert Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Health check failure | 3 consecutive | Restart service (auto via Railway) |
| Response time > 1s | Any | Investigate query performance |
| Error rate > 1% | Any | Check logs, rollback if needed |
| Disk usage > 80% | Any | Scale PostgreSQL storage |

## Runbook

### Service Down
```bash
# Check Railway Dashboard
# -> Service logs
# -> Restart service

# If persists:
# 1. Check DATABASE_URL connectivity
# 2. Verify env vars are set
# 3. Rollback to last working deploy
```

### Database Issues
```bash
# 1. Check Railway PostgreSQL dashboard
# 2. Verify connection string
# 3. Run alembic migrations if schema is stale:
#    alembic upgrade head
```

### Deployment Rollback
```bash
# Railway Dashboard -> Deployments -> Select previous -> Rollback
```

## Alerting & Notification

| Component | Tool / Method | Channel | Purpose |
|-----------|---------------|---------|---------|
| Uptime monitoring | [Better Stack](https://betterstack.com) / [Uptime Kuma](https://github.com/louislam/uptime-kuma) / [Statuspage](https://atlassian.com/software/statuspage) | Email, Slack webhook, SMS | Public status page + internal alerts |
| Incident alerts | Railway built-in + Better Stack heartbeat | Slack `#incidents` channel | 3 consecutive health check failures trigger alert |
| Crash/error alerts | Sentry error thresholds | Email + Slack `#errors` | Backend exception rate > threshold |
| Database alerts | Railway PostgreSQL metrics | Slack `#database` | Disk > 80%, connections > 80% of pool |

### Alert Severity Levels

| Severity | Label | Response SLA | Example |
|----------|-------|--------------|---------|
| P1 | Critical | < 15 min | Service down, DB unreachable |
| P2 | High | < 30 min | Response time > 2 s, error rate > 1% |
| P3 | Medium | < 2 hr | Disk > 80%, CPU > 85% |
| P4 | Low | < 24 hr | Deprecation warnings, minor metric drift |

### Alert Response Workflow

```
Trigger → Severity classification → Notify channel → Engineer acknowledges → Remediation → Resolved / Escalated
```

## Logging Strategy

### Backend Logs (Python — Structured JSON)

- **Format**: JSON lines (`logging.Formatter` → `json.dumps` via custom formatter)
- **Fields**: `timestamp`, `level`, `module`, `message`, `request_id`, `user_id`, `path`, `duration_ms`
- **Output**: stdout via Railway log collector (not written to disk in production)
- **Tool**: Python `logging` module with `structlog` or standard `JSONFormatter`

### Audit Trail Logs (Immutable SHA-256 Chain)

- **Separate logger**: `audit_logger` distinct from `app_logger`
- **Format**: `{ "hash": "sha256(prev_hash + event_data)", "prev_hash": "...", "event": "...", "actor": "...", "resource": "...", "timestamp": "...", "signature": "..." }`
- **Storage**: Written to a dedicated `audit_logs` table (append-only, triggers block UPDATE/DELETE)
- **Purpose**: HIPAA compliance, tamper-evident access history

### Frontend Logs

| Source | Capture Method | Destination |
|--------|----------------|-------------|
| Browser console (console.error, console.warn) | Custom `window.onerror` / `window.onunhandledrejection` handler | POST `/api/v1/logs/frontend` |
| React error boundaries | `ErrorBoundary` component → `componentDidCatch` | Sentry + custom endpoint |
| API failures | `fetch`/`axios` interceptor on 4xx/5xx | Sentry + custom endpoint |
| User analytics (non-PII) | `posthog` / `plausible` (opt-in) | External analytics platform |

### Log Retention Policy

| Log Type | Retention | Legal Basis | Action After Retention |
|----------|-----------|-------------|------------------------|
| Application logs | 30 days | Operational | Auto-purge via cron / log rotation |
| Audit trail logs | 7+ years | HIPAA §164.312(b) | Archive to cold storage (S3 Glacier / Azure Blob Archive) |
| Frontend error logs | 90 days | Debugging | Auto-purge |
| Railway deployment logs | 90 days | Railway default | Access via `railway logs --service backend --limit 100` |

## Database Monitoring

| Metric | Implementation | Threshold | Action |
|--------|----------------|-----------|--------|
| Connection pool usage | SQLAlchemy `pool_size=20`, `max_overflow=10` | < 25 active connections | Investigate leaked connections / increase pool |
| Query performance | PostgreSQL `log_min_duration_statement = 200ms` | Queries > 200 ms logged; > 1 s flagged | Optimize query / add index |
| Backup freshness | Automated `pg_dump` via cron or Railway scheduled task | Backup age > 24 h | Trigger manual backup |
| Disk space | Railway PostgreSQL dashboard + alert | > 80% used | Scale storage or archive old data |
| Replication lag | `pg_stat_replication` (if read replica used) | Lag > 5 s | Investigate replica / connection |

### Backup Schedule

```bash
# Automated via Railway scheduled task (cron: 0 4 * * *)
# Or via CI pipeline:
pg_dump -Fc -d "$DATABASE_URL" | gzip > "unitycare-$(date +%Y-%m-%d).sql.gz"
# Retention: 7 daily + 4 weekly + 12 monthly
```

## Incident Response Integration

```
Monitoring Alert
       │
       ▼
Alerting Channel (Slack #incidents)
       │
       ▼
Runbook consulted (MONITORING.md / Railway Dashboard)
       │
       ▼
Triage severity (P1–P4)
       │
       ▼
       ├── P1/P2  →  Incident Commander assigned → War room (Slack huddle / Zoom)
       │                 │
       │                 ├── Fix applied → Rolling deploy → Verify health
       │                 └── Root cause documented → Postmortem within 48 h
       │
       └── P3/P4  →  Engineer assigned → Normal ticket flow → Resolve within SLA
```

### Escalation Path

| Level | Role | Contact |
|-------|------|---------|
| L1 | On-call engineer | Slack @oncall / PagerDuty |
| L2 | Senior backend engineer | Slack / phone |
| L3 | DevOps / architect | Slack / phone |
| L4 | Platform admin (Railway) | Railway support |

## Railway-Specific Monitoring

| Feature | Details |
|---------|---------|
| Railpack auto-detection | Railway builds log shows detected buildpack. Verify in deploy log: `==> Detecting buildpack...` |
| Service logs | `railway logs --service backend --limit 100` — tail live with `--follow` |
| Deployment history | `railway logs --service backend --deployment <id>` |
| PostgreSQL plugin | Disk, connections, CPU in Railway Dashboard → PostgreSQL plugin page |
| Custom domain SSL | Railway auto-provisions Let's Encrypt certificates. Monitor renewal via Dashboard → Domains |
| Restart events | Recorded in service logs; cross-reference with health check failures |

### Railway Log Commands

```bash
# Backend logs (last 100 lines)
railway logs --service backend --limit 100

# Follow live logs
railway logs --service backend --follow

# Specific deployment
railway logs --service backend --deployment <deployment-id>
```

## Key Performance Indicators

| KPI | Target | Measurement | Method |
|-----|--------|-------------|--------|
| API response time p50 | < 200 ms | Backend metric | Prometheus / structured log `duration_ms` field |
| API response time p95 | < 500 ms | Backend metric | Prometheus / structured log aggregation |
| API response time p99 | < 1,000 ms | Backend metric | Prometheus / structured log aggregation |
| Uptime | 99.9 % | Health check pass rate | Better Stack / Railway uptime monitoring |
| Error rate | < 0.1 % | Failed requests / total requests | Sentry + backend `5xx` log count |
| Seed script integrity | Dry-run passes | CI check before deploy | `python scripts/seed_data.py --dry-run` |
| Database connection availability | < 1 % connection failures | SQLAlchemy pool stats | Health check `/health` DB connectivity |
| Alert response time (P1) | < 15 min | Incident timeline | Slack / PagerDuty timestamps |
