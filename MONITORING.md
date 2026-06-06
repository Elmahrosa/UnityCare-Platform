# UnityCare Platform — Post-Launch Monitoring Plan

## Health Check Endpoints

| Endpoint | Frequency | Expected | Action on Failure |
|----------|-----------|----------|-------------------|
| GET /health | 30s | `{"status":"ok"}` | Restart container |
| GET /ready | 30s | 200 OK | Check MongoDB connection |

## Metrics to Monitor

### API Server
| Metric | Threshold | Alert |
|--------|-----------|-------|
| Response time p95 | < 500ms | > 1s → warn, > 3s → critical |
| Request rate | < 1000 req/min | > 1000 → scale investigation |
| Error rate (5xx) | < 1% | > 5% → page |
| 401/403 rate | < 50/min | > 100/min → possible brute force |

### MongoDB
| Metric | Threshold | Alert |
|--------|-----------|-------|
| Connection count | < 100 | > 100 → connection pool warn |
| Disk usage | < 80% | > 80% → add storage |
| Replication lag | < 10s | > 30s → investigate |

### Docker
| Metric | Threshold | Alert |
|--------|-----------|-------|
| Container restarts | 0 | Any restart → investigate |
| CPU usage | < 80% | > 80% → scale |
| Memory usage | < 85% | > 85% → OOM risk |

## Logging

All services log to stdout (Docker). Key log patterns:

```bash
# Watch API logs
docker-compose logs -f --tail=100 api

# Filter errors
docker-compose logs api | grep "error" -i

# Rate limit hits
docker-compose logs api | grep "Too many requests"
```

## Automated Alerts (Recommended Setup)

1. **Docker healthchecks** — built-in (30s interval)
2. **Uptime monitoring** — Use uptimerobot.com or similar for /health
3. **Log aggregation** — Deploy Grafana Loki or similar for log search
4. **Metrics** — Prometheus + Grafana dashboard
5. **Downtime alert** — Email/PagerDuty on 3 consecutive failed healthchecks

## Runbook

### API Not Responding
```bash
# Check container status
docker-compose ps

# View recent logs
docker-compose logs --tail=50 api

# Restart
docker-compose restart api

# Full rebuild if needed
docker-compose up --build -d
```

### MongoDB Connection Issues
```bash
# Check MongoDB
docker-compose logs --tail=20 mongo

# Verify connectivity from API container
docker-compose exec api node -e "require('mongoose').connect('mongodb://mongo:27017/unity_care_hospital').then(()=>console.log('OK')).catch(e=>console.log(e.message))"
```

### Rate Limiting Issues
- Check if legitimate users are hitting limits
- Adjust `max` in `server.js` rate limiter config
- Whitelist trusted IPs if behind corporate proxy
