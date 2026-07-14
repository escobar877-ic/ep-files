# EP Files Documentation

This directory documents the current EP Files application deployed from `frontend/`.

## Guides

| Document | Contents |
| --- | --- |
| [Project README](../README.md) | Features, quick start, commands, limits, and repository map |
| [Architecture](./ARCHITECTURE.md) | Runtime, persistence, authentication, permissions, uploads, and caching |
| [API Reference](./API.md) | HTTP endpoints, request formats, authentication, and errors |
| [Deployment](./DEPLOYMENT.md) | Build, hosting bindings, release checks, and rollback guidance |
| [Frontend Guide](../frontend/README.md) | UI structure, scripts, routes, and development workflow |

## Implementation Source of Truth

The current production implementation is:

- `frontend/src/` for the React application
- `frontend/app/` for the vinext application shell
- `frontend/worker/` for the Worker API
- `frontend/drizzle/` for the D1 schema
- `frontend/.openai/hosting.json` for logical Sites bindings

The Sphinx configuration and Django modules retained elsewhere in the repository describe the legacy university implementation. They are not used by the live Cloudflare deployment.

## Updating Documentation

Update the relevant Markdown guide whenever a change affects:

- a public or authenticated API contract;
- a file-size, storage, session, or permission limit;
- a local development or build command;
- a D1 table, R2 object lifecycle, or hosting binding;
- a user-facing route or major workflow.

Use relative links, executable command examples, and names that match the current source code. Run the normal application checks after documentation changes to catch accidental source edits:

```bash
cd frontend
npm run lint
npm run sites:build
```
