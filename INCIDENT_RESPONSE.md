# UnityCare Incident Response Plan

**Platform:** UnityCare Sovereign Healthcare Infrastructure
**Version:** 1.0.0
**Last Updated:** 2026-07-03
**Owner:** Security Operations — Elmahrosa International

## 1. Incident Classification

| Severity | Level | Examples |
|---|---|---|
| **Critical** | P0 | Mass PHI exfiltration via API, audit chain tampering detected, ransomware on production database, consent records bulk-modified |
| **High** | P1 | Unauthorized access to a patient cohort (10+ records), credential stuffing breach, FHIR API data corruption, prolonged service outage (>30 min) |
| **Medium** | P2 | Single patient record accessed without authorization, rate-limit bypass attempt, failed login spike from single IP, expired TLS certificate |
| **Low** | P3 | Misconfigured security header, stale consent version detected, phishing report with no compromise, minor audit log gap |

## 2. Response Team

| Role | Responsibility |
|---|---|
| **Security Lead** | Directs technical response, forensics, chain verification |
| **Technical Lead** | Backend/Frontend remediation, Railway/on-prem infrastructure |
| **Communications Lead** | Internal status updates, regulatory notifications, public statements |
| **Legal/Compliance** | HIPAA/GDPR/PDPL breach notification, law enforcement liaison |

**Contact Order:** Security Lead → Technical Lead + Legal (parallel) → Communications (within 1 hour)

## 3. Response Phases

### Detection
- Monitoring alert (Better Stack / Railway health check failure)
- User report of suspicious activity
- Audit chain verification failure
- Automated scan finding

### Triage (15 min)
1. Classify severity (P0-P3)
2. Assign incident lead
3. Open incident channel (Slack #incidents)
4. Begin timeline document

### Containment (30 min)
1. If active breach: isolate affected component
2. Rotate secrets: `JWT_SECRET`, `ENCRYPTION_KEY`
3. Revoke all sessions: `DELETE FROM sessions;`
4. Enable rate limiting if disabled
5. Consider read-only mode for database

### Eradication (2 hr)
1. Identify root cause
2. Patch vulnerability
3. Verify audit chain integrity
4. Run full test suite
5. Deploy fixed version

### Recovery (1 hr)
1. Restore from clean backup if needed
2. Verify all services healthy at `/health` and `/ready`
3. Re-enable full write access
4. Monitor for recurrence

### Postmortem (48 hr)
1. Document timeline
2. Identify process gaps
3. Update runbooks
4. Implement preventive measures

## 4. Regulatory Notification Timelines

| Regulation | Breach Type | Notification Deadline | Notify |
|---|---|---|---|
| HIPAA | 500+ patients | 60 days | OCR, affected patients |
| GDPR | Any personal data | 72 hours | Supervisory authority |
| Saudi PDPL | Any personal data | 72 hours | SDAIA |
| Egypt Law 151 | Health data | 7 days | Ministry of Health |

## 5. Escalation

| Level | Role | Contact |
|---|---|---|
| L1 | On-call engineer | Slack @oncall |
| L2 | Senior backend engineer | Slack / phone |
| L3 | DevOps / architect | Slack / phone |
| L4 | Platform admin (Railway) | Railway support |

## 6. Recovery Procedures

See [RUNBOOKS.md](./RUNBOOKS.md) for step-by-step recovery runbooks covering:
- Service down
- High latency
- Database recovery
- Security incident
- Release rollback
- Disk space alert
