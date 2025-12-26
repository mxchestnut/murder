-- Add notes and loot fields to sessions table
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS loot TEXT;
