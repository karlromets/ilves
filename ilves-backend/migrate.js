import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

console.log("Starting migration script...");

const dbPath = process.env.DATABASE_URL || '/app/ilves-backend/db/sqlite.db';
const migrationsFolder = '/app/ilves-backend/drizzle';
const metaFolder = path.join(migrationsFolder, 'meta');
const journalPath = path.join(metaFolder, '_journal.json');

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  console.log(`Creating database directory: ${dbDir}`);
  fs.mkdirSync(dbDir, { recursive: true });
}

if (!fs.existsSync(migrationsFolder)) {
  console.error(`Migrations folder not found: ${migrationsFolder}. Check Dockerfile COPY step.`);
  process.exit(1);
}

if (!fs.existsSync(metaFolder)) {
  console.log(`Creating meta directory: ${metaFolder}`);
  fs.mkdirSync(metaFolder, { recursive: true });
}

if (!fs.existsSync(journalPath)) {
  console.log(`Initializing migration journal file: ${journalPath}`);
  fs.writeFileSync(journalPath, JSON.stringify({
    "version": "6",
    "dialect": "sqlite",
    "entries": []
  }, null, 2));
}

try {
  console.log(`Connecting to database: ${dbPath}`);
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite, { schema: {} });

  console.log(`Running migrations from: ${migrationsFolder}`);
  migrate(db, { migrationsFolder: migrationsFolder });

  console.log("Migrations applied successfully.");
  sqlite.close();
} catch (error) {
  console.error("Migration failed:", error);
  sqlite?.close();
  process.exit(1);
}