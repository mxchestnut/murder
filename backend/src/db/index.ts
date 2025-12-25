import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// For development, initialize immediately from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true
  } : undefined
});

export const db = drizzle(pool, { schema });

// For production, reinitialize with secrets from AWS
export async function reinitializeDatabase(databaseUrl: string) {
  const newPool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: true,
      // RDS certificates are signed by Amazon, Node.js will accept them
      // No need to provide CA certificate for AWS RDS
    }
  });

  const newDb = drizzle(newPool, { schema });
  
  // Replace the pool and db (close old connection)
  await pool.end();
  Object.assign(pool, newPool);
  Object.assign(db, newDb);
  
  console.log('✓ Database connection reinitialized with AWS secrets');
  
  return db;
}
