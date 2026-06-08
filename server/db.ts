import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const dbPath = path.resolve(process.cwd(), 'bmu.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    student_no TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    faculty TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS classrooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faculty_name TEXT NOT NULL,
    building TEXT NOT NULL,
    room_name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    status TEXT DEFAULT NULL,
    temp TEXT DEFAULT NULL,
    net TEXT DEFAULT NULL,
    occupancy INTEGER DEFAULT 0,
    uploaded_by INTEGER REFERENCES students(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(building, room_name)
  );

  CREATE TABLE IF NOT EXISTS insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id),
    classroom_id INTEGER REFERENCES classrooms(id),
    status TEXT NOT NULL,
    temp TEXT NOT NULL,
    net TEXT NOT NULL,
    points_awarded INTEGER DEFAULT 0,
    is_voided INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS false_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_student_id INTEGER REFERENCES students(id),
    insight_id INTEGER REFERENCES insights(id),
    classroom_id INTEGER REFERENCES classrooms(id),
    field TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS point_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id),
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    insight_id INTEGER REFERENCES insights(id),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS upload_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id),
    filename TEXT,
    row_count INTEGER,
    points INTEGER DEFAULT 200,
    status TEXT DEFAULT 'pending',
    data TEXT,
    uploaded_at TEXT DEFAULT (datetime('now'))
  );
`);

try {
  db.exec('ALTER TABLE upload_log ADD COLUMN status TEXT DEFAULT "pending";');
} catch (e) {}

try {
  db.exec('ALTER TABLE upload_log ADD COLUMN data TEXT;');
} catch (e) {}

try {
  db.exec('ALTER TABLE students ADD COLUMN points INTEGER DEFAULT 0;');
} catch (e) {}

try { db.exec('ALTER TABLE classrooms ADD COLUMN status TEXT DEFAULT NULL;'); } catch (e) {}
try { db.exec('ALTER TABLE classrooms ADD COLUMN temp INTEGER DEFAULT NULL;'); } catch (e) {}
try { db.exec('ALTER TABLE classrooms ADD COLUMN net TEXT DEFAULT NULL;'); } catch (e) {}
try { db.exec('ALTER TABLE classrooms ADD COLUMN occupancy INTEGER DEFAULT 0;'); } catch (e) {}
try { db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_room_unique ON classrooms(building, room_name);'); } catch (e) {}

try { db.exec('ALTER TABLE classrooms ADD COLUMN last_insight_id INTEGER DEFAULT NULL;'); } catch (e) {}
try { db.exec('ALTER TABLE classrooms ADD COLUMN last_insight_at TEXT DEFAULT NULL;'); } catch (e) {}
try { db.exec('ALTER TABLE students ADD COLUMN reputation INTEGER DEFAULT 100;'); } catch (e) {}

try {
  db.exec(`
    INSERT OR IGNORE INTO students (id, full_name, student_no, email, faculty, points)
    VALUES (999, 'Admin', 'admin', 'admin@bmu.edu.tr', 'Mühendislik Fakültesi', 0);
  `);
} catch (e) {
  console.log(e);
}

export default db;
