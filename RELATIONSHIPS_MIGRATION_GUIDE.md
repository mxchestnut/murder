# Relationships Table Migration Guide

## Problem
The Discord relationship tracking command (`!Duane is Elystrix's bodyguard | They're inseparable.`) wasn't working because the `relationships` table didn't exist in the database.

## Solution
Created migration files to add the relationships table.

## Files Created
1. `backend/migrations/create_relationships_table.sql` - SQL migration script
2. `backend/src/migrate-relationships.ts` - TypeScript migration runner
3. `deploy-relationships-migration.sh` - Deployment script

## Deployment Steps

### Option 1: Using the Deploy Script (Recommended)
```bash
# 1. Commit and push the migration files
git add backend/migrations/create_relationships_table.sql
git add backend/src/migrate-relationships.ts
git commit -m "Add relationships table migration"
git push

# 2. SSH into your server
ssh ec2-user@cyarika.com

# 3. Pull latest code
cd /home/ec2-user/cyarika
git pull

# 4. Run the migration
cd backend
npx tsx src/migrate-relationships.ts

# 5. Restart the backend
pm2 restart cyarika-backend

# 6. Exit
exit
```

### Option 2: Manual SQL Execution
If you have direct database access, run the SQL from `backend/migrations/create_relationships_table.sql`:

```sql
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

CREATE INDEX IF NOT EXISTS idx_relationships_char1 ON relationships(character1_id);
CREATE INDEX IF NOT EXISTS idx_relationships_char2 ON relationships(character2_id);
```

## Testing
After deployment, test the relationship command in Discord:
```
!Duane is Elystrix's bodyguard | They're inseparable.
```

You should see:
```
✅ Added relationship: Duane is Elystrix's bodyguard | They're inseparable.
```

## Viewing Relationships
Use `!profile <character>` to view relationships in the character profile.
