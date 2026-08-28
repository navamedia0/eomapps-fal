-- Mistik Rehber Social API — D1 şeması
-- Faz 0: hesap sistemi + Faz 1: takip/engelle ilişkileri

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,          -- 'google' | 'apple'
  provider_sub TEXT NOT NULL,      -- sağlayıcının sabit kullanıcı kimliği (JWT 'sub')
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(provider, provider_sub)
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,          -- opak oturum belirteci (rastgele, JWT değil)
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS follows (
  follower_id TEXT NOT NULL REFERENCES users(id),
  followee_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (follower_id, followee_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_followee ON follows(followee_id);

CREATE TABLE IF NOT EXISTS blocks (
  blocker_id TEXT NOT NULL REFERENCES users(id),
  blocked_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (blocker_id, blocked_id)
);
