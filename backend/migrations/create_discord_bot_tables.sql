-- Create missing Discord bot tables

-- Session Messages
CREATE TABLE IF NOT EXISTS session_messages (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  character_name TEXT,
  content TEXT NOT NULL,
  is_dice_roll BOOLEAN DEFAULT false,
  timestamp TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_messages_session ON session_messages(session_id);

-- Scene Messages
CREATE TABLE IF NOT EXISTS scene_messages (
  id SERIAL PRIMARY KEY,
  scene_id INTEGER NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  character_name TEXT,
  content TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scene_messages_scene ON scene_messages(scene_id);

-- GM Notes
CREATE TABLE IF NOT EXISTS gm_notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guild_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gm_notes_user ON gm_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_gm_notes_guild ON gm_notes(guild_id);

-- Game Time
CREATE TABLE IF NOT EXISTS game_time (
  id SERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL UNIQUE,
  "current_date" TEXT NOT NULL,
  "current_time" TEXT,
  calendar TEXT DEFAULT 'Forgotten Realms',
  notes TEXT,
  updated_by TEXT,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_game_time_guild ON game_time(guild_id);
