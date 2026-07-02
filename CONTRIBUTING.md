# Contributing to UnityCare

Thank you for your interest in contributing to UnityCare! We welcome contributions from everyone — whether you're fixing a bug, proposing a feature, or improving documentation.

## How to Report Bugs

If you find a bug, please open a [GitHub Issue](https://github.com/Elmahrosa/UnityCare/issues) using the **Bug Report** template. Include:

- A clear, descriptive title.
- Steps to reproduce the issue.
- Expected vs. actual behavior.
- Screenshots or logs if applicable.
- Environment details (OS, browser, Python/Node.js version).

## How to Suggest Features

Open a [GitHub Issue](https://github.com/Elmahrosa/UnityCare/issues) using the **Feature Request** template. Describe the problem you want to solve and your proposed solution. We encourage discussion before implementation.

## Development Setup

### Backend

- **Python 3.12+** is required.
- Navigate to `backend/` and create a virtual environment:
  ```bash
  python -m venv .venv
  source .venv/bin/activate  # or .venv\Scripts\activate on Windows
  ```
- Install dependencies:
  ```bash
  pip install -r requirements.txt
  ```

### Frontend

- **Node.js 22+** is required.
- Navigate to `frontend/` and install dependencies:
  ```bash
  npm install
  ```
- Start the development server:
  ```bash
  npm run dev
  ```

## Code Style

- **Python**: Follow [PEP 8](https://peps.python.org/pep-0008/). We enforce style via `ruff`. Run `ruff check app/` before committing.
- **TypeScript**: Strict mode is enabled in `tsconfig.json`. Run `npm run lint` and `npm run typecheck` to catch issues early.

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add patient appointment scheduling
fix: resolve 404 on doctor profile page
docs: update API endpoints in README
```

Use prefixes like `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`.

## Pull Request Process

1. Fork the repository and create a feature branch (`feat/your-feature` or `fix/your-bug`).
2. Make your changes, keeping commits small and focused.
3. Run linting and type checks locally.
4. Write or update tests as needed.
5. Open a Pull Request against `main`. Describe what you changed and why.
6. A maintainer will review your PR. Address any feedback before merge.

## Testing

- **Frontend tests** use Jest. Run them with:
  ```bash
  npm test
  ```
- All tests must pass before a PR is merged. Add tests for new functionality.

## Security Vulnerabilities

**Do not** report security issues publicly via GitHub Issues. Instead, email us at **security@elmahrosa.org** with details. We will respond promptly and coordinate a responsible disclosure.

---

Thank you for helping make UnityCare better for everyone!
