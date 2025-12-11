const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Caminho para a base de dados
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/booktrack.db');

// Criar conexão com a base de dados
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Erro ao conectar à base de dados:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado à base de dados SQLite');
});

// Habilitar chaves estrangeiras
db.run('PRAGMA foreign_keys = ON');

module.exports = db;
