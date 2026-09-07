const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5435', 10),
  user: process.env.DB_USER || 'mfms',
  password: process.env.DB_PASSWORD || 'mfms_dev_password',
  database: process.env.DB_NAME || 'password_manager',
});

// Auto-initialize tables from schema.sql
const initDb = async () => {
  try {
    const client = await pool.connect();
    console.log('⚡ [PostgreSQL] Connected to database:', process.env.DB_NAME);
    
    const schemaPath = path.join(__dirname, '../schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(sql);
      console.log('✅ [PostgreSQL] Schema migration checked/applied successfully.');
    }

    // Backfill a random per-user encryption salt for any pre-existing account
    // that predates the encryption_salt column.
    const missingSalt = await client.query('SELECT id FROM users WHERE encryption_salt IS NULL');
    for (const row of missingSalt.rows) {
      const salt = crypto.randomBytes(16).toString('hex');
      await client.query('UPDATE users SET encryption_salt = $1 WHERE id = $2', [salt, row.id]);
    }
    if (missingSalt.rows.length > 0) {
      console.log(`🔐 [PostgreSQL] Backfilled encryption_salt for ${missingSalt.rows.length} user(s).`);
    }

    client.release();
  } catch (err) {
    console.error('❌ [PostgreSQL] Database initialization error:', err);
  }
};

initDb();

module.exports = pool;
