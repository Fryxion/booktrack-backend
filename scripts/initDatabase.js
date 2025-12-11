const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Criar diretório database se não existir
const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const DB_PATH = process.env.DB_PATH || path.join(dbDir, 'booktrack.db');

// Remover base de dados antiga se existir
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('Base de dados antiga removida');
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Erro ao criar base de dados:', err.message);
    process.exit(1);
  }
  console.log('Base de dados criada');
});

// Habilitar chaves estrangeiras
db.run('PRAGMA foreign_keys = ON');

// Criar tabelas
const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabela de Utilizadores
      db.run(`
        CREATE TABLE IF NOT EXISTS utilizadores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          tipo TEXT NOT NULL CHECK(tipo IN ('Aluno', 'Professor', 'Funcionário', 'Admin')),
          data_registo TEXT NOT NULL,
          ativo INTEGER DEFAULT 1,
          criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
          atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else console.log('✅ Tabela utilizadores criada');
      });

      // Tabela de Livros
      db.run(`
        CREATE TABLE IF NOT EXISTS livros (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          titulo TEXT NOT NULL,
          autor TEXT NOT NULL,
          isbn TEXT UNIQUE,
          publicacao TEXT,
          categoria TEXT,
          descricao TEXT,
          disponivel INTEGER DEFAULT 1,
          quantidade_total INTEGER DEFAULT 1,
          quantidade_disponivel INTEGER DEFAULT 1,
          capa_url TEXT,
          criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
          atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else console.log('✅ Tabela livros criada');
      });

      // Tabela de Reservas
      db.run(`
        CREATE TABLE IF NOT EXISTS reservas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          utilizador_id INTEGER NOT NULL,
          livro_id INTEGER NOT NULL,
          data_reserva TEXT NOT NULL,
          data_expiracao TEXT NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('ativa', 'expirada', 'cancelada', 'completada')),
          criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
          atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE,
          FOREIGN KEY (livro_id) REFERENCES livros(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) reject(err);
        else console.log('Tabela reservas criada');
      });

      // Tabela de Empréstimos
      db.run(`
        CREATE TABLE IF NOT EXISTS emprestimos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          utilizador_id INTEGER NOT NULL,
          livro_id INTEGER NOT NULL,
          data_emprestimo TEXT NOT NULL,
          data_devolucao_prevista TEXT NOT NULL,
          data_devolucao_real TEXT,
          status TEXT NOT NULL CHECK(status IN ('ativo', 'devolvido', 'atrasado')),
          multa REAL DEFAULT 0,
          criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
          atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE,
          FOREIGN KEY (livro_id) REFERENCES livros(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) reject(err);
        else console.log('Tabela emprestimos criada');
      });

      // Criar índices para melhor performance
      db.run('CREATE INDEX IF NOT EXISTS idx_utilizadores_email ON utilizadores(email)');
      db.run('CREATE INDEX IF NOT EXISTS idx_livros_titulo ON livros(titulo)');
      db.run('CREATE INDEX IF NOT EXISTS idx_livros_autor ON livros(autor)');
      db.run('CREATE INDEX IF NOT EXISTS idx_reservas_utilizador ON reservas(utilizador_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_reservas_livro ON reservas(livro_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_emprestimos_utilizador ON emprestimos(utilizador_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_emprestimos_livro ON emprestimos(livro_id)', (err) => {
        if (err) reject(err);
        else {
          console.log('✅ Ýndices criados');
          resolve();
        }
      });
    });
  });
};

// Executar criação
createTables()
  .then(() => {
    console.log('\n🎉 Base de dados inicializada com sucesso!');
    console.log('Execute "npm run seed-db" para popular com dados de exemplo\n');
    db.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro ao criar tabelas:', err);
    db.close();
    process.exit(1);
  });
