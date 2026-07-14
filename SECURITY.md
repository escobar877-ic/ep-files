# Security Policy

## Supported Implementation

Security reports for the live EP Files application should be evaluated against the current Worker implementation under `frontend/`.

The root Django project is retained as a legacy implementation and has a different authentication, storage, and deployment model.

## Reporting a Vulnerability

Do not publish an unpatched vulnerability in a public issue. Use a private GitHub security advisory for the repository when available and include:

- the affected URL or API endpoint;
- the account role and resource ownership involved;
- exact reproduction steps;
- the expected and observed behavior;
- the practical impact;
- a minimal proof of concept without unrelated personal data.

Allow reasonable time for validation and remediation before public disclosure.

## Current Controls

### Authentication and sessions

- Passwords are derived with PBKDF2-HMAC-SHA-256 and a unique random salt.
- Session tokens are cryptographically random.
- Only the SHA-256 hash of a session token is stored in D1.
- The browser session cookie is `Secure`, `HttpOnly`, `SameSite=Lax`, and scoped to `/`.
- Sessions expire after seven days.
- Logging out deletes the active session.
- Blocking a user deletes all of that user's sessions.
- Account deletion removes owned file objects and metadata.

### Authorization

- Every private file and folder operation resolves the authenticated user and resource permission.
- Ownership implies full access.
- Shared grants are limited to `read` and `read_write`.
- Folder inheritance is evaluated through the folder hierarchy.
- Only owners can delete resources, manage grants, and create public links.
- Administrator endpoints require a staff or superuser account.
- Worker preview-cache lookup occurs only after authorization succeeds.

### File handling

- The maximum upload size is 100 MB per file.
- Uploads are checked against the user's remaining storage quota.
- The declared upload size must match the size persisted by R2.
- File names are stripped of path components, unsafe characters are replaced, and length is limited to 255 characters.
- Common executable and script extensions are blocked.
- R2 object keys are generated server-side from the user ID and a random UUID.
- User-provided file names are never used as R2 paths.
- Text editing is limited to an allowlist and a maximum size of 2 MB.
- Avatar uploads accept only JPEG, PNG, WebP, and GIF up to 2 MB.

### Public access

- Public URLs use random tokens rather than sequential IDs.
- Public links can have server-enforced expiration timestamps.
- Disabling a link removes its token and expiration metadata.
- Public folder access is scoped to the selected folder.
- Public and shared files can be reported for administrator review.

### Data deletion

- Normal deletion is reversible and retains the R2 object until trash is cleared.
- Permanent deletion removes the R2 object and D1 metadata.
- Deleting an account or all user files removes associated R2 objects first.

## Known Limitations

The current application does not claim to provide:

- malware or antivirus scanning;
- content disarm and reconstruction;
- multi-factor authentication;
- per-account or per-IP API rate limiting;
- end-to-end encryption;
- customer-managed encryption keys;
- audit-log immutability;
- automated abuse classification.

These limitations matter for public or multi-tenant deployments. Add controls at the edge and storage layers before using EP Files for untrusted high-volume uploads or sensitive regulated data.

The first account registered in a completely empty database becomes an administrator. Provision the initial account immediately and protect its credentials.

## Security Review Checklist

Before a production release:

- [ ] Run `npm run lint` and `npm run sites:build` from `frontend/`.
- [ ] Test expired, missing, and blocked sessions.
- [ ] Test owner, read-only, read/write, and unauthorized resource access.
- [ ] Confirm public-link expiration and disable behavior.
- [ ] Confirm blocked extensions and file-size limits on the Worker, not only in the UI.
- [ ] Confirm permanent deletion removes the R2 object.
- [ ] Review new D1 queries for ownership and permission constraints.
- [ ] Review new caches to ensure authorization occurs before lookup.
- [ ] Remove disposable test accounts and uploaded objects.
- [ ] Review dependency advisories for production packages.

## Dependency Updates

Review JavaScript dependencies with:

```bash
cd frontend
npm outdated
npm audit
```

Do not apply major-version upgrades automatically. Build and test each upgrade against upload streaming, Worker compatibility, D1, and R2.
