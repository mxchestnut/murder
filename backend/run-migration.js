// Simple migration runner using AWS Secrets
const fs = require('fs');
const path = require('path');

async function runMigration() {
  // Import after secrets are loaded
  const { db } = require('./dist/db/index');
  const { sql } = require('drizzle-orm');

  const migrationPath = path.join(__dirname, 'migrations/add_guild_id_to_character_stats.sql');
  const migration = fs.readFileSync(migrationPath, 'utf8');

  const statements = migration.split(';').filter(s => s.trim());

  console.log(`Running ${statements.length} statements...`);

  for (const stmt of statements) {
    try {
      await db.execute(sql.raw(stmt));
      console.log('✓', stmt.substring(0, 60).replace(/\n/g, ' ') + '...');
    } catch (e) {
      if (e.message.includes('already exists') || e.message.includes('does not exist')) {
        console.log('⚠ Skipped (already applied):', e.message.substring(0, 80));
      } else {
        console.error('✗ Error:', e.message);
        throw e;
      }
    }
  }

  console.log('\n✓ Migration completed!');
  process.exit(0);
}

// Wait a bit for secrets to load
setTimeout(() => runMigration().catch(e => { console.error('Failed:', e); process.exit(1); }), 2000);
