// backend/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

// --- Configuración ---
const PORT = process.env.PORT || 4000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

// Middlewares
app.use(cors({ origin: ALLOWED_ORIGIN, credentials: false }));
app.use(express.json({ limit: '10mb' }));

// --- Rutas utilitarias ---
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// --- Rutas de persistencia (clave-valor) ---
// Cargar todo el estado persistido
app.get('/api/data', (_req, res) => {
  const sql = `SELECT * FROM app_data`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // Estado por defecto
    const initialState = {
      incomeData: {},
      tipsPoolData: {},
      uploadedCSVs: [], // importante para "Verificar Salarios"
    };

    rows.forEach((row) => {
      try {
        initialState[row.key] = JSON.parse(row.value);
      } catch {
        // Si por alguna razón value no es JSON válido, lo dejamos tal cual en string
        initialState[row.key] = row.value;
      }
    });

    res.json(initialState);
  });
});

// Guardar/actualizar una clave
app.post('/api/data', (req, res) => {
  const { key, value } = req.body;
  if (!key || typeof value === 'undefined') {
    return res.status(400).json({ error: 'Se requieren "key" y "value".' });
  }

  const sql = `INSERT OR REPLACE INTO app_data (key, value) VALUES (?, ?)`;
  const jsonValue = JSON.stringify(value);
  db.run(sql, [key, jsonValue], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, key, changes: this.changes });
  });
});

// (Opcional) Eliminar una clave concreta
app.delete('/api/data/:key', (req, res) => {
  const sql = `DELETE FROM app_data WHERE key = ?`;
  db.run(sql, [req.params.key], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, deleted: this.changes });
  });
});

// Levantar servidor
const BIND_ADDR = process.env.BIND_ADDR || '127.0.0.1';
app.listen(PORT, BIND_ADDR, () => {
  console.log(`Backend listo en http://${BIND_ADDR}:${PORT}`);
});

