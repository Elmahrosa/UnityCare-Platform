# AUDIT-02: Code Quality Audit

## TypeScript Validation
**Result: 155 ERRORS**

### Critical TS Errors
```
TS2307: Cannot find module '@trpc/client'               — useAuth.ts
TS2307: Cannot find module 'lucide-react'                — 20+ files
TS2307: Cannot find module '@radix-ui/react-*'           — 30+ ui component files
TS2307: Cannot find module '@tanstack/react-query'       — main.tsx
TS2307: Cannot find module 'clsx' / 'tailwind-merge'     — utils.ts
TS2307: Cannot find module 'wouter'                      — DashboardLayout.tsx
TS2307: Cannot find module '@shared/const'               — const.ts
TS2307: Cannot find module '../../../server/routers'     — trpc.ts
TS2339: Property 'env' does not exist on type 'ImportMeta' — const.ts, Map.tsx
```

**Root Cause**: Frontend `package.json` is missing ~30 critical dependencies. TypeScript cannot resolve any of the shadcn/ui component imports.

## ESLint
**Result**: Backend ESLint config uses `.eslintrc` format but ESLint v10 requires `eslint.config.js`. Frontend ESLint plugin `@typescript-eslint/eslint-plugin` missing (in config but not installed).

## Dead Code Detection

### Dead Backend Files
| File | Reason |
|------|--------|
| backend/src/services/authService.js | Duplicates authController.js logic — never directly called by routes |
| backend/src/services/userService.js | Duplicates userController.js — unreferenced from routes |

### Dead Route Placeholders
All 5 return `{ok: true, message: '... placeholder.'}` — no real logic:
- blockchainRoutes.js
- careOrchestrationRoutes.js
- chatbotRoutes.js
- iotRoutes.js
- monitoringRoutes.js

### Dead/Misplaced Frontend Files
| File | Problem |
|------|---------|
| frontend/src/App.js | BACKEND auth controller placed in frontend dir |
| frontend/src/services/apiService.js | Is actually a README/license file, not an API service |
| frontend/src/lib/trpc.ts | References tRPC backend that doesn't exist in project |
| frontend/src/_core/hooks/useAuth.ts | Uses tRPC which isn't set up |

### Dead Root-Level Files
- `vercel.json` — references `website/` dir that doesn't exist; Vercel not configured for Railway
- `package.json` — references 'next' ^16.2.1, 'octokit', express ^5.2.1 — not used anywhere

## Dependency Conflicts

| Issue | Details | Severity |
|-------|---------|----------|
| Backend: Express versions differ | Root: ^5.2.1, Backend: ^4.19.2 | HIGH |
| Frontend: React versions differ | Root: ^18.3.1, Frontend: ^18.2.0 | LOW |
| Root has 'next' ^16.2.1 | Not used in frontend or backend — possibly from incorrect merge | SUSPICIOUS |
| Root has 'octokit' ^5.0.5 | Not used anywhere in the project | SUSPICIOUS |
| Root has mongoose ^9.3.3 as devDep | Backend uses mongoose ^8.5.1 as direct dep | MEDIUM |

## Build Warnings

- Backend `npm install`: 2 high-severity CVEs (`tar` via `@mapbox/node-pre-gyp`)
- Frontend npm install: 3 moderate-severity CVEs (`uuid` via `sockjs` via `webpack-dev-server`)
- Frontend build: WILL FAIL due to missing dependencies and missing webpack/vite config
- No `npm run build` script works — both backend and frontend build configurations are incomplete/missing

## Runtime Risks

| Risk | Impact | Location |
|------|--------|----------|
| Missing `website/` directory | Nginx container crashes on startup | docker-compose.yml:50, nginx.conf:5 |
| dbConfig uses deprecated MongoDB options | Mongoose 8+ compatibility warnings | backend/src/config/dbConfig.js:11-12 |
| No error handler in catch blocks | Silent failures | Multiple controllers (console.error but no user feedback beyond 500) |
| schema.sql is a JS file | Misleading — not actually SQL schema | database/schema.sql |
