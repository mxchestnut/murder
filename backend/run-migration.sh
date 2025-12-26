#!/bin/bash
# Run database migration for add_guild_id_to_character_stats

cd /home/ubuntu/murder-tech/backend

# Use the PM2 environment to run migration
pm2 exec murder-tech-backend <<'EOF'
const fs = require('fs');
const { db } = require('./dist/db/index.js');
const { sql } = require('drizzle-orm');

async function runMigration() {
  try {
    const migration = fs.readFileSync('./migrations/add_guild_id_to_character_stats.sql', 'utf8');
    const statements = migration.split(';').filter(s => s.trim());

    for (const stmt of statements) {
      try {
        await db.execute(sql.raw(stmt));
        console.log('✓ Executed:', stmt.substring(0, 80).replace(/\n/g, ' '));
      } catch(e) {
        if (e.message.includes('already exists') || e.message.includes('does not exist')) {
          console.log('⚠ Skipped:', e.message);
        } else {
          console.error('✗ Error:', e.message);
          throw e;
        }
      }
    }
    console.log('✓ Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration().then(() => process.exit(0));
EOF
