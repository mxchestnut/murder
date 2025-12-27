#!/usr/bin/env node
/**
 * Script to set a user as admin
 * Run on production server: node set-admin.js <username>
 */

const { Client } = require('pg');
require('dotenv').config();

async function setAdmin(username) {
  if (!username) {
    console.error('Usage: node set-admin.js <username>');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const result = await client.query(
      'UPDATE users SET is_admin = true WHERE username = $1 RETURNING id, username, is_admin',
      [username]
    );

    if (result.rows.length === 0) {
      console.error(`User '${username}' not found`);
      process.exit(1);
    }

    console.log('✓ User updated:', result.rows[0]);
    console.log(`✓ ${username} is now an admin!`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

const username = process.argv[2];
setAdmin(username);
