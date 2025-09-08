// backend/src/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || './database.db';
const db = new sqlite3.Database(path.resolve(DB_PATH), (err) => {
  if (err) {
    console.error('Error al abrir la base de datos:', err.message);
  } else {
    console.log(`SQLite conectado en ${path.resolve(DB_PATH)}`);
  }
});

// Ajustes recomendados
db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL;'); // Mejor concurrencia/robustez
  db.run(`CREATE TABLE IF NOT EXISTS app_data (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );`);
});

module.exports = db;

