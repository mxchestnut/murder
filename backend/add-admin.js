require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Pool } = require('pg');
const { getSecretsWithFallback } = require('./dist/config/secrets');

async function runMigration() {
  const secrets = await getSecretsWithFallback();
  const pool = new Pool({ connectionString: secrets.DATABASE_URL });
  
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;');
    console.log('✓ Added is_admin column');
    
    await pool.query('UPDATE users SET is_admin = TRUE WHERE id = 1;');
    console.log('✓ Set user ID 1 as admin');
    
    await pool.end();
  } catch (error) {
    console.error('Migration error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
