import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function createMigrationsTable(client: Awaited<ReturnType<typeof pool.connect>>) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(
  client: Awaited<ReturnType<typeof pool.connect>>
): Promise<string[]> {
  const result = await client.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations ORDER BY id'
  );
  return result.rows.map((r) => r.filename);
}

async function runMigrations() {
  const client = await pool.connect();

  try {
    await createMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const pending = files.filter((f) => !applied.includes(f));

    if (pending.length === 0) {
      console.info('No pending migrations');
      return;
    }

    console.info(`Running ${pending.length} migration(s)...`);

    for (const file of pending) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.info(`Applying: ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.info(`Applied: ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Failed: ${file}`, error);
        throw error;
      }
    }

    console.info('All migrations applied successfully');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
