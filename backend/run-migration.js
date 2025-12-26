// Simple migration runner using AWS Secrets
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runMigration() {
  // Load secrets
  const { loadSecrets } = require('./dist/config/secrets');
  const secrets = await loadSecrets();

  // Connect to database using DATABASE_URL
  const client = new Client({
    connectionString: secrets.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  await client.connect();
  console.log('✓ Connected to database');

  const migrationPath = path.join(__dirname, 'migrations/add_guild_id_to_character_stats.sql');
  const migration = fs.readFileSync(migrationPath, 'utf8');

  const statements = migration.split(';').filter(s => s.trim());

  console.log(`Running ${statements.length} statements...`);

  for (const stmt of statements) {
    try {
      await client.query(stmt);
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

  await client.end();
  console.log('\n✓ Migration completed!');
  process.exit(0);
}

runMigration().catch(e => { console.error('Failed:', e); process.exit(1); });
