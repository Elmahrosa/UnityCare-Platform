# Contributing to UnityCare

Thank you for your interest. This document covers everything you need to contribute effectively.

## Quick Start

```bash
# Backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # edit DATABASE_URL, JWT_SECRET
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install
cp .env.example .env.local  # set NEXT_PUBLIC_API_URL
npm run dev
```

## Before You Commit

```bash
# Backend
cd backend && pip install ruff && ruff check app/

# Frontend
cd frontend && npm run lint && npx tsc --noEmit && npm test
```

## Pull Request Process

1. Create a feature branch: `feat/description` or `fix/description`
2. Make focused commits using [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation
   - `refactor:` code change without feature/fix
   - `test:` adding tests
   - `chore:` maintenance
   - `ci:` CI/CD changes
3. Run all checks from "Before You Commit" above
4. Open PR against `main` with a clear description of what and why
5. A maintainer will review — address all feedback before merge

## Code Style

- **Python**: PEP 8 enforced via `ruff`. Run `ruff check app/` before every commit.
- **TypeScript**: Strict mode in `tsconfig.json`. Run `npx tsc --noEmit` to check types.
- **No commented-out code** — delete it. Git history preserves it if needed.
- **No hardcoded secrets** — use env vars. Add placeholders to `.env.example`.

## Testing

- Backend: `cd backend && python -m pytest tests/ -v --tb=short`
- Frontend: `cd frontend && npm test`
- All tests must pass before merge. Add tests for new functionality.

## Documentation

- Update relevant docs (`DEPLOYMENT.md`, `MONITORING.md`, etc.) when changing behavior
- Keep `CHANGELOG.md` updated via `./scripts/release.sh`
- For API changes, update the relevant endpoint documentation

## Security

**Do not** report security issues publicly via GitHub Issues. Email **security@elmahrosa.org**. We will respond within 24 hours and coordinate disclosure.

## Getting Help

- Open a GitHub Discussion for questions
- Tag maintainers on PRs for review
- See `ARCHITECTURE.md` for system overview

Thank you for contributing.
