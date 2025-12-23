// Import default prompts and tropes to database
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const sql = neon(process.env.DATABASE_URL);

async function importDefaults() {
  try {
    const migration = readFileSync(join(__dirname, 'migrations/add_default_prompts_and_tropes.sql'), 'utf8');
    
    // Execute the SQL
    await sql(migration);
    
    console.log('✅ Successfully imported 25 prompts and 40 tropes!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing defaults:', error);
    process.exit(1);
  }
}

importDefaults();
