# Architecture Overview
**Unity Care Hospital (UCH) — Technical Brief for CTO/CIO Review**  
*Confidential — Elmahrosa International*

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express.js |
| Database | MongoDB 7 |
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| Authentication | JWT (access + refresh tokens) |
| Password Security | bcrypt (12 rounds) |

---

## System Architecture

```
┌─────────────────────────────────────────────┐
│              Institution Network             │
│                                             │
│  ┌──────────┐    ┌──────────────────────┐   │
│  │  Nginx   │───▶│   Node.js API        │   │
│  │  :80/443 │    │   Express + JWT      │   │
│  └──────────┘    │   Port 5000          │   │
│                  └──────────┬───────────┘   │
│                             │               │
│                  ┌──────────▼───────────┐   │
│                  │   MongoDB 7          │   │
│                  │   Institution-owned  │   │
│                  └──────────────────────┘   │
└─────────────────────────────────────────────┘
```

- All components run within the institution's own infrastructure
- No external API calls or third-party data dependencies
- Fully containerized via Docker Compose for repeatable deployment

---

## API Modules

| Module | Routes | Description |
|---|---|---|
| Auth | `/api/auth/*` | Login, refresh, logout with token blacklist |
| Users | `/api/users/*` | Registration, profile, admin user list |
| Appointments | `/api/appointments/*` | Booking, update, cancel, doctor/patient views |
| Medical Records | `/api/records/*` | Create, read, update, soft-delete, GDPR export |
| Analytics | `/api/analytics/*` | Trends, stats, diagnosis breakdown |
| Health | `/health` | Container health check |

---

## Security Controls

| Control | Implementation |
|---|---|
| Authentication | JWT access (1h) + refresh (7d), separate secrets |
| Password Hashing | bcrypt, 12 rounds |
| Real Logout | Token blacklist in User model |
| RBAC | `requireRole()` middleware on all protected routes |
| Rate Limiting | Global 200 req/15min, Auth 20 req/15min |
| Security Headers | Helmet.js |
| Input Validation | express-validator on all mutation routes |
| GDPR | Soft-delete + data export on MedicalRecord |
| Audit Logging | Full action trail per user/session |
| Graceful Shutdown | SIGTERM handler for zero-downtime deploys |

---

## Deployment Topology Options

### Single Facility
```
Docker Compose → Single VPS/VM → Institution firewall
```

### Multi-Facility (Regional)
```
Load Balancer → Multiple API instances → Shared MongoDB cluster
```

### Air-Gapped (National/Government)
```
Fully offline → No internet dependency → Local network only
→ Available for sovereign national programs
```

---

## Roadmap (Milestone-Gated)

| Module | Status |
|---|---|
| Core platform (auth, patients, appointments, records, analytics) | ✅ Production |
| Telemedicine WebRTC | ✅ Foundation complete |
| Blockchain audit notarization | 🔲 Milestone 2 |
| IoT vitals integration | 🔲 Milestone 2 |
| AI triage assistant | 🔲 Milestone 3 |
| Insurance API integration | 🔲 Milestone 3 |

---

## Data Residency

- Institution controls all data storage location
- No data leaves the institution's infrastructure
- Air-gapped deployment eliminates external network dependency entirely

---

*Full technical documentation available under NDA — contact info@uch.teosegypt.com*
