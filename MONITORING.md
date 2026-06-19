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
