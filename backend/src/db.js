const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/database.db';
const resolvedPath = path.resolve(DB_PATH);
const dirPath = path.dirname(resolvedPath);

// Check if directory is writable
try {
  fs.accessSync(dirPath, fs.constants.W_OK);
} catch (err) {
  throw new Error(`Database directory is not writable: ${dirPath}`);
}

// Check if database file exists
const dbExists = fs.existsSync(resolvedPath);

// If not exists, create an empty file
if (!dbExists) {
  fs.writeFileSync(resolvedPath, '');
  console.log(`Database file created at ${resolvedPath}`);
} else {
  console.log(`Database file exists at ${resolvedPath}`);
}

const db = new sqlite3.Database(resolvedPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log(`SQLite connected at ${resolvedPath}`);
  }
});

// Recommended settings and table creation
db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL;');
  db.run(`CREATE TABLE IF NOT EXISTS app_data (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );`);
});

module.exports = db;