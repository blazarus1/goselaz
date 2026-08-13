CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  is_active INTEGER NOT NULL DEFAULT 1
    CHECK (is_active IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorite_teams (
  id INTEGER PRIMARY KEY,
  team_name TEXT NOT NULL UNIQUE,
  sport TEXT NOT NULL,
  league TEXT,
  data_source TEXT NOT NULL DEFAULT 'thesportsdb',
  external_team_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
    CHECK (is_active IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS countdowns (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  target_date TEXT NOT NULL,
  category TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
    CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  body TEXT,
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high')),
  starts_at TEXT,
  ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
    CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grocery_items (
  id INTEGER PRIMARY KEY,
  item TEXT NOT NULL UNIQUE,
  quantity TEXT,
  is_checked INTEGER NOT NULL DEFAULT 0
    CHECK (is_checked IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cached_responses (
  cache_key TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  source_name TEXT NOT NULL,
  fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_countdowns_active_target
  ON countdowns (is_active, target_date);

CREATE INDEX IF NOT EXISTS idx_announcements_active_dates
  ON announcements (is_active, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_grocery_items_checked
  ON grocery_items (is_checked, item);

CREATE INDEX IF NOT EXISTS idx_cache_expiration
  ON cached_responses (expires_at);

CREATE TABLE IF NOT EXISTS google_oauth_tokens (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  encrypted_tokens TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);