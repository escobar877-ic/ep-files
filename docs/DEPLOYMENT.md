# EP Files Deployment

## Current Hosting Model

EP Files is deployed through OpenAI Sites as a Cloudflare-compatible vinext application. The deployment includes:

- the React client bundle;
- the vinext Worker entry point;
- the `/api/*` Worker backend;
- a D1 database bound as `DB`;
- an R2 bucket bound as `FILES`;
- the D1 migration under `frontend/drizzle/`.

The public production URL is [ep-files-app.markk877.chatgpt.site](https://ep-files-app.markk877.chatgpt.site).

## Hosting Metadata

`frontend/.openai/hosting.json` contains only the Sites project identifier and logical persistence binding names. Do not place secrets, generated credentials, physical database IDs, or bucket credentials in this file.

The binding names must match both `frontend/vite.config.js` and Worker usage:

| Binding | Resource | Used for |
| --- | --- | --- |
| `DB` | D1 | Accounts, sessions, metadata, permissions, history, and reports |
| `FILES` | R2 | Uploaded files and avatars |

## Production Build

From the repository root:

```bash
cd frontend
npm ci
npm run lint
npm run sites:build
```

A successful build produces the Worker-compatible output under `frontend/dist/`. The deployment package must be created from the same Git commit that is pushed to the Sites source repository.

## Release Checklist

1. Confirm the Git working tree contains only intended changes.
2. Run `npm run lint`.
3. Run `npm run sites:build`.
4. Test changed routes locally with `npm run sites:dev -- --port 5173`.
5. For UI changes, verify desktop and mobile layouts in both themes.
6. For API changes, test authentication, authorization failure, and success paths.
7. If the D1 schema changed, add or update a migration in `frontend/drizzle/`.
8. Commit and push the exact validated source.
9. Save and deploy a new Sites version built from that commit.
10. Verify the production URL and remove temporary test accounts or files.

## Schema Changes

Do not rely only on the defensive `CREATE TABLE IF NOT EXISTS` statements in `worker/api.js`. Hosted schema changes must be represented in the migration directory so a new deployment can provision the same database structure.

For a backward-compatible release:

- add nullable columns before code starts requiring them;
- deploy code that can read both old and new rows when necessary;
- avoid destructive table changes in the same release as application logic changes;
- create indexes for new high-frequency lookup paths.

## Rollback

Sites versions are immutable deployment artifacts. To roll back application code, redeploy the last known-good saved version. A code rollback does not automatically reverse D1 migrations or delete R2 objects.

Before a schema-affecting release, decide whether the previous application version can operate against the new schema. Prefer additive migrations to keep rollback possible.

## Production Smoke Test

After deployment, verify at minimum:

- registration or login;
- file listing and folder navigation;
- one upload with visible transfer and processing phases;
- image preview and a ranged video request;
- file download;
- search without per-keystroke API requests;
- trash move and restore;
- light/dark theme persistence.

Use a disposable account and delete it after the test so its D1 rows and R2 objects are removed.

## Legacy Deployment Files

Root-level Docker, Django, Nginx, and GitLab CI documentation belongs to the legacy implementation. It does not describe the current Sites deployment. Keep legacy deployment changes separate from `frontend/.openai/`, `frontend/worker/`, and `frontend/drizzle/` changes.
