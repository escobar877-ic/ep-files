# EP Files Frontend and Worker

This directory contains the current EP Files application: the React UI, the vinext application shell, and the Cloudflare-compatible Worker API.

## Development

```bash
npm ci
npm run sites:dev -- --port 5173
```

Open [http://localhost:5173](http://localhost:5173). The development server provides local D1 and R2 bindings through Miniflare.

The first account registered against a new local database becomes an administrator.

## Scripts

| Script | Description |
| --- | --- |
| `npm run sites:dev` | Run the complete Sites application and Worker API |
| `npm run sites:build` | Build the deployable vinext Worker bundle |
| `npm run lint` | Lint all JavaScript and JSX files |
| `npm run format` | Format files under `src/` with Prettier |
| `npm run dev` | Run the standalone SPA with `/api` proxied to Django on port 8000 |
| `npm run build` | Build the standalone SPA |
| `npm run preview` | Preview the standalone SPA build |

Use `sites:dev` and `sites:build` for the current production architecture. The plain Vite commands exist for compatibility with the legacy Django backend.

## Directory Map

| Path | Responsibility |
| --- | --- |
| `app/` | vinext application layout and client-only React entry point |
| `src/` | Pages, components, theme, API client, upload queue, and preview UI |
| `worker/index.js` | Dispatches `/api/*` to the EP Files API and all other paths to vinext |
| `worker/api.js` | Authentication, files, folders, permissions, trash, sharing, and admin API |
| `drizzle/` | D1 schema used during hosted deployment |
| `build/` | Sites integration and build-pruning helpers |
| `public/` | Static assets, local fonts, favicon, and attribution notices |
| `.openai/hosting.json` | Sites project and logical persistence bindings |

## Client Routing

The user-facing application uses React Router inside a client-only vinext shell. Main routes are:

| Route | Purpose |
| --- | --- |
| `/` | Authenticated workspace or public introduction |
| `/login` | Sign in |
| `/register` | Create an account |
| `/file-manager` | Files, folders, search, upload, preview, and sharing |
| `/files` | Account, favorites, history, and profile settings |
| `/trash` | Restore or permanently delete removed items |
| `/admin` | User, storage, and report administration |
| `/public/:resourceType/:token` | Public file or folder access |

## API Client

`src/api/axios.js` uses `/api` by default and includes browser credentials. The Worker session is stored in an HTTP-only cookie, so application code never reads the session token.

Uploads use a streamed raw request body with these headers:

- `X-EP-File-Name`
- `X-EP-File-Size`
- optional `X-EP-Folder-Id`

The UI reports network transfer progress separately from the Worker/R2 save phase.

## Quality Checks

```bash
npm run lint
npm run sites:build
```

Both commands must pass before deployment. For UI changes, also verify the affected route in light and dark themes at desktop and mobile widths.

## Related Documentation

- [Project README](../README.md)
- [Architecture](../docs/ARCHITECTURE.md)
- [API reference](../docs/API.md)
- [Deployment](../docs/DEPLOYMENT.md)
