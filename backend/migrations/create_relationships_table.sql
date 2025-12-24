-- Create relationships table for character relationship tracking
CREATE TABLE IF NOT EXISTS relationships (
  id SERIAL PRIMARY KEY,
  character1_id INTEGER NOT NULL REFERENCES character_sheets(id) ON DELETE CASCADE,
  character2_id INTEGER NOT NULL REFERENCES character_sheets(id) ON DELETE CASCADE,
  relationship_type TEXT,
  intimacy_level INTEGER DEFAULT 0,
  notes TEXT,
  key_moments TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_relationships_char1 ON relationships(character1_id);
CREATE INDEX IF NOT EXISTS idx_relationships_char2 ON relationships(character2_id);
