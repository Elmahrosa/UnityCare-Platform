# UnityCare Platform — Operational Runbooks

## Service Down

### Symptoms
- Health check returns `status: degraded` or 5xx
- Railway dashboard shows service restarts
- Users report 502/503 errors

### Diagnosis
```bash
# 1. Check Railway logs
railway logs --service backend --limit 50 --follow

# 2. Check health endpoint
curl -s https://health.elmahrosa.org/health | jq .

# 3. Check readiness
curl -s https://health.elmahrosa.org/ready | jq .

# 4. Check metrics
curl -s https://health.elmahrosa.org/metrics | grep -E "http_requests_total|http_request_duration"
```

### Resolution
1. If `/health` returns `database: disconnected`:
   - Check Railway PostgreSQL plugin dashboard for connection limits
   - Restart PostgreSQL plugin from Railway dashboard
   - If persists, rollback to last known good deploy

2. If backend returns 5xx:
   - Check logs for unhandled exceptions
   - Verify `JWT_SECRET` and `ENCRYPTION_KEY` env vars are set
   - Rollback: `./scripts/rollback.sh`

3. If frontend returns 5xx:
   - Check frontend logs
   - Verify `NEXT_PUBLIC_API_URL` points to correct backend
   - Restart service from Railway dashboard

## High Latency

### Symptoms
- API response times > 1s
- Health check timeouts
- User complaints about slow page loads

### Diagnosis
```bash
# Check metrics for slow endpoints
curl -s https://health.elmahrosa.org/metrics | grep http_request_duration_seconds

# Check database query performance
railway logs --service backend --limit 100 | grep -E "duration_ms\":[0-9]{4,}"
```

### Resolution
1. Identify slow endpoint from metrics
2. Check for missing database indexes: `\di` in psql
3. Verify connection pool isn't exhausted
4. Scale backend workers if CPU-bound: increase `--workers` in start.sh

## Database Recovery

### Symptoms
- `/health` returns `database: disconnected`
- Backend logs show connection errors
- Railway PostgreSQL dashboard shows errors

### Diagnosis
```bash
# Check connectivity
railway connect
psql "$DATABASE_URL" -c "SELECT 1"

# Check connection count
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity;"

# Check disk usage
psql "$DATABASE_URL" -c "SELECT pg_size_pretty(pg_database_size(current_database()));"
```

### Resolution
1. **Connection spike**: Restart backend service to release connections
2. **Disk full**: Scale PostgreSQL storage from Railway dashboard
3. **Corruption**: Restore from latest backup:
   ```bash
   pg_restore --clean --no-owner -d "$DATABASE_URL" unitycare-backup.sql
   ```

## Security Incident

### Symptoms
- Audit chain verification fails: `chain_valid: false`
- Suspicious login patterns in audit log
- Unauthorized access reports

### Immediate Actions
1. **DO NOT** delete or modify audit log entries — tampering destroys evidence
2. Run chain verification:
   ```bash
   curl -s https://health.elmahrosa.org/api/v1/audit/verify | jq .
   ```
3. Rotate all secrets:
   ```bash
   railway variables set JWT_SECRET=$(openssl rand -hex 48)
   railway variables set ENCRYPTION_KEY=$(openssl rand -hex 16)
   ```
4. Revoke all sessions:
   ```bash
   # Delete from sessions table via psql
   psql "$DATABASE_URL" -c "DELETE FROM sessions;"
   ```
5. Notify security team: security@elmahrosa.org
6. Document timeline in INCIDENT_RESPONSE.md

## Release Rollback

### Symptoms
- New deploy causes errors or degradation
- Feature flag toggle doesn't resolve issue

### Procedure
```bash
# Quick rollback via script
./scripts/rollback.sh

# Manual rollback
git checkout main
git reset --hard <previous-tag>
git push origin main --force
```

Verify rollback succeeded:
```bash
curl -s https://health.elmahrosa.org/version | jq .
```

## Disk Space Alert

### Symptoms
- Railway alert: PostgreSQL disk > 80%
- Database writes start failing

### Resolution
1. Archive old audit data:
   ```bash
   psql "$DATABASE_URL" -c "SELECT count(*) FROM audit_logs WHERE timestamp < now() - interval '90 days';"
   # Export and truncate
   ```
2. Clean old deployment artifacts from Railway
3. Scale storage from Railway dashboard
