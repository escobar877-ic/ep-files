PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  avatar_key TEXT,
  avatar_type TEXT,
  is_staff INTEGER NOT NULL DEFAULT 0,
  is_superuser INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  storage_limit INTEGER NOT NULL DEFAULT 104857600,
  date_joined TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  public_token TEXT UNIQUE,
  is_public INTEGER NOT NULL DEFAULT 0,
  public_expires_at TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS folders_owner_idx ON folders(owner_id, is_deleted);
CREATE INDEX IF NOT EXISTS folders_parent_idx ON folders(parent_id, is_deleted);
CREATE INDEX IF NOT EXISTS folders_public_idx ON folders(public_token);

CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  size INTEGER NOT NULL DEFAULT 0,
  content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL,
  public_token TEXT UNIQUE,
  is_public INTEGER NOT NULL DEFAULT 0,
  public_expires_at TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS files_owner_idx ON files(owner_id, is_deleted);
CREATE INDEX IF NOT EXISTS files_folder_idx ON files(folder_id, is_deleted);
CREATE INDEX IF NOT EXISTS files_public_idx ON files(public_token);

CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK(item_type IN ('file', 'folder')),
  item_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  granted_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
  folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL CHECK(permission_type IN ('read', 'read_write')),
  inherit INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK((file_id IS NOT NULL AND folder_id IS NULL) OR (file_id IS NULL AND folder_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS permissions_user_idx ON permissions(user_id);
CREATE INDEX IF NOT EXISTS permissions_file_idx ON permissions(file_id);
CREATE INDEX IF NOT EXISTS permissions_folder_idx ON permissions(folder_id);

CREATE TABLE IF NOT EXISTS file_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER,
  file_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  old_value TEXT,
  new_value TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS file_history_user_idx ON file_history(user_id, created_at);
CREATE INDEX IF NOT EXISTS file_history_file_idx ON file_history(file_id, created_at);

CREATE TABLE IF NOT EXISTS file_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER REFERENCES files(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_owner_email TEXT NOT NULL DEFAULT '',
  public_token TEXT NOT NULL DEFAULT '',
  reporter_email TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  admin_action TEXT NOT NULL DEFAULT '',
  admin_note TEXT NOT NULL DEFAULT '',
  reviewed_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE INDEX IF NOT EXISTS file_reports_status_idx ON file_reports(status, created_at);
