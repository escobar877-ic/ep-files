import { zipSync } from 'fflate';

const SESSION_COOKIE = 'ep_session';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const PASSWORD_HASH_ITERATIONS = 10000;
const LEGACY_PASSWORD_HASH_ITERATIONS = 120000;
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const MAX_TEXT_FILE_SIZE = 2 * 1024 * 1024;
const DEFAULT_STORAGE_LIMIT = 100 * 1024 * 1024;
const MAX_STORAGE_LIMIT_MB = 2048;
const FORBIDDEN_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'jar', 'msi', 'app', 'deb', 'rpm',
  'sh', 'bash', 'ps1', 'psm1',
]);
const EDITABLE_EXTENSIONS = new Set(['txt', 'md', 'csv', 'json', 'xml', 'html', 'css', 'js', 'py', 'log']);
const encoder = new TextEncoder();
let schemaPromise;

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL DEFAULT '', password_hash TEXT NOT NULL, password_salt TEXT NOT NULL,
    avatar_key TEXT, avatar_type TEXT, is_staff INTEGER NOT NULL DEFAULT 0,
    is_superuser INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1,
    storage_limit INTEGER NOT NULL DEFAULT ${DEFAULT_STORAGE_LIMIT}, date_joined TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE, public_token TEXT UNIQUE,
    is_public INTEGER NOT NULL DEFAULT 0, public_expires_at TEXT,
    is_deleted INTEGER NOT NULL DEFAULT 0, deleted_at TEXT,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, storage_key TEXT NOT NULL UNIQUE,
    size INTEGER NOT NULL DEFAULT 0, content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL, public_token TEXT UNIQUE,
    is_public INTEGER NOT NULL DEFAULT 0, public_expires_at TEXT,
    is_deleted INTEGER NOT NULL DEFAULT 0, deleted_at TEXT,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL, item_id INTEGER NOT NULL, created_at TEXT NOT NULL,
    UNIQUE(user_id, item_type, item_id)
  )`,
  `CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    granted_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
    folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
    permission_type TEXT NOT NULL, inherit INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS file_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT, file_id INTEGER, file_name TEXT NOT NULL,
    event_type TEXT NOT NULL, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    old_value TEXT, new_value TEXT, details TEXT, ip_address TEXT, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS file_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT, file_id INTEGER REFERENCES files(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL, file_owner_email TEXT NOT NULL DEFAULT '', public_token TEXT NOT NULL DEFAULT '',
    reporter_email TEXT NOT NULL DEFAULT '', reason TEXT NOT NULL, message TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending', admin_action TEXT NOT NULL DEFAULT '',
    admin_note TEXT NOT NULL DEFAULT '', reviewed_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL, resolved_at TEXT
  )`,
];

export async function handleApiRequest(request, env) {
  try {
    await ensureSchema(env.DB);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204 });

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/api';
    const method = request.method.toUpperCase();

    if (path === '/api/auth/register' && method === 'POST') return register(request, env);
    if (path === '/api/auth/login' && method === 'POST') return login(request, env);
    if (path === '/api/auth/me' && method === 'GET') return me(request, env);
    if (path === '/api/auth/refresh' && method === 'POST') return refresh(request, env);
    if (path === '/api/auth/logout' && method === 'POST') return logout(request, env);
    if (path === '/api/auth/change-password' && method === 'POST') return changePassword(request, env);
    if (path === '/api/auth/avatar' && ['POST', 'DELETE'].includes(method)) return avatar(request, env);
    let match = path.match(/^\/api\/auth\/avatar\/(\d+)$/);
    if (match && method === 'GET') return avatarFile(env, Number(match[1]));

    if (path === '/api/upload' && method === 'POST') return upload(request, env);
    if (path === '/api/files' && method === 'GET') return listFiles(request, env);
    if (path === '/api/files/accessible' && method === 'GET') return accessibleFiles(request, env);
    if (path === '/api/folders' && method === 'GET') return listFolders(request, env);
    if (path === '/api/folders/accessible' && method === 'GET') return accessibleFolders(request, env);
    if (path === '/api/folders/create' && method === 'POST') return createFolder(request, env);
    if (path === '/api/storage/stats' && method === 'GET') return storageStats(request, env);
    if (path === '/api/search' && method === 'GET') return search(request, env, url);
    if (path === '/api/favorites/all' && method === 'GET') return favorites(request, env);
    if (path === '/api/permissions/my' && method === 'GET') return myPermissions(request, env);
    if (path === '/api/trash' && method === 'GET') return trashList(request, env, url);
    if (path === '/api/trash/clear' && method === 'DELETE') return clearTrash(request, env);
    if (path === '/api/history' && method === 'GET') return userHistory(request, env, false);
    if (path === '/api/history/recent' && method === 'GET') return userHistory(request, env, true);

    match = path.match(/^\/api\/(?:download|files)\/(\d+)(?:\/download)?$/);
    if (match && method === 'GET') return downloadFile(request, env, Number(match[1]));
    match = path.match(/^\/api\/preview\/(\d+)$/);
    if (match && method === 'GET') return downloadFile(request, env, Number(match[1]), true);
    match = path.match(/^\/api\/files\/(\d+)$/);
    if (match && ['DELETE', 'PATCH'].includes(method)) return mutateFile(request, env, Number(match[1]));
    match = path.match(/^\/api\/files\/(\d+)\/move$/);
    if (match && method === 'PATCH') return moveFile(request, env, Number(match[1]));
    match = path.match(/^\/api\/files\/(\d+)\/detail$/);
    if (match && method === 'GET') return fileDetail(request, env, Number(match[1]));
    match = path.match(/^\/api\/files\/(\d+)\/content$/);
    if (match && method === 'GET') return readTextFile(request, env, Number(match[1]));
    match = path.match(/^\/api\/files\/(\d+)\/save$/);
    if (match && method === 'POST') return saveTextFile(request, env, Number(match[1]));
    match = path.match(/^\/api\/files\/(\d+)\/report$/);
    if (match && method === 'POST') return reportFile(request, env, Number(match[1]));
    match = path.match(/^\/api\/files\/(\d+)\/history$/);
    if (match && method === 'GET') return fileHistory(request, env, Number(match[1]));
    match = path.match(/^\/api\/favorites\/(\d+)\/toggle$/);
    if (match && method === 'POST') return toggleFavorite(request, env, Number(match[1]));

    match = path.match(/^\/api\/folders\/(\d+)\/rename$/);
    if (match && method === 'PATCH') return renameFolder(request, env, Number(match[1]));
    match = path.match(/^\/api\/folders\/(\d+)\/move$/);
    if (match && method === 'PATCH') return moveFolder(request, env, Number(match[1]));
    match = path.match(/^\/api\/folders\/(\d+)\/delete$/);
    if (match && method === 'DELETE') return deleteFolder(request, env, Number(match[1]));
    match = path.match(/^\/api\/folders\/(\d+)\/download$/);
    if (match && method === 'GET') return downloadFolder(request, env, Number(match[1]));

    match = path.match(/^\/api\/(files|folders)\/(\d+)\/public-link$/);
    if (match && method === 'POST') return enablePublicLink(request, env, match[1], Number(match[2]));
    match = path.match(/^\/api\/(files|folders)\/(\d+)\/public-link\/disable$/);
    if (match && method === 'DELETE') return disablePublicLink(request, env, match[1], Number(match[2]));
    match = path.match(/^\/api\/(files|folders)\/(\d+)\/permissions$/);
    if (match && method === 'GET') return listPermissions(request, env, match[1], Number(match[2]));
    match = path.match(/^\/api\/(files|folders)\/(\d+)\/permissions\/grant$/);
    if (match && method === 'POST') return grantPermission(request, env, match[1], Number(match[2]));
    match = path.match(/^\/api\/(files|folders)\/(\d+)\/permissions\/revoke$/);
    if (match && method === 'DELETE') return revokePermission(request, env, match[1], Number(match[2]));

    match = path.match(/^\/api\/trash\/(\d+)\/restore$/);
    if (match && method === 'PATCH') return restoreFile(request, env, Number(match[1]));
    match = path.match(/^\/api\/trash\/(\d+)$/);
    if (match && method === 'DELETE') return permanentlyDeleteFile(request, env, Number(match[1]));
    match = path.match(/^\/api\/trash\/folders\/(\d+)\/restore$/);
    if (match && method === 'PATCH') return restoreFolder(request, env, Number(match[1]));
    match = path.match(/^\/api\/trash\/folders\/(\d+)$/);
    if (match && method === 'DELETE') return permanentlyDeleteFolder(request, env, Number(match[1]));

    match = path.match(/^\/api\/public\/files\/([^/]+)$/);
    if (match && method === 'GET') return publicFile(request, env, match[1], url);
    match = path.match(/^\/api\/public\/files\/([^/]+)\/report$/);
    if (match && method === 'POST') return reportPublicFile(request, env, match[1]);
    match = path.match(/^\/api\/public\/folders\/([^/]+)$/);
    if (match && method === 'GET') return publicFolder(request, env, match[1]);
    match = path.match(/^\/api\/public\/folders\/([^/]+)\/files\/(\d+)$/);
    if (match && method === 'GET') return publicFolderFile(request, env, match[1], Number(match[2]));

    if (path === '/api/admin/users' && method === 'GET') return adminUsers(request, env);
    if (path === '/api/admin/stats' && method === 'GET') return adminStats(request, env);
    if (path === '/api/admin/reports' && method === 'GET') return adminReports(request, env, url);
    match = path.match(/^\/api\/admin\/users\/(\d+)\/(block|unblock)$/);
    if (match && method === 'PATCH') return adminSetActive(request, env, Number(match[1]), match[2] === 'unblock');
    match = path.match(/^\/api\/admin\/users\/(\d+)\/storage-limit$/);
    if (match && method === 'PATCH') return adminStorageLimit(request, env, Number(match[1]));
    match = path.match(/^\/api\/admin\/users\/(\d+)\/files\/delete$/);
    if (match && method === 'DELETE') return adminDeleteUserFiles(request, env, Number(match[1]));
    match = path.match(/^\/api\/admin\/users\/(\d+)\/delete$/);
    if (match && method === 'DELETE') return adminDeleteUser(request, env, Number(match[1]));
    match = path.match(/^\/api\/admin\/reports\/(\d+)\/resolve$/);
    if (match && method === 'POST') return adminResolveReport(request, env, Number(match[1]));
    match = path.match(/^\/api\/admin\/reports\/(\d+)\/download$/);
    if (match && method === 'GET') return adminDownloadReport(request, env, Number(match[1]));

    return json({ error: 'Endpoint not found' }, 404);
  } catch (error) {
    console.error('EP Files API error', error);
    return json({ error: 'Internal server error' }, 500);
  }
}

async function ensureSchema(db) {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const exists = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").first();
      if (!exists) await db.batch(schemaStatements.map((statement) => db.prepare(statement)));
    })().catch((error) => {
      schemaPromise = undefined;
      throw error;
    });
  }
  return schemaPromise;
}

function json(data, status = 200, extraHeaders = {}) {
  const headers = new Headers({ 'content-type': 'application/json; charset=utf-8', ...extraHeaders });
  return new Response(JSON.stringify(data), { status, headers });
}

async function bodyJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function nowIso() {
  return new Date().toISOString();
}

function extension(name) {
  const index = name.lastIndexOf('.');
  return index > -1 ? name.slice(index + 1).toLowerCase() : '';
}

function sanitizeFilename(value) {
  const name = String(value || 'file').split(/[\\/]/).pop().replace(/[<>:"/\\|?*]/g, '_').replace(/\.{2,}/g, '.');
  if (name.length <= 255) return name;
  const ext = extension(name);
  return `${name.slice(0, 254 - ext.length)}${ext ? `.${ext}` : ''}`;
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomToken(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function sha256(value) {
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));
}

async function hashPassword(password, salt = randomToken(18), iterations = PASSWORD_HASH_ITERATIONS) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations },
    material,
    256,
  );
  return { salt, hash: bytesToBase64Url(new Uint8Array(bits)) };
}

async function passwordMatches(password, salt, expected) {
  const separator = salt.indexOf('$');
  const iterations = separator > 0 ? Number(salt.slice(0, separator)) : LEGACY_PASSWORD_HASH_ITERATIONS;
  const rawSalt = separator > 0 ? salt.slice(separator + 1) : salt;
  const actual = await hashPassword(password, rawSalt, iterations);
  if (actual.hash.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= actual.hash.charCodeAt(index) ^ expected.charCodeAt(index);
  return difference === 0;
}

function parseCookies(request) {
  const cookies = {};
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const separator = part.indexOf('=');
    if (separator > 0) cookies[part.slice(0, separator).trim()] = decodeURIComponent(part.slice(separator + 1).trim());
  }
  return cookies;
}

function sessionCookie(token, maxAge = SESSION_TTL_SECONDS) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

async function createSession(db, userId) {
  const token = randomToken();
  const tokenHash = await sha256(token);
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  await db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .bind(tokenHash, userId, expiresAt, createdAt).run();
  return token;
}

async function currentUser(request, env) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) return null;
  const tokenHash = await sha256(token);
  const user = await env.DB.prepare(`
    SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
  `).bind(tokenHash, nowIso()).first();
  if (!user || !Number(user.is_active)) return null;
  return { ...user, session_token_hash: tokenHash };
}

async function requireUser(request, env) {
  const user = await currentUser(request, env);
  return user || json({ detail: 'Authentication credentials were not provided.' }, 401);
}

async function requireAdmin(request, env) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  return Number(user.is_staff) || Number(user.is_superuser) ? user : json({ error: 'Admin access required' }, 403);
}

function serializeUser(user) {
  return {
    id: Number(user.id),
    name: user.name || '',
    email: user.email,
    is_staff: Boolean(user.is_staff),
    is_superuser: Boolean(user.is_superuser),
    is_active: Boolean(user.is_active),
    storage_limit: Number(user.storage_limit),
    date_joined: user.date_joined,
    avatar_url: user.avatar_key ? `/api/auth/avatar/${user.id}/` : null,
  };
}

function serializeFile(file) {
  return {
    id: Number(file.id),
    name: file.name,
    size: Number(file.size || 0),
    date: file.created_at,
    owner_email: file.owner_email,
    download_url: `/api/download/${file.id}/`,
    folder: file.folder_id == null ? null : Number(file.folder_id),
    is_public: Boolean(file.is_public),
    public_token: file.public_token || null,
    public_expires_at: file.public_expires_at || null,
    is_deleted: Boolean(file.is_deleted),
    deleted_at: file.deleted_at || null,
  };
}

async function register(request, env) {
  const data = await bodyJson(request);
  const email = String(data.email || '').trim().toLowerCase();
  const name = String(data.name || '').trim().slice(0, 100);
  const password = String(data.password || '');
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ email: ['Введите корректный email.'] }, 400);
  if (password.length < 6) return json({ password: ['Пароль должен содержать минимум 6 символов.'] }, 400);
  if (await env.DB.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').bind(email).first()) {
    return json({ email: ['Пользователь с такой почтой уже есть.'] }, 400);
  }
  const count = await env.DB.prepare('SELECT COUNT(*) AS count FROM users').first();
  const firstUser = Number(count.count) === 0;
  const credentials = await hashPassword(password);
  const result = await env.DB.prepare(`
    INSERT INTO users (email, name, password_hash, password_salt, is_staff, is_superuser, date_joined)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(email, name, credentials.hash, `${PASSWORD_HASH_ITERATIONS}$${credentials.salt}`, firstUser ? 1 : 0, firstUser ? 1 : 0, nowIso()).run();
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(result.meta.last_row_id).first();
  const token = await createSession(env.DB, user.id);
  return json({ user: serializeUser(user) }, 201, { 'set-cookie': sessionCookie(token) });
}

async function login(request, env) {
  const data = await bodyJson(request);
  const email = String(data.email || '').trim().toLowerCase();
  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').bind(email).first();
  if (!user || !(await passwordMatches(String(data.password || ''), user.password_salt, user.password_hash))) {
    return json({ error: 'Invalid credentials' }, 401);
  }
  if (!Number(user.is_active)) return json({ error: 'Ваш аккаунт заблокирован администратором.', code: 'user_blocked' }, 403);
  const token = await createSession(env.DB, user.id);
  return json({ user: serializeUser(user) }, 200, { 'set-cookie': sessionCookie(token) });
}

async function me(request, env) {
  const user = await requireUser(request, env);
  return user instanceof Response ? user : json({ user: serializeUser(user) });
}

async function refresh(request, env) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  await env.DB.prepare('UPDATE sessions SET expires_at = ? WHERE token_hash = ?').bind(expiresAt, user.session_token_hash).run();
  return json({ detail: 'Token refreshed.' }, 200, { 'set-cookie': sessionCookie(parseCookies(request)[SESSION_COOKIE]) });
}

async function logout(request, env) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  return json({ detail: 'Logged out.' }, 200, { 'set-cookie': sessionCookie('', 0) });
}

async function changePassword(request, env) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const data = await bodyJson(request);
  if (!(await passwordMatches(String(data.current_password || ''), user.password_salt, user.password_hash))) {
    return json({ current_password: ['Текущий пароль указан неверно.'] }, 400);
  }
  const nextPassword = String(data.new_password || '');
  if (nextPassword.length < 6) return json({ new_password: ['Новый пароль должен содержать минимум 6 символов.'] }, 400);
  if (nextPassword !== String(data.confirm_password || '')) return json({ confirm_password: ['Пароли не совпадают.'] }, 400);
  const credentials = await hashPassword(nextPassword);
  await env.DB.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?')
    .bind(credentials.hash, `${PASSWORD_HASH_ITERATIONS}$${credentials.salt}`, user.id).run();
  return json({ detail: 'Пароль успешно изменён.' });
}

async function avatar(request, env) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  if (request.method === 'DELETE') {
    if (user.avatar_key) await env.FILES.delete(user.avatar_key);
    await env.DB.prepare('UPDATE users SET avatar_key = NULL, avatar_type = NULL WHERE id = ?').bind(user.id).run();
    return json({ user: serializeUser({ ...user, avatar_key: null, avatar_type: null }) });
  }
  const form = await request.formData();
  const file = form.get('avatar');
  if (!(file instanceof File)) return json({ error: 'Файл аватара не передан.' }, 400);
  if (file.size > MAX_AVATAR_SIZE) return json({ error: 'Аватар должен быть меньше 2 MB.' }, 400);
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) return json({ error: 'Поддерживаются только JPEG, PNG, WEBP и GIF.' }, 400);
  const key = `avatars/${user.id}/${crypto.randomUUID()}`;
  await env.FILES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  if (user.avatar_key) await env.FILES.delete(user.avatar_key);
  await env.DB.prepare('UPDATE users SET avatar_key = ?, avatar_type = ? WHERE id = ?').bind(key, file.type, user.id).run();
  return json({ user: serializeUser({ ...user, avatar_key: key, avatar_type: file.type }) });
}

async function avatarFile(env, userId) {
  const user = await env.DB.prepare('SELECT avatar_key, avatar_type FROM users WHERE id = ?').bind(userId).first();
  if (!user?.avatar_key) return json({ error: 'Avatar not found' }, 404);
  const object = await env.FILES.get(user.avatar_key);
  if (!object) return json({ error: 'Avatar not found' }, 404);
  return new Response(object.body, { headers: { 'content-type': user.avatar_type || 'application/octet-stream', 'cache-control': 'public, max-age=3600' } });
}

async function fileRow(db, fileId, includeDeleted = false) {
  return db.prepare(`
    SELECT f.*, u.email AS owner_email FROM files f JOIN users u ON u.id = f.owner_id
    WHERE f.id = ? ${includeDeleted ? '' : 'AND f.is_deleted = 0'}
  `).bind(fileId).first();
}

async function folderRow(db, folderId, includeDeleted = false) {
  return db.prepare(`SELECT * FROM folders WHERE id = ? ${includeDeleted ? '' : 'AND is_deleted = 0'}`).bind(folderId).first();
}

async function resourcePermission(db, user, type, resource) {
  if (Number(resource.owner_id) === Number(user.id)) return 'owner';
  if (type === 'files') {
    const direct = await db.prepare('SELECT permission_type FROM permissions WHERE user_id = ? AND file_id = ? ORDER BY permission_type DESC LIMIT 1')
      .bind(user.id, resource.id).first();
    if (direct) return direct.permission_type;
    if (resource.folder_id == null) return null;
    const inherited = await db.prepare(`
      WITH RECURSIVE ancestors(id, parent_id) AS (
        SELECT id, parent_id FROM folders WHERE id = ?
        UNION ALL SELECT f.id, f.parent_id FROM folders f JOIN ancestors a ON f.id = a.parent_id
      )
      SELECT p.permission_type FROM permissions p
      WHERE p.user_id = ? AND p.folder_id IN (SELECT id FROM ancestors)
        AND (p.folder_id = ? OR p.inherit = 1)
      ORDER BY p.permission_type DESC LIMIT 1
    `).bind(resource.folder_id, user.id, resource.folder_id).first();
    return inherited?.permission_type || null;
  }
  const permission = await db.prepare(`
    WITH RECURSIVE ancestors(id, parent_id) AS (
      SELECT id, parent_id FROM folders WHERE id = ?
      UNION ALL SELECT f.id, f.parent_id FROM folders f JOIN ancestors a ON f.id = a.parent_id
    )
    SELECT p.permission_type FROM permissions p
    WHERE p.user_id = ? AND p.folder_id IN (SELECT id FROM ancestors)
      AND (p.folder_id = ? OR p.inherit = 1)
    ORDER BY p.permission_type DESC LIMIT 1
  `).bind(resource.id, user.id, resource.id).first();
  return permission?.permission_type || null;
}

function canWrite(permission) {
  return permission === 'owner' || permission === 'read_write';
}

async function upload(request, env) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return json({ error: 'File not provided' }, 400);
  if (file.size > MAX_FILE_SIZE) return json({ error: 'Файл слишком большой. Максимальный размер: 100 МБ.' }, 400);
  const name = sanitizeFilename(file.name);
  if (FORBIDDEN_EXTENSIONS.has(extension(name))) return json({ error: `Файлы с расширением .${extension(name)} запрещены из соображений безопасности.` }, 400);
  const usage = await env.DB.prepare('SELECT COALESCE(SUM(size), 0) AS total FROM files WHERE owner_id = ? AND is_deleted = 0').bind(user.id).first();
  if (Number(usage.total) + file.size > Number(user.storage_limit)) return json({ error: 'Недостаточно свободного места в хранилище.' }, 400);
  const folderId = form.get('folder_id');
  let folder = null;
  if (folderId) {
    folder = await folderRow(env.DB, Number(folderId));
    if (!folder || !canWrite(await resourcePermission(env.DB, user, 'folders', folder))) return json({ error: 'Folder not found' }, 404);
  }
  const key = `files/${user.id}/${crypto.randomUUID()}`;
  const timestamp = nowIso();
  await env.FILES.put(key, file.stream(), { httpMetadata: { contentType: file.type || 'application/octet-stream' } });
  const result = await env.DB.prepare(`
    INSERT INTO files (name, storage_key, size, content_type, owner_id, folder_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(name, key, file.size, file.type || 'application/octet-stream', user.id, folder?.id ?? null, timestamp, timestamp).run();
  const stored = await fileRow(env.DB, result.meta.last_row_id);
  await addHistory(env.DB, stored, user, 'upload', null, null, 'Файл загружен', request);
  return json({ message: 'File uploaded successfully', file: serializeFile(stored) }, 201);
}

async function listFiles(request, env) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const { results = [] } = await env.DB.prepare(`
    SELECT f.*, u.email AS owner_email FROM files f JOIN users u ON u.id = f.owner_id
    WHERE f.is_deleted = 0 ORDER BY f.created_at DESC
  `).all();
  const output = [];
  for (const file of results) {
    const permission = await resourcePermission(env.DB, user, 'files', file);
    if (!permission) continue;
    const favorite = await env.DB.prepare("SELECT id FROM favorites WHERE user_id = ? AND item_type = 'file' AND item_id = ?")
      .bind(user.id, file.id).first();
    output.push({ ...serializeFile(file), is_favorite: Boolean(favorite), can_write: canWrite(permission) });
  }
  return json(output);
}

async function accessibleFiles(request, env) {
  const response = await listFiles(request, env);
  if (!response.ok) return response;
  const files = await response.json();
  return json({ count: files.length, files });
}

async function listFolders(request, env) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const { results = [] } = await env.DB.prepare('SELECT * FROM folders WHERE is_deleted = 0 ORDER BY name').all();
  const output = [];
  for (const folder of results) {
    const permission = await resourcePermission(env.DB, user, 'folders', folder);
    if (!permission) continue;
    output.push({
      id: Number(folder.id), name: folder.name, parent_id: folder.parent_id == null ? null : Number(folder.parent_id),
      path: await folderPath(env.DB, folder.id), size: await folderSize(env.DB, folder.id),
      owner_email: (await env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(folder.owner_id).first())?.email,
      is_public: Boolean(folder.is_public), public_token: folder.public_token || null,
      public_expires_at: folder.public_expires_at || null, created_at: folder.created_at,
      updated_at: folder.updated_at, can_write: canWrite(permission),
    });
  }
  return json({ folders: output });
}

async function accessibleFolders(request, env) {
  const response = await listFolders(request, env);
  if (!response.ok) return response;
  const data = await response.json();
  return json({ count: data.folders.length, folders: data.folders });
}

async function folderPath(db, folderId) {
  const names = [];
  let currentId = folderId;
  for (let depth = 0; currentId && depth < 64; depth += 1) {
    const folder = await db.prepare('SELECT name, parent_id FROM folders WHERE id = ?').bind(currentId).first();
    if (!folder) break;
    names.unshift(folder.name);
    currentId = folder.parent_id;
  }
  return `/${names.join('/')}`;
}

async function folderSize(db, folderId, deleted = 0) {
  const row = await db.prepare(`
    WITH RECURSIVE descendants(id) AS (
      SELECT id FROM folders WHERE id = ?
      UNION ALL SELECT f.id FROM folders f JOIN descendants d ON f.parent_id = d.id
    )
    SELECT COALESCE(SUM(size), 0) AS total FROM files WHERE folder_id IN (SELECT id FROM descendants) AND is_deleted = ?
  `).bind(folderId, deleted).first();
  return Number(row?.total || 0);
}

async function createFolder(request, env) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const data = await bodyJson(request);
  const name = sanitizeFilename(String(data.name || '').trim());
  if (!name) return json({ error: 'Folder name is required' }, 400);
  let parent = null;
  if (data.parent_id) {
    parent = await folderRow(env.DB, Number(data.parent_id));
    if (!parent || Number(parent.owner_id) !== Number(user.id)) return json({ error: 'Parent folder not found' }, 404);
  }
  const duplicate = await env.DB.prepare('SELECT id FROM folders WHERE owner_id = ? AND name = ? AND is_deleted = 0 AND parent_id IS ?')
    .bind(user.id, name, parent?.id ?? null).first();
  if (duplicate) return json({ error: 'Папка с таким именем уже существует.' }, 400);
  const timestamp = nowIso();
  const result = await env.DB.prepare('INSERT INTO folders (name, owner_id, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .bind(name, user.id, parent?.id ?? null, timestamp, timestamp).run();
  return json({ id: Number(result.meta.last_row_id), name, parent_id: parent?.id ?? null, path: `${parent ? await folderPath(env.DB, parent.id) : ''}/${name}` }, 201);
}

async function downloadFile(request, env, fileId, inline = false) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const file = await fileRow(env.DB, fileId);
  if (!file) return json({ error: 'File not found' }, 404);
  const permission = await resourcePermission(env.DB, user, 'files', file);
  if (!permission) return json({ error: 'Access denied' }, 403);
  await addHistory(env.DB, file, user, 'download', null, null, 'Файл скачан', request);
  return storedFileResponse(env, file, inline);
}

async function storedFileResponse(env, file, inline = false) {
  const object = await env.FILES.get(file.storage_key);
  if (!object) return json({ error: 'File not found on server' }, 404);
  const disposition = inline ? 'inline' : 'attachment';
  const headers = new Headers({
    'content-type': file.content_type || 'application/octet-stream',
    'content-length': String(file.size || object.size),
    'content-disposition': `${disposition}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    'etag': object.httpEtag,
  });
  return new Response(object.body, { headers });
}

async function mutateFile(request, env, fileId) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const file = await fileRow(env.DB, fileId);
  if (!file) return json({ error: 'File not found' }, 404);
  const permission = await resourcePermission(env.DB, user, 'files', file);
  if (request.method === 'PATCH') {
    if (!canWrite(permission)) return json({ error: 'Access denied' }, 403);
    const data = await bodyJson(request);
    const name = sanitizeFilename(String(data.name || '').trim());
    if (!name) return json({ error: 'New name is required' }, 400);
    const oldName = file.name;
    await env.DB.prepare('UPDATE files SET name = ?, updated_at = ? WHERE id = ?').bind(name, nowIso(), fileId).run();
    const updated = await fileRow(env.DB, fileId);
    await addHistory(env.DB, updated, user, 'rename', oldName, name, 'Файл переименован', request);
    return json({ message: 'File renamed successfully', file: serializeFile(updated) });
  }
  if (Number(file.owner_id) !== Number(user.id)) return json({ error: 'Access denied' }, 403);
  const timestamp = nowIso();
  await env.DB.prepare('UPDATE files SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?').bind(timestamp, timestamp, fileId).run();
  await addHistory(env.DB, file, user, 'delete', null, null, 'Файл перемещён в корзину', request);
  return json({ message: `File "${file.name}" moved to trash successfully` });
}

async function moveFile(request, env, fileId) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const file = await fileRow(env.DB, fileId);
  if (!file) return json({ error: 'File not found' }, 404);
  if (!canWrite(await resourcePermission(env.DB, user, 'files', file))) return json({ error: 'Access denied' }, 403);
  const data = await bodyJson(request);
  let folder = null;
  if (data.folder_id != null && data.folder_id !== '') {
    folder = await folderRow(env.DB, Number(data.folder_id));
    if (!folder) return json({ error: 'Target folder not found' }, 404);
    if (!canWrite(await resourcePermission(env.DB, user, 'folders', folder))) return json({ error: 'Target folder access denied' }, 403);
  }
  const oldPath = file.folder_id ? await folderPath(env.DB, file.folder_id) : 'Корень';
  const newPath = folder ? await folderPath(env.DB, folder.id) : 'Корень';
  await env.DB.prepare('UPDATE files SET folder_id = ?, updated_at = ? WHERE id = ?').bind(folder?.id ?? null, nowIso(), fileId).run();
  const updated = await fileRow(env.DB, fileId);
  await addHistory(env.DB, updated, user, 'move', oldPath, newPath, 'Файл перемещён', request);
  return json({ message: 'File moved successfully', file: serializeFile(updated) });
}

async function fileDetail(request, env, fileId) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const file = await fileRow(env.DB, fileId);
  if (!file) return json({ error: 'File not found' }, 404);
  const permission = await resourcePermission(env.DB, user, 'files', file);
  return permission ? json({ ...serializeFile(file), can_write: canWrite(permission) }) : json({ error: 'Access denied' }, 403);
}

async function readTextFile(request, env, fileId) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const file = await fileRow(env.DB, fileId);
  if (!file) return json({ error: 'File not found' }, 404);
  if (!(await resourcePermission(env.DB, user, 'files', file))) return json({ error: 'Access denied' }, 403);
  if (!EDITABLE_EXTENSIONS.has(extension(file.name))) return json({ error: 'Этот тип файла нельзя редактировать.' }, 400);
  if (Number(file.size) > MAX_TEXT_FILE_SIZE) return json({ error: 'Файл слишком большой для редактирования.' }, 400);
  const object = await env.FILES.get(file.storage_key);
  if (!object) return json({ error: 'File not found on server' }, 404);
  return json({ id: Number(file.id), name: file.name, content: await object.text(), can_write: canWrite(await resourcePermission(env.DB, user, 'files', file)) });
}

async function saveTextFile(request, env, fileId) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const file = await fileRow(env.DB, fileId);
  if (!file) return json({ error: 'File not found' }, 404);
  if (!canWrite(await resourcePermission(env.DB, user, 'files', file))) return json({ error: 'Access denied' }, 403);
  if (!EDITABLE_EXTENSIONS.has(extension(file.name))) return json({ error: 'Этот тип файла нельзя редактировать.' }, 400);
  const data = await bodyJson(request);
  const content = String(data.content ?? '');
  const size = encoder.encode(content).byteLength;
  if (size > MAX_TEXT_FILE_SIZE) return json({ error: 'Файл слишком большой для редактирования.' }, 400);
  await env.FILES.put(file.storage_key, content, { httpMetadata: { contentType: file.content_type || 'text/plain; charset=utf-8' } });
  await env.DB.prepare('UPDATE files SET size = ?, updated_at = ? WHERE id = ?').bind(size, nowIso(), fileId).run();
  await addHistory(env.DB, file, user, 'edit', null, null, 'Содержимое файла изменено', request);
  return json({ message: 'File saved successfully', size });
}

async function storageStats(request, env) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const totals = await env.DB.prepare(`
    SELECT COUNT(*) AS total_files, COALESCE(SUM(size), 0) AS total_size,
      SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS recent_files_count
    FROM files WHERE owner_id = ? AND is_deleted = 0
  `).bind(new Date(Date.now() - 7 * 86400000).toISOString(), user.id).first();
  const { results = [] } = await env.DB.prepare('SELECT name FROM files WHERE owner_id = ? AND is_deleted = 0').bind(user.id).all();
  const fileTypes = {};
  for (const file of results) {
    const ext = extension(file.name);
    const key = ext ? `.${ext}` : 'no extension';
    fileTypes[key] = (fileTypes[key] || 0) + 1;
  }
  const totalSize = Number(totals.total_size || 0);
  const limit = Number(user.storage_limit);
  return json({
    total_files: Number(totals.total_files || 0), total_size: totalSize, storage_limit: limit,
    usage_percent: limit ? Math.round((totalSize / limit) * 10000) / 100 : 0,
    available_space: Math.max(limit - totalSize, 0), recent_files_count: Number(totals.recent_files_count || 0), file_types: fileTypes,
  });
}

async function search(request, env, url) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const query = String(url.searchParams.get('q') || '').trim();
  if (!query) return json({ error: "Search parameter 'q' is required" }, 400);
  const filesResponse = await listFiles(request, env);
  const foldersResponse = await listFolders(request, env);
  if (!filesResponse.ok) return filesResponse;
  const files = (await filesResponse.json()).filter((item) => item.name.toLowerCase().includes(query.toLowerCase())).map((item) => ({ ...item, type: 'file' }));
  const folders = (await foldersResponse.json()).folders.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())).map((item) => ({ ...item, type: 'folder' }));
  return json({ query, count: files.length + folders.length, results: [...folders, ...files] });
}

async function renameFolder(request, env, folderId) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const folder = await folderRow(env.DB, folderId);
  if (!folder) return json({ error: 'Folder not found' }, 404);
  if (Number(folder.owner_id) !== Number(user.id)) return json({ error: 'Access denied' }, 403);
  const data = await bodyJson(request);
  const name = sanitizeFilename(String(data.name || '').trim());
  if (!name) return json({ error: 'New name is required' }, 400);
  await env.DB.prepare('UPDATE folders SET name = ?, updated_at = ? WHERE id = ?').bind(name, nowIso(), folderId).run();
  return json({ id: folderId, name, path: await folderPath(env.DB, folderId) });
}

async function moveFolder(request, env, folderId) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const folder = await folderRow(env.DB, folderId);
  if (!folder) return json({ error: 'Folder not found' }, 404);
  if (Number(folder.owner_id) !== Number(user.id)) return json({ error: 'Access denied' }, 403);
  const data = await bodyJson(request);
  let parent = null;
  if (data.parent_id) {
    parent = await folderRow(env.DB, Number(data.parent_id));
    if (!parent || Number(parent.owner_id) !== Number(user.id)) return json({ error: 'Target folder not found' }, 404);
    const descendant = await env.DB.prepare(`
      WITH RECURSIVE descendants(id) AS (SELECT id FROM folders WHERE id = ? UNION ALL SELECT f.id FROM folders f JOIN descendants d ON f.parent_id = d.id)
      SELECT id FROM descendants WHERE id = ?
    `).bind(folderId, parent.id).first();
    if (descendant) return json({ error: 'Cannot move folder into its own subtree' }, 400);
  }
  await env.DB.prepare('UPDATE folders SET parent_id = ?, updated_at = ? WHERE id = ?').bind(parent?.id ?? null, nowIso(), folderId).run();
  return json({ id: folderId, name: folder.name, path: await folderPath(env.DB, folderId) });
}

async function deleteFolder(request, env, folderId) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const folder = await folderRow(env.DB, folderId);
  if (!folder) return json({ error: 'Folder not found' }, 404);
  if (Number(folder.owner_id) !== Number(user.id)) return json({ error: 'Access denied' }, 403);
  const timestamp = nowIso();
  await env.DB.batch([
    env.DB.prepare(`WITH RECURSIVE descendants(id) AS (SELECT id FROM folders WHERE id = ? UNION ALL SELECT f.id FROM folders f JOIN descendants d ON f.parent_id = d.id) UPDATE folders SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id IN (SELECT id FROM descendants)`).bind(folderId, timestamp, timestamp),
    env.DB.prepare(`WITH RECURSIVE descendants(id) AS (SELECT id FROM folders WHERE id = ? UNION ALL SELECT f.id FROM folders f JOIN descendants d ON f.parent_id = d.id) UPDATE files SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE folder_id IN (SELECT id FROM descendants)`).bind(folderId, timestamp, timestamp),
  ]);
  return json({ status: 'moved_to_trash', id: folderId });
}

async function downloadFolder(request, env, folderId) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const folder = await folderRow(env.DB, folderId);
  if (!folder) return json({ error: 'Folder not found' }, 404);
  if (!(await resourcePermission(env.DB, user, 'folders', folder))) return json({ error: 'Access denied' }, 403);
  const { results = [] } = await env.DB.prepare(`
    WITH RECURSIVE descendants(id, path) AS (
      SELECT id, name FROM folders WHERE id = ?
      UNION ALL SELECT f.id, d.path || '/' || f.name FROM folders f JOIN descendants d ON f.parent_id = d.id WHERE f.is_deleted = 0
    )
    SELECT fi.*, d.path FROM files fi JOIN descendants d ON fi.folder_id = d.id WHERE fi.is_deleted = 0
  `).bind(folderId).all();
  const entries = {};
  for (const file of results) {
    const object = await env.FILES.get(file.storage_key);
    if (object) entries[`${file.path}/${file.name}`] = new Uint8Array(await object.arrayBuffer());
  }
  const archive = zipSync(entries, { level: 6 });
  return new Response(archive, { headers: { 'content-type': 'application/zip', 'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(`${folder.name}.zip`)}` } });
}

async function favorites(request, env) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const { results = [] } = await env.DB.prepare('SELECT item_type, item_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC').bind(user.id).all();
  const items = [];
  for (const favorite of results) {
    const table = favorite.item_type === 'folder' ? 'folders' : 'files';
    const item = await env.DB.prepare(`SELECT id, name${table === 'files' ? ', size' : ''} FROM ${table} WHERE id = ?`).bind(favorite.item_id).first();
    if (item) items.push({ id: Number(item.id), name: item.name, type: favorite.item_type, size: Number(item.size || 0) });
  }
  return json({
    file_ids: results.filter((item) => item.item_type === 'file').map((item) => Number(item.item_id)),
    folder_ids: results.filter((item) => item.item_type === 'folder').map((item) => Number(item.item_id)), items,
  });
}

async function toggleFavorite(request, env, itemId) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const data = await bodyJson(request);
  const type = data.type === 'folder' ? 'folder' : 'file';
  const table = type === 'folder' ? 'folders' : 'files';
  const item = await env.DB.prepare(`SELECT id, owner_id FROM ${table} WHERE id = ?`).bind(itemId).first();
  if (!item || Number(item.owner_id) !== Number(user.id)) return json({ error: `${type === 'folder' ? 'Folder' : 'File'} not found` }, 404);
  const existing = await env.DB.prepare('SELECT id FROM favorites WHERE user_id = ? AND item_type = ? AND item_id = ?').bind(user.id, type, itemId).first();
  if (existing) {
    await env.DB.prepare('DELETE FROM favorites WHERE id = ?').bind(existing.id).run();
    return json({ is_favorite: false, message: type === 'folder' ? 'Папка удалена из избранного' : 'Файл удален из избранного' });
  }
  await env.DB.prepare('INSERT INTO favorites (user_id, item_type, item_id, created_at) VALUES (?, ?, ?, ?)').bind(user.id, type, itemId, nowIso()).run();
  return json({ is_favorite: true, message: type === 'folder' ? 'Папка добавлена в избранное' : 'Файл добавлен в избранное' });
}

async function trashList(request, env, url) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const folderId = url.searchParams.get('folder_id');
  let currentFolder = null;
  if (folderId) {
    currentFolder = await env.DB.prepare('SELECT * FROM folders WHERE id = ? AND owner_id = ? AND is_deleted = 1').bind(Number(folderId), user.id).first();
    if (!currentFolder) return json({ error: 'Folder not found in trash' }, 404);
  }
  const { results: folders = [] } = currentFolder
    ? await env.DB.prepare('SELECT * FROM folders WHERE owner_id = ? AND parent_id = ? AND is_deleted = 1 ORDER BY name').bind(user.id, currentFolder.id).all()
    : await env.DB.prepare(`SELECT f.* FROM folders f LEFT JOIN folders p ON p.id = f.parent_id WHERE f.owner_id = ? AND f.is_deleted = 1 AND (f.parent_id IS NULL OR p.is_deleted = 0) ORDER BY f.deleted_at DESC, f.name`).bind(user.id).all();
  const { results: files = [] } = currentFolder
    ? await env.DB.prepare(`SELECT f.*, u.email AS owner_email FROM files f JOIN users u ON u.id = f.owner_id WHERE f.owner_id = ? AND f.folder_id = ? AND f.is_deleted = 1 ORDER BY f.name`).bind(user.id, currentFolder.id).all()
    : await env.DB.prepare(`SELECT f.*, u.email AS owner_email FROM files f JOIN users u ON u.id = f.owner_id LEFT JOIN folders p ON p.id = f.folder_id WHERE f.owner_id = ? AND f.is_deleted = 1 AND (f.folder_id IS NULL OR p.is_deleted = 0) ORDER BY f.deleted_at DESC, f.name`).bind(user.id).all();
  const folderItems = [];
  for (const folder of folders) folderItems.push({ id: Number(folder.id), type: 'folder', name: folder.name, size: await folderSize(env.DB, folder.id, 1), deleted_at: folder.deleted_at, parent_id: folder.parent_id == null ? null : Number(folder.parent_id) });
  return json({
    current_folder: currentFolder ? { id: Number(currentFolder.id), type: 'folder', name: currentFolder.name, size: await folderSize(env.DB, currentFolder.id, 1), deleted_at: currentFolder.deleted_at, parent_id: currentFolder.parent_id } : null,
    items: [...folderItems, ...files.map((file) => ({ ...serializeFile(file), type: 'file' }))],
  });
}

async function restoreFile(request, env, fileId) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const file = await fileRow(env.DB, fileId, true);
  if (!file || !Number(file.is_deleted) || Number(file.owner_id) !== Number(user.id)) return json({ error: 'File not found in trash' }, 404);
  let folderId = file.folder_id;
  if (folderId) {
    const folder = await folderRow(env.DB, folderId, true);
    if (folder?.is_deleted) folderId = null;
  }
  await env.DB.prepare('UPDATE files SET folder_id = ?, is_deleted = 0, deleted_at = NULL, updated_at = ? WHERE id = ?').bind(folderId, nowIso(), fileId).run();
  return json({ message: `File "${file.name}" restored successfully`, file: serializeFile(await fileRow(env.DB, fileId)) });
}

async function permanentlyDeleteFile(request, env, fileId) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const file = await fileRow(env.DB, fileId, true);
  if (!file || !Number(file.is_deleted) || Number(file.owner_id) !== Number(user.id)) return json({ error: 'File not found in trash' }, 404);
  await env.FILES.delete(file.storage_key);
  await env.DB.prepare('DELETE FROM files WHERE id = ?').bind(fileId).run();
  return json({ message: `File "${file.name}" permanently deleted` });
}

async function restoreFolder(request, env, folderId) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const folder = await folderRow(env.DB, folderId, true);
  if (!folder || !Number(folder.is_deleted) || Number(folder.owner_id) !== Number(user.id)) return json({ error: 'Folder not found in trash' }, 404);
  let parentId = folder.parent_id;
  if (parentId) {
    const parent = await folderRow(env.DB, parentId, true);
    if (parent?.is_deleted) parentId = null;
  }
  await env.DB.batch([
    env.DB.prepare(`WITH RECURSIVE descendants(id) AS (SELECT id FROM folders WHERE id = ? UNION ALL SELECT f.id FROM folders f JOIN descendants d ON f.parent_id = d.id) UPDATE folders SET is_deleted = 0, deleted_at = NULL, updated_at = ? WHERE id IN (SELECT id FROM descendants)`).bind(folderId, nowIso()),
    env.DB.prepare(`WITH RECURSIVE descendants(id) AS (SELECT id FROM folders WHERE id = ? UNION ALL SELECT f.id FROM folders f JOIN descendants d ON f.parent_id = d.id) UPDATE files SET is_deleted = 0, deleted_at = NULL, updated_at = ? WHERE folder_id IN (SELECT id FROM descendants)`).bind(folderId, nowIso()),
    env.DB.prepare('UPDATE folders SET parent_id = ? WHERE id = ?').bind(parentId, folderId),
  ]);
  return json({ message: `Folder "${folder.name}" restored successfully`, folder: { id: folderId, type: 'folder', name: folder.name, size: await folderSize(env.DB, folderId), deleted_at: null, parent_id: parentId } });
}

async function deletedFolderFiles(db, folderId) {
  const { results = [] } = await db.prepare(`WITH RECURSIVE descendants(id) AS (SELECT id FROM folders WHERE id = ? UNION ALL SELECT f.id FROM folders f JOIN descendants d ON f.parent_id = d.id) SELECT id, storage_key FROM files WHERE folder_id IN (SELECT id FROM descendants)`).bind(folderId).all();
  return results;
}

async function permanentlyDeleteFolder(request, env, folderId) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const folder = await folderRow(env.DB, folderId, true);
  if (!folder || !Number(folder.is_deleted) || Number(folder.owner_id) !== Number(user.id)) return json({ error: 'Folder not found in trash' }, 404);
  const files = await deletedFolderFiles(env.DB, folderId);
  await Promise.all(files.map((file) => env.FILES.delete(file.storage_key)));
  if (files.length) {
    await env.DB.prepare(`
      WITH RECURSIVE descendants(id) AS (
        SELECT id FROM folders WHERE id = ?
        UNION ALL SELECT f.id FROM folders f JOIN descendants d ON f.parent_id = d.id
      )
      DELETE FROM files WHERE folder_id IN (SELECT id FROM descendants)
    `).bind(folderId).run();
  }
  await env.DB.prepare('DELETE FROM folders WHERE id = ?').bind(folderId).run();
  return json({ message: `Folder "${folder.name}" permanently deleted` });
}

async function clearTrash(request, env) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const { results: files = [] } = await env.DB.prepare('SELECT id, storage_key FROM files WHERE owner_id = ? AND is_deleted = 1').bind(user.id).all();
  await Promise.all(files.map((file) => env.FILES.delete(file.storage_key)));
  const deletedFiles = await env.DB.prepare('DELETE FROM files WHERE owner_id = ? AND is_deleted = 1').bind(user.id).run();
  const deletedFolders = await env.DB.prepare('DELETE FROM folders WHERE owner_id = ? AND is_deleted = 1').bind(user.id).run();
  return json({ message: 'Trash cleared successfully', deleted_count: deletedFiles.meta.changes, deleted_folders_count: deletedFolders.meta.changes });
}

async function resourceOwned(db, user, type, id, includeDeleted = false) {
  const resource = type === 'files' ? await fileRow(db, id, includeDeleted) : await folderRow(db, id, includeDeleted);
  return resource && Number(resource.owner_id) === Number(user.id) ? resource : null;
}

async function enablePublicLink(request, env, type, id) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const resource = await resourceOwned(env.DB, user, type, id);
  if (!resource) return json({ error: type === 'files' ? 'File not found' : 'Folder not found' }, 404);
  const data = await bodyJson(request);
  let expiresAt = null;
  if (data.public_expires_in_minutes != null && data.public_expires_in_minutes !== '' && data.public_expires_in_minutes !== 'never') {
    const minutes = Number(data.public_expires_in_minutes);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 525600) return json({ error: 'public_expires_in_minutes is out of allowed range' }, 400);
    expiresAt = new Date(Date.now() + minutes * 60000).toISOString();
  }
  const token = resource.public_token || randomToken();
  const table = type;
  await env.DB.prepare(`UPDATE ${table} SET public_token = ?, is_public = 1, public_expires_at = ? WHERE id = ?`).bind(token, expiresAt, id).run();
  const singular = type === 'files' ? 'file' : 'folder';
  return json({ status: 'enabled', [`${singular}_id`]: id, [`${singular}_name`]: resource.name, public_token: token, public_expires_at: expiresAt, public_url: `${new URL(request.url).origin}/api/public/${type}/${token}/` });
}

async function disablePublicLink(request, env, type, id) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const resource = await resourceOwned(env.DB, user, type, id);
  if (!resource) return json({ error: type === 'files' ? 'File not found' : 'Folder not found' }, 404);
  await env.DB.prepare(`UPDATE ${type} SET public_token = NULL, is_public = 0, public_expires_at = NULL WHERE id = ?`).bind(id).run();
  const singular = type === 'files' ? 'file' : 'folder';
  return json({ status: 'disabled', [`${singular}_id`]: id, [`${singular}_name`]: resource.name });
}

async function activePublicResource(db, type, token) {
  const resource = await db.prepare(`SELECT * FROM ${type} WHERE public_token = ? AND is_public = 1 AND is_deleted = 0`).bind(token).first();
  if (!resource) return null;
  if (resource.public_expires_at && resource.public_expires_at <= nowIso()) {
    await db.prepare(`UPDATE ${type} SET public_token = NULL, is_public = 0, public_expires_at = NULL WHERE id = ?`).bind(resource.id).run();
    return null;
  }
  return resource;
}

async function publicFile(request, env, token, url) {
  const file = await activePublicResource(env.DB, 'files', token);
  if (!file) return json({ error: 'Public link expired' }, 404);
  const owner = await env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(file.owner_id).first();
  if (url.searchParams.get('meta') === '1') return json({ id: Number(file.id), name: file.name, size: Number(file.size), owner_email: owner?.email, public_token: token, public_expires_at: file.public_expires_at || null, download_url: request.url.split('?')[0] });
  return storedFileResponse(env, file);
}

async function publicFolder(request, env, token) {
  const folder = await activePublicResource(env.DB, 'folders', token);
  if (!folder) return json({ error: 'Public link expired' }, 404);
  const owner = await env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(folder.owner_id).first();
  const { results: folders = [] } = await env.DB.prepare('SELECT id, name FROM folders WHERE parent_id = ? AND is_deleted = 0 ORDER BY name').bind(folder.id).all();
  const { results: files = [] } = await env.DB.prepare('SELECT id, name, size FROM files WHERE folder_id = ? AND is_deleted = 0 ORDER BY name').bind(folder.id).all();
  const origin = new URL(request.url).origin;
  return json({
    folder: { id: Number(folder.id), name: folder.name, path: await folderPath(env.DB, folder.id), owner_email: owner?.email, public_expires_at: folder.public_expires_at || null },
    folders: folders.map((item) => ({ id: Number(item.id), name: item.name })),
    files: files.map((item) => ({ id: Number(item.id), name: item.name, size: Number(item.size), download_url: `${origin}/api/public/folders/${token}/files/${item.id}/` })),
  });
}

async function publicFolderFile(request, env, token, fileId) {
  const folder = await activePublicResource(env.DB, 'folders', token);
  if (!folder) return json({ error: 'Public link expired' }, 404);
  const file = await fileRow(env.DB, fileId);
  if (!file || Number(file.folder_id) !== Number(folder.id)) return json({ error: 'File not found' }, 404);
  return storedFileResponse(env, file);
}

async function createReport(env, file, data, reporterEmail = '') {
  const reason = String(data.reason || '').trim();
  const message = String(data.message || '').trim();
  if (!reason) return json({ error: 'reason is required' }, 400);
  if (reason.length > 120) return json({ error: 'reason is too long' }, 400);
  if (message.length > 2000) return json({ error: 'message is too long' }, 400);
  const owner = await env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(file.owner_id).first();
  const result = await env.DB.prepare(`INSERT INTO file_reports (file_id, file_name, file_owner_email, public_token, reporter_email, reason, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(file.id, file.name, owner?.email || '', file.public_token || '', reporterEmail, reason, message, nowIso()).run();
  return json({ status: 'created', report_id: Number(result.meta.last_row_id), message: 'Жалоба отправлена администратору.' }, 201);
}

async function reportPublicFile(request, env, token) {
  const file = await activePublicResource(env.DB, 'files', token);
  if (!file) return json({ error: 'Public link expired' }, 404);
  const data = await bodyJson(request);
  return createReport(env, file, data, String(data.reporter_email || '').trim());
}

async function reportFile(request, env, fileId) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const file = await fileRow(env.DB, fileId);
  if (!file) return json({ error: 'File not found' }, 404);
  if (Number(file.owner_id) === Number(user.id)) return json({ error: 'Cannot report your own file' }, 400);
  if (!(await resourcePermission(env.DB, user, 'files', file))) return json({ error: 'Access denied' }, 403);
  return createReport(env, file, await bodyJson(request), user.email);
}

async function permissionData(db, permission) {
  const user = await db.prepare('SELECT id, email, name FROM users WHERE id = ?').bind(permission.user_id).first();
  const grantedBy = await db.prepare('SELECT id, email, name FROM users WHERE id = ?').bind(permission.granted_by_id).first();
  const resourceType = permission.file_id ? 'file' : 'folder';
  const table = permission.file_id ? 'files' : 'folders';
  const resourceId = permission.file_id || permission.folder_id;
  const resource = await db.prepare(`SELECT name FROM ${table} WHERE id = ?`).bind(resourceId).first();
  return {
    id: Number(permission.id), user: Number(permission.user_id), user_email: user?.email, user_name: user?.name,
    granted_by: Number(permission.granted_by_id), granted_by_email: grantedBy?.email, granted_by_name: grantedBy?.name,
    file: permission.file_id ? Number(permission.file_id) : null, folder: permission.folder_id ? Number(permission.folder_id) : null,
    resource_type: resourceType, resource_name: resource?.name, permission_type: permission.permission_type,
    permission_type_display: permission.permission_type === 'read_write' ? 'Чтение и запись' : 'Чтение',
    inherit: Boolean(permission.inherit), created_at: permission.created_at, updated_at: permission.updated_at,
  };
}

async function listPermissions(request, env, type, id) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const resource = await resourceOwned(env.DB, user, type, id);
  if (!resource) return json({ error: 'Только владелец может просматривать права' }, 403);
  const column = type === 'files' ? 'file_id' : 'folder_id';
  const { results = [] } = await env.DB.prepare(`SELECT * FROM permissions WHERE ${column} = ? ORDER BY created_at`).bind(id).all();
  const permissions = [];
  for (const permission of results) permissions.push(await permissionData(env.DB, permission));
  const singular = type === 'files' ? 'file' : 'folder';
  return json({ [`${singular}_id`]: id, [`${singular}_name`]: resource.name, permissions });
}

async function grantPermission(request, env, type, id) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const resource = await resourceOwned(env.DB, user, type, id);
  if (!resource) return json({ error: 'Только владелец может выдавать права' }, 403);
  const data = await bodyJson(request);
  const email = String(data.user_email || '').trim().toLowerCase();
  if (!email) return json({ error: 'Необходимо указать user_email' }, 400);
  const target = await env.DB.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').bind(email).first();
  if (!target) return json({ error: `Пользователь ${email} не найден` }, 404);
  if (Number(target.id) === Number(user.id)) return json({ error: 'Нельзя выдать права самому себе' }, 400);
  const permissionType = data.permission_type === 'read_write' ? 'read_write' : 'read';
  if (type === 'files' && permissionType === 'read_write' && !EDITABLE_EXTENSIONS.has(extension(resource.name))) return json({ error: 'Права на запись можно выдать только для текстовых файлов.' }, 400);
  const column = type === 'files' ? 'file_id' : 'folder_id';
  let permission = await env.DB.prepare(`SELECT * FROM permissions WHERE user_id = ? AND ${column} = ?`).bind(target.id, id).first();
  const timestamp = nowIso();
  if (permission) {
    await env.DB.prepare('UPDATE permissions SET permission_type = ?, inherit = ?, granted_by_id = ?, updated_at = ? WHERE id = ?')
      .bind(permissionType, type === 'folders' && data.inherit !== false ? 1 : 0, user.id, timestamp, permission.id).run();
  } else {
    const result = await env.DB.prepare(`INSERT INTO permissions (user_id, granted_by_id, ${column}, permission_type, inherit, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(target.id, user.id, id, permissionType, type === 'folders' && data.inherit !== false ? 1 : 0, timestamp, timestamp).run();
    permission = await env.DB.prepare('SELECT * FROM permissions WHERE id = ?').bind(result.meta.last_row_id).first();
  }
  permission = await env.DB.prepare('SELECT * FROM permissions WHERE user_id = ? AND ' + column + ' = ?').bind(target.id, id).first();
  return json({ message: 'Права доступа выданы', permission: await permissionData(env.DB, permission) }, 201);
}

async function revokePermission(request, env, type, id) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const resource = await resourceOwned(env.DB, user, type, id);
  if (!resource) return json({ error: 'Только владелец может отзывать права' }, 403);
  const data = await bodyJson(request);
  const target = await env.DB.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').bind(String(data.user_email || '').trim()).first();
  if (!target) return json({ error: 'Пользователь не найден' }, 404);
  const column = type === 'files' ? 'file_id' : 'folder_id';
  const result = await env.DB.prepare(`DELETE FROM permissions WHERE user_id = ? AND ${column} = ?`).bind(target.id, id).run();
  return result.meta.changes ? json({ message: 'Права доступа отозваны' }) : json({ error: 'Права доступа не найдены' }, 404);
}

async function myPermissions(request, env) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const { results = [] } = await env.DB.prepare('SELECT * FROM permissions WHERE user_id = ? ORDER BY created_at DESC').bind(user.id).all();
  const permissions = [];
  for (const permission of results) permissions.push(await permissionData(env.DB, permission));
  return json({ count: permissions.length, permissions });
}

async function addHistory(db, file, user, eventType, oldValue, newValue, details, request) {
  const ip = request.headers.get('cf-connecting-ip') || null;
  await db.prepare(`INSERT INTO file_history (file_id, file_name, event_type, user_id, old_value, new_value, details, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(file.id, file.name, eventType, user?.id ?? null, oldValue, newValue, details, ip, nowIso()).run();
}

function historyData(row) {
  const labels = { upload: 'Загрузка', download: 'Скачивание', delete: 'Удаление', move: 'Перемещение', rename: 'Переименование', edit: 'Редактирование' };
  return {
    id: Number(row.id), file: row.file_id == null ? null : Number(row.file_id), file_name: row.file_name,
    event_type: row.event_type, event_type_display: labels[row.event_type] || row.event_type,
    event_display: row.details || labels[row.event_type] || row.event_type, user: row.user_id == null ? null : Number(row.user_id),
    user_name: row.user_name || row.user_email || 'Система', user_email: row.user_email || null,
    timestamp: row.created_at, old_value: row.old_value, new_value: row.new_value,
    details: row.details, ip_address: row.ip_address,
  };
}

async function fileHistory(request, env, fileId) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const file = await fileRow(env.DB, fileId, true);
  if (!file || !(await resourcePermission(env.DB, user, 'files', file))) return json({ error: 'File not found' }, 404);
  const { results = [] } = await env.DB.prepare(`SELECT h.*, u.name AS user_name, u.email AS user_email FROM file_history h LEFT JOIN users u ON u.id = h.user_id WHERE h.file_id = ? ORDER BY h.created_at DESC`).bind(fileId).all();
  return json({ count: results.length, history: results.map(historyData) });
}

async function userHistory(request, env, recent) {
  const user = await requireUser(request, env);
  if (user instanceof Response) return user;
  const limit = recent ? 20 : 200;
  const { results = [] } = await env.DB.prepare(`SELECT h.*, u.name AS user_name, u.email AS user_email FROM file_history h LEFT JOIN users u ON u.id = h.user_id WHERE h.user_id = ? ORDER BY h.created_at DESC LIMIT ?`).bind(user.id, limit).all();
  return json({ count: results.length, history: results.map(historyData) });
}

async function adminUsers(request, env) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  const { results = [] } = await env.DB.prepare(`
    SELECT u.*, COUNT(f.id) AS file_count, COALESCE(SUM(f.size), 0) AS total_size
    FROM users u LEFT JOIN files f ON f.owner_id = u.id GROUP BY u.id ORDER BY u.date_joined
  `).all();
  return json({ users: results.map((user) => ({ id: Number(user.id), email: user.email, name: user.name, is_active: Boolean(user.is_active), is_staff: Boolean(user.is_staff), date_joined: user.date_joined, file_count: Number(user.file_count), total_size: Number(user.total_size), storage_limit: Number(user.storage_limit) })), total: results.length });
}

async function adminStats(request, env) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  const users = await env.DB.prepare('SELECT COUNT(*) AS total, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active FROM users').first();
  const files = await env.DB.prepare('SELECT COUNT(*) AS total, COALESCE(SUM(size), 0) AS size FROM files').first();
  const reports = await env.DB.prepare("SELECT COUNT(*) AS total FROM file_reports WHERE status = 'pending'").first();
  return json({ total_users: Number(users.total), active_users: Number(users.active), blocked_users: Number(users.total) - Number(users.active), total_files: Number(files.total), total_size_bytes: Number(files.size), total_size_mb: Math.round((Number(files.size) / 1048576) * 100) / 100, max_storage_limit_mb: MAX_STORAGE_LIMIT_MB, pending_reports: Number(reports.total) });
}

async function adminSetActive(request, env, userId, active) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  if (!active && Number(admin.id) === userId) return json({ error: 'Cannot block yourself' }, 400);
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  if (!user) return json({ error: 'User not found' }, 404);
  await env.DB.prepare('UPDATE users SET is_active = ? WHERE id = ?').bind(active ? 1 : 0, userId).run();
  if (!active) await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
  return json({ status: active ? 'unblocked' : 'blocked', user_id: userId, email: user.email });
}

async function adminStorageLimit(request, env, userId) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  const data = await bodyJson(request);
  const limitMb = Number(data.storage_limit_mb);
  if (!Number.isInteger(limitMb)) return json({ error: 'Лимит должен быть целым числом в мегабайтах.' }, 400);
  if (limitMb < 1) return json({ error: 'Лимит должен быть не меньше 1 МБ.' }, 400);
  if (limitMb > MAX_STORAGE_LIMIT_MB) return json({ error: `Нельзя выдать больше ${MAX_STORAGE_LIMIT_MB} МБ на пользователя.`, max_storage_limit_mb: MAX_STORAGE_LIMIT_MB }, 400);
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  if (!user) return json({ error: 'User not found' }, 404);
  await env.DB.prepare('UPDATE users SET storage_limit = ? WHERE id = ?').bind(limitMb * 1048576, userId).run();
  return json({ status: 'storage_limit_updated', user_id: userId, email: user.email, storage_limit: limitMb * 1048576, storage_limit_mb: limitMb });
}

async function deleteUserFiles(env, userId) {
  const { results = [] } = await env.DB.prepare('SELECT storage_key, size FROM files WHERE owner_id = ?').bind(userId).all();
  await Promise.all(results.map((file) => env.FILES.delete(file.storage_key)));
  await env.DB.prepare('DELETE FROM files WHERE owner_id = ?').bind(userId).run();
  return { count: results.length, size: results.reduce((sum, file) => sum + Number(file.size || 0), 0) };
}

async function adminDeleteUserFiles(request, env, userId) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  if (!user) return json({ error: 'User not found' }, 404);
  const deleted = await deleteUserFiles(env, userId);
  return json({ status: 'files_deleted', user_id: userId, email: user.email, files_deleted: deleted.count, deleted_size: deleted.size });
}

async function adminDeleteUser(request, env, userId) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  if (Number(admin.id) === userId) return json({ error: 'Cannot delete yourself' }, 400);
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  if (!user) return json({ error: 'User not found' }, 404);
  const deleted = await deleteUserFiles(env, userId);
  if (user.avatar_key) await env.FILES.delete(user.avatar_key);
  await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
  return json({ status: 'deleted', email: user.email, files_deleted: deleted.count });
}

function reportData(report) {
  return {
    id: Number(report.id), file_id: report.file_id == null ? null : Number(report.file_id), file_name: report.file_name,
    file_owner_email: report.file_owner_email, file_size: report.file_id == null ? null : Number(report.file_size || 0),
    file_exists: report.file_id != null, file_is_public: Boolean(report.file_is_public), public_token: report.public_token,
    reporter_email: report.reporter_email, reason: report.reason, message: report.message, status: report.status,
    admin_action: report.admin_action, admin_note: report.admin_note, reviewed_by_email: report.reviewed_by_email || '',
    created_at: report.created_at, resolved_at: report.resolved_at,
  };
}

async function adminReports(request, env, url) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  const status = url.searchParams.get('status');
  const where = ['pending', 'resolved'].includes(status) ? 'WHERE r.status = ?' : '';
  const statement = env.DB.prepare(`
    SELECT r.*, f.size AS file_size, f.is_public AS file_is_public, u.email AS reviewed_by_email
    FROM file_reports r LEFT JOIN files f ON f.id = r.file_id LEFT JOIN users u ON u.id = r.reviewed_by_id
    ${where} ORDER BY r.created_at DESC
  `);
  const { results = [] } = where ? await statement.bind(status).all() : await statement.all();
  const pending = await env.DB.prepare("SELECT COUNT(*) AS count FROM file_reports WHERE status = 'pending'").first();
  return json({ reports: results.map(reportData), pending: Number(pending.count) });
}

async function adminResolveReport(request, env, reportId) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  const report = await env.DB.prepare('SELECT * FROM file_reports WHERE id = ?').bind(reportId).first();
  if (!report) return json({ error: 'Report not found' }, 404);
  const data = await bodyJson(request);
  const action = data.action;
  if (!['keep', 'disable_public', 'delete_file'].includes(action)) return json({ error: 'Invalid action' }, 400);
  if (['disable_public', 'delete_file'].includes(action) && !report.file_id) return json({ error: 'File already deleted' }, 400);
  if (action === 'disable_public') await env.DB.prepare('UPDATE files SET is_public = 0, public_token = NULL, public_expires_at = NULL WHERE id = ?').bind(report.file_id).run();
  if (action === 'delete_file') {
    const file = await fileRow(env.DB, report.file_id, true);
    if (file) await env.FILES.delete(file.storage_key);
    await env.DB.prepare('DELETE FROM files WHERE id = ?').bind(report.file_id).run();
  }
  const resolvedAt = nowIso();
  await env.DB.prepare('UPDATE file_reports SET status = ?, admin_action = ?, admin_note = ?, reviewed_by_id = ?, resolved_at = ? WHERE id = ?')
    .bind('resolved', action, String(data.admin_note || '').trim(), admin.id, resolvedAt, reportId).run();
  const updated = await env.DB.prepare(`SELECT r.*, f.size AS file_size, f.is_public AS file_is_public, u.email AS reviewed_by_email FROM file_reports r LEFT JOIN files f ON f.id = r.file_id LEFT JOIN users u ON u.id = r.reviewed_by_id WHERE r.id = ?`).bind(reportId).first();
  return json({ status: 'resolved', report: reportData(updated) });
}

async function adminDownloadReport(request, env, reportId) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;
  const report = await env.DB.prepare('SELECT file_id FROM file_reports WHERE id = ?').bind(reportId).first();
  if (!report) return json({ error: 'Report not found' }, 404);
  if (!report.file_id) return json({ error: 'File already deleted' }, 404);
  const file = await fileRow(env.DB, report.file_id, true);
  return file ? storedFileResponse(env, file) : json({ error: 'File already deleted' }, 404);
}
