import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR ?? path.resolve(here, '../data');
mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(path.join(dataDir, 'ap1.sqlite'));
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS attempts (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TEXT NOT NULL,
    deadline TEXT NOT NULL,
    submitted_at TEXT,
    status TEXT NOT NULL,
    exam_json TEXT NOT NULL,
    answers_json TEXT NOT NULL,
    results_json TEXT,
    score REAL,
    total_points INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id, started_at DESC);
`);

export function getSetting(key: string): string | undefined {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value;
}
export function setSetting(key: string, value: string) {
  db.prepare('INSERT INTO settings(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
}

/** JWT-Secret: aus ENV oder einmalig erzeugt und in der DB gespeichert. */
export function jwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  let s = getSetting('jwt_secret');
  if (!s) {
    s = randomBytes(48).toString('hex');
    setSetting('jwt_secret', s);
  }
  return s;
}

export interface UserRow {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
}
export interface AttemptRow {
  id: string;
  user_id: number;
  started_at: string;
  deadline: string;
  submitted_at: string | null;
  status: 'running' | 'grading' | 'graded' | 'expired';
  exam_json: string;
  answers_json: string;
  results_json: string | null;
  score: number | null;
  total_points: number;
}
