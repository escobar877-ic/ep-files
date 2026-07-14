# EP Files API Reference

## Conventions

- Base path: `/api/`
- Request and response bodies use JSON unless an endpoint transfers a file or avatar.
- A trailing slash is accepted but not required.
- Authenticated requests must include the `ep_session` cookie.
- Browser clients should use same-origin requests with credentials enabled.
- Dates are ISO 8601 UTC strings.
- File and folder IDs are integers.

Typical errors use one of these shapes:

```json
{ "error": "Human-readable error" }
```

```json
{ "detail": "Authentication credentials were not provided." }
```

Validation errors may use a field name mapped to an array of messages.

## Authentication

| Method | Endpoint | Body or parameters | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | `name`, `email`, `password` | Create an account and session |
| `POST` | `/auth/login` | `email`, `password` | Create a session |
| `GET` | `/auth/me` | - | Return the current user |
| `DELETE` | `/auth/me` | - | Delete the account and owned file objects |
| `POST` | `/auth/refresh` | - | Extend the current session |
| `POST` | `/auth/logout` | - | Delete the current session |
| `POST` | `/auth/change-password` | `current_password`, `new_password`, `confirm_password` | Change the password |
| `POST` | `/auth/avatar` | multipart field `avatar` | Upload JPEG, PNG, WebP, or GIF up to 2 MB |
| `DELETE` | `/auth/avatar` | - | Delete the current avatar |
| `GET` | `/auth/avatar/:userId` | - | Retrieve an avatar |

The minimum password length is six characters. The session lifetime is seven days.

## Uploads

### Streamed upload

`POST /upload`

Send the file as the raw request body with:

| Header | Required | Description |
| --- | --- | --- |
| `Content-Type` | Recommended | Stored media type |
| `X-EP-File-Name` | Yes | URL-encoded original file name |
| `X-EP-File-Size` | Yes | Exact byte length |
| `X-EP-Folder-Id` | No | Destination folder ID |

```bash
file=photo.webp
size=$(wc -c < "$file" | tr -d ' ')

curl -b cookies.txt \
  -H 'Content-Type: image/webp' \
  -H 'X-EP-File-Name: photo.webp' \
  -H "X-EP-File-Size: $size" \
  --data-binary @"$file" \
  http://localhost:5173/api/upload/
```

Multipart upload with a `file` field and optional `folder_id` is also supported.

## Files

| Method | Endpoint | Body or parameters | Description |
| --- | --- | --- | --- |
| `GET` | `/files` | - | List all accessible active files |
| `GET` | `/files/accessible` | - | Return accessible files with a count wrapper |
| `GET` | `/files/:id/detail` | - | Return one file and write capability |
| `PATCH` | `/files/:id` | `name` | Rename a file |
| `DELETE` | `/files/:id` | - | Move an owned file to trash |
| `PATCH` | `/files/:id/move` | `folder_id`, nullable | Move a file |
| `GET` | `/download/:id` | - | Download a file |
| `GET` | `/files/:id/download` | - | Download alias |
| `GET` | `/preview/:id` | optional `Range` header | Inline preview or partial content |
| `GET` | `/files/:id/content` | - | Read supported text content up to 2 MB |
| `POST` | `/files/:id/save` | `content` | Replace supported text content |
| `GET` | `/files/:id/history` | - | Return file history |
| `POST` | `/files/:id/report` | `reason`, optional `message` | Report a shared file |

Editable extensions are `.txt`, `.md`, `.csv`, `.json`, `.xml`, `.html`, `.css`, `.js`, `.py`, and `.log`.

## Folders

| Method | Endpoint | Body | Description |
| --- | --- | --- | --- |
| `GET` | `/folders` | - | List accessible folders with recursive sizes |
| `GET` | `/folders/accessible` | - | Return accessible folders with a count wrapper |
| `POST` | `/folders/create` | `name`, optional `parent_id` | Create a folder |
| `PATCH` | `/folders/:id/rename` | `name` | Rename an owned folder |
| `PATCH` | `/folders/:id/move` | nullable `parent_id` | Move an owned folder |
| `DELETE` | `/folders/:id/delete` | - | Move a folder tree to trash |
| `GET` | `/folders/:id/download` | - | Download the folder tree as ZIP |

Moving a folder into its own descendant tree is rejected.

## Workspace

| Method | Endpoint | Parameters | Description |
| --- | --- | --- | --- |
| `GET` | `/storage/stats` | - | Used, available, and total storage |
| `GET` | `/search?q=term` | query `q` | Batched server-side name search |
| `GET` | `/favorites/all` | - | Favorite IDs and item summaries |
| `POST` | `/favorites/:id/toggle` | `type`: `file` or `folder` | Toggle an owned favorite |
| `GET` | `/history` | - | Up to 200 current-user events |
| `GET` | `/history/recent` | - | Up to 20 current-user events |

The current file-manager UI performs name filtering locally after loading accessible metadata; `/search` is retained for direct API clients and fallback use.

## Trash

| Method | Endpoint | Parameters | Description |
| --- | --- | --- | --- |
| `GET` | `/trash` | optional `folder_id` query | List the root or a deleted folder |
| `DELETE` | `/trash/clear` | - | Permanently clear the current user's trash |
| `PATCH` | `/trash/:fileId/restore` | - | Restore a file |
| `DELETE` | `/trash/:fileId` | - | Permanently delete a file |
| `PATCH` | `/trash/folders/:folderId/restore` | - | Restore a folder tree |
| `DELETE` | `/trash/folders/:folderId` | - | Permanently delete a folder tree |

## Permissions

| Method | Endpoint | Body | Description |
| --- | --- | --- | --- |
| `GET` | `/permissions/my` | - | Grants received by the current user |
| `GET` | `/:type/:id/permissions` | - | Owner-only grant list; `type` is `files` or `folders` |
| `POST` | `/:type/:id/permissions/grant` | `user_email`, `permission_type`, optional `inherit` | Create or update a grant |
| `DELETE` | `/:type/:id/permissions/revoke` | `user_email` | Revoke a grant |

`permission_type` is `read` or `read_write`. Folder grants inherit by default unless `inherit` is explicitly `false`.

## Public Links

| Method | Endpoint | Body or parameters | Description |
| --- | --- | --- | --- |
| `POST` | `/:type/:id/public-link` | optional `public_expires_in_minutes` | Enable or update a public link |
| `DELETE` | `/:type/:id/public-link/disable` | - | Disable a public link |
| `GET` | `/public/files/:token` | `meta=1` for JSON, `inline=1` for inline body | Access a public file |
| `POST` | `/public/files/:token/report` | `reason`, optional `message`, `reporter_email` | Report a public file |
| `GET` | `/public/folders/:token` | - | List a public folder |
| `GET` | `/public/folders/:token/files/:fileId` | - | Download a file from a public folder |

`public_expires_in_minutes` can be `never`, empty, or an integer from 1 to 525,600.

## Administration

These endpoints require a staff or superuser account.

| Method | Endpoint | Body or parameters | Description |
| --- | --- | --- | --- |
| `GET` | `/admin/users` | - | List users and storage usage |
| `GET` | `/admin/stats` | - | Aggregate user, file, storage, and report statistics |
| `PATCH` | `/admin/users/:id/block` | - | Block a user and delete sessions |
| `PATCH` | `/admin/users/:id/unblock` | - | Unblock a user |
| `PATCH` | `/admin/users/:id/storage-limit` | `storage_limit_mb` | Set a quota from 1 to 2,048 MB |
| `DELETE` | `/admin/users/:id/files/delete` | - | Delete all file objects owned by a user |
| `DELETE` | `/admin/users/:id/delete` | - | Delete a user and owned objects |
| `GET` | `/admin/reports` | optional `status=pending|resolved` | List reports |
| `POST` | `/admin/reports/:id/resolve` | `action`, optional `admin_note` | Resolve a report |
| `GET` | `/admin/reports/:id/download` | - | Download the reported file |

Report actions are `keep`, `disable_public`, and `delete_file`.

## Status Codes

| Code | Meaning |
| --- | --- |
| `200` | Successful read or mutation |
| `201` | Resource created |
| `204` | CORS preflight response |
| `206` | Partial file response for a byte range |
| `304` | Cached file is still current |
| `400` | Validation or business-rule failure |
| `401` | Missing or expired session |
| `403` | Authenticated but not authorized |
| `404` | Resource or endpoint not found |
| `412` | Conditional file request failed |
| `500` | Unhandled server error |
