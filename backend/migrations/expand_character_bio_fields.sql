-- Remove old simple bio fields
ALTER TABLE character_sheets DROP COLUMN IF EXISTS age;
ALTER TABLE character_sheets DROP COLUMN IF EXISTS height;
ALTER TABLE character_sheets DROP COLUMN IF EXISTS weight;
ALTER TABLE character_sheets DROP COLUMN IF EXISTS appearance;
ALTER TABLE character_sheets DROP COLUMN IF EXISTS personality;
ALTER TABLE character_sheets DROP COLUMN IF EXISTS backstory;

-- Add comprehensive bio fields
-- Basic Identity
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS titles TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS species TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS age_description TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS cultural_background TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS gender_identity TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS current_location TEXT;

-- Goals & Motivations
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS current_goal TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS long_term_desire TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS core_motivation TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS deepest_fear TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS core_belief TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS core_misconception TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS moral_code TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS alignment_tendency TEXT;

-- Personality
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS personality_one_sentence TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS key_virtues TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS key_flaws TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS stress_behavior TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS habits_or_tells TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS speech_style TEXT;

-- Appearance
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS physical_presence TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS identifying_traits TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS clothing_aesthetic TEXT;

-- Skills & Abilities
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS notable_equipment TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS skills_relied_on TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS skills_avoided TEXT;

-- Backstory (Markdown)
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS origin TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS greatest_success TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS greatest_failure TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS regret TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS trauma TEXT;

-- Relationships (Markdown)
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS important_relationships TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS protected_relationship TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS avoided_relationship TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS rival TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS affiliated_groups TEXT;

-- Beliefs
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS beliefs_philosophy TEXT;

-- Public vs Private
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS public_facade TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS hidden_aspect TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS secret TEXT;

-- Growth & Change (Markdown)
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS recent_change TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS potential_change TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS breaking_point TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS redemption TEXT;

-- Legacy
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS symbol_or_motif TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS legacy TEXT;
ALTER TABLE character_sheets ADD COLUMN IF NOT EXISTS remembered_as TEXT;
