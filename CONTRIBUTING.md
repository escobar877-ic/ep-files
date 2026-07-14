# Contributing to EP Files

Thank you for improving EP Files. This guide applies to the current application under `frontend/`.

## Development Setup

Requirements:

- Node.js 20 or newer
- npm 10 or newer
- Git

```bash
git clone https://github.com/escobar877-ic/ep-files.git
cd ep-files/frontend
npm ci
npm run sites:dev -- --port 5173
```

Open [http://localhost:5173](http://localhost:5173). The complete UI, Worker API, local D1 database, and local R2 storage run together.

## Branches

Create a focused branch from the latest `master`:

```bash
git checkout master
git pull --ff-only origin master
git checkout -b feature/short-description
```

Use `fix/`, `docs/`, `refactor/`, or `test/` when another prefix describes the work better. Keep unrelated changes in separate branches and pull requests.

## Change Scope

- Follow existing React, Material UI, and Worker patterns.
- Keep the Worker compatible with Cloudflare Web Platform APIs.
- Do not introduce a second API or state-management layer without a concrete need.
- Preserve same-origin `/api` behavior and cookie credentials.
- Keep D1 metadata and R2 object lifecycle changes consistent.
- Add a migration under `frontend/drizzle/` for hosted schema changes.
- Do not add secrets or physical cloud-resource credentials to the repository.
- Treat root Django files as legacy unless the change explicitly targets that implementation.

## Verification

Run before opening a pull request:

```bash
cd frontend
npm run lint
npm run sites:build
```

For UI changes, verify:

- desktop and mobile widths;
- light and dark themes;
- loading, empty, success, and error states;
- long file names and translated text;
- keyboard focus and button labels.

For API changes, verify:

- unauthenticated requests;
- owner and shared-user permissions;
- read-only and read/write access;
- validation failures;
- D1 and R2 cleanup after deletion.

The root pytest suite covers the legacy Django implementation and should be run when modifying `main/`, `ep_files_app/`, or root Python code.

## Commit Messages

Use concise Conventional Commit prefixes:

| Prefix | Use |
| --- | --- |
| `feat:` | New behavior |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `perf:` | Performance improvement |
| `refactor:` | Internal change without intended behavior change |
| `test:` | Test additions or corrections |
| `chore:` | Tooling, dependencies, or repository maintenance |

Examples:

```text
feat: add expiring folder links
fix: keep upload actions pinned to viewport
docs: document Worker API endpoints
```

## Pull Requests

A pull request should include:

- a short description of the user-visible result;
- implementation notes for non-obvious tradeoffs;
- verification commands and results;
- screenshots for visual changes;
- API request examples for contract changes;
- migration and rollback notes for schema changes.

Avoid committing generated `dist/`, local `.wrangler/` state, temporary uploads, cookies, or test-account data.

## Documentation

Update documentation in the same pull request when changing commands, routes, API contracts, limits, bindings, permissions, or deployment behavior.

Start with:

- [Project README](./README.md)
- [Documentation index](./docs/README.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [API reference](./docs/API.md)
- [Security policy](./SECURITY.md)

## Security

Do not include exploit details for an unpatched vulnerability in a public issue or pull request. Follow the private reporting process in [SECURITY.md](./SECURITY.md).
