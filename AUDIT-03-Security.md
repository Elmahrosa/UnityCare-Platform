# AUDIT-03: Security Audit Report

## AUTHENTICATION

### Session Handling
| Check | Result | Details |
|-------|--------|---------|
| Token invalidation | ✅ PASS | Logout blacklists token via `invalidatedTokens` array |
| Token expiry | ✅ PASS | JWT_EXPIRES_IN configurable (default 1h), refresh tokens 7d |
| Refresh token rotation | ✅ PASS | New refresh token issued on each refresh call |
| In-memory blacklist TTL cleanup | ✅ PASS | `setTimeout` cleanup on token blacklist in frontend/App.js |

### JWT Implementation
| Check | Result | Details |
|-------|--------|---------|
| Strong JWT_SECRET validation | ✅ PASS | envConfig.js warns if < 32 chars |
| Algorithm not specified | ⚠️ WARN | Uses `jsonwebtoken` defaults — RS256 not enforced |
| Token in body vs header | ✅ PASS | Access token via Authorization header |
| Refresh token in body | ⚠️ MINOR | POST body only — acceptable |

### RBAC Permissions
| Check | Result | Details |
|-------|--------|---------|
| requireRole middleware | ✅ PASS | Functional with role array check |
| Roles enforced on medical records | ✅ PASS | doctor/admin gate on create/update |
| Roles enforced on appointments | ✅ PASS | Patient/doctor access scoping |
| Roles enforced on analytics | ✅ PASS | admin/doctor gate |
| Default role is 'patient' | ✅ PASS | Safe default |

### Admin Privilege Escalation
| Check | Result | Details |
|-------|--------|---------|
| Registration role assignment | ✅ PASS | Default 'patient' enforced server-side |
| User update doesn't allow role change | ✅ PASS | updateUser only allows name/email/password |
| Admin-only routes use requireRole('admin') | ✅ PASS | User listing, record deletion, stats |
| No hardcoded admin creation in code | ✅ PASS | Admin must be created via DB |

### Password Security
| Check | Result | Details |
|-------|--------|---------|
| bcrypt rounds = 12 | ✅ PASS | Strong work factor |
| Pre-save hook hashing | ✅ PASS | Consistent hashing in model |
| Min length enforced | ✅ PASS | 8 chars (register), 6 chars (login) |
| No password in responses | ✅ PASS | `-password` in select() |

## API SECURITY

### Authorization Validation
| Check | Result | Details |
|-------|--------|---------|
| authMiddleware on protected routes | ✅ PASS | All private routes use middleware |
| NDA endpoint (nda.js) unauthenticated | ❌ FAIL | `POST /api/nda/request` has NO auth middleware |
| Blockchain route uses verifyToken | ✅ PASS | Named alias works |
| Consistent 401/403 responses | ✅ PASS | Proper status codes |

### Rate Limiting
| Check | Result | Details |
|-------|--------|---------|
| Global rate limit: 200 req/15min | ✅ PASS |
| Auth rate limit: 20 req/15min | ✅ PASS |
| No per-endpoint rate limits | ⚠️ MINOR | All routes share global limit |

### Input Validation
| Check | Result | Details |
|-------|--------|---------|
| express-validator on auth endpoints | ✅ PASS |
| express-validator on appointments | ✅ PASS |
| express-validator on medical records | ✅ PASS |
| express-validator on user update | ✅ PASS |
| No validation on NDA endpoint | ⚠️ MINOR | Only checks field existence |
| No validation on other route placeholders | ⚠️ MINOR | Accept any body |
| Request body size limit: 10mb | ✅ PASS | express.json limit |

### Injection Vulnerabilities
| Check | Result | Details |
|-------|--------|---------|
| No raw query concatenation | ✅ PASS | Uses Mongoose ORM |
| MongoDB injection via query params | ✅ PASS | Mongoose sanitizes |
| No eval() or exec() usage | ✅ PASS | |
| NDA email HTML injection | ❌ FAIL | Email HTML template uses unsanitized user input (`${fullName}`, `${organization}`, etc.) |

### SSRF
| Check | Result | Details |
|-------|--------|---------|
| Axios POST to ML_API_URL | ⚠️ WARN | analyticsController.js:40 — outbound HTTP to configurable URL |
| URL comes from env var | ✅ PASS | Not user-controllable directly |

### CSRF
| Check | Result | Details |
|-------|--------|---------|
| No CSRF tokens | ⚠️ WARN | Not implemented (JWT in header partially mitigates) |

### XSS
| Check | Result | Details |
|-------|--------|---------|
| helmet CSP configured | ✅ PASS | Production mode has CSP |
| No direct HTML rendering of user input | ✅ PASS | JSON responses only |
| NDA email template | ❌ FAIL | `${fullName}` etc. in HTML email body |
| CORS credentials not set | ✅ PASS | No `credentials: true` |

## SECRETS SCAN

### Hardcoded Secrets
| Location | Type | Severity |
|----------|------|----------|
| .env.example | Example passwords (change_me_now) | INFO — intended to be replaced |
| No actual API keys or tokens found | ✅ PASS | |

### Env Files
| Check | Result |
|-------|--------|
| .env files in .gitignore | ✅ (implicitly — not in repo index) |
| No committed .env files | ✅ PASS |

## SUPPLY CHAIN AUDIT

### Backend CVEs
| Package | CVE Count | Severity | Fix Available |
|---------|-----------|----------|---------------|
| tar (via @mapbox/node-pre-gyp) | 6 | HIGH (×6) | npm audit fix |

### Frontend CVEs
| Package | CVE Count | Severity | Fix Available |
|---------|-----------|----------|---------------|
| uuid (via sockjs via webpack-dev-server) | 1 | MODERATE | npm audit fix --force (breaking) |

### High-Risk Packages
| Package | Risk | Reason |
|---------|------|--------|
| bcrypt | CRITICAL | MUST use bcrypt (not bcryptjs) for Node 20+ compatibility — codebase uses both patterns historically but is now unified to bcrypt ✅ |
| jsonwebtoken | MEDIUM | No known CVEs in v9.x |
| tar | HIGH | 6 CVEs — transitive dependency via @mapbox/node-pre-gyp (needed by bcrypt) |

### Abandoned Packages
| Package | Status | Impact |
|---------|--------|--------|
| @mapbox/node-pre-gyp | MAINTAINED | Used by bcrypt build — no action needed |
| None others detected | ✅ | |
