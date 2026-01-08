const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuração da conexão (sem especificar database)
const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4'
};

const DB_NAME = process.env.DB_NAME || 'booktrack';

const initDatabase = async () => {
  let connection;
  
  try {
    // Conectar ao MariaDB
    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Conectado ao MariaDB');

    // Criar/recriar base de dados
    console.log('🗑️  A remover base de dados antiga (se existir)...');
    await connection.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
    
    console.log('📦 A criar base de dados booktrack...');
    await connection.query(`
      CREATE DATABASE ${DB_NAME} 
      CHARACTER SET utf8mb4 
      COLLATE utf8mb4_unicode_ci
    `);
    
    console.log('✅ Base de dados criada');
    
    // Usar a base de dados
    await connection.query(`USE ${DB_NAME}`);

    // ============================================
    // TABELA: Utilizadores
    // ============================================
    console.log('📝 A criar tabela utilizadores...');
    await connection.query(`
      CREATE TABLE utilizadores (
        id_utilizador INT(11) NOT NULL AUTO_INCREMENT,
        nome VARCHAR(100) NOT NULL COMMENT 'Nome completo do utilizador',
        email VARCHAR(150) NOT NULL UNIQUE COMMENT 'Email para login e comunicação',
        password_hash VARCHAR(255) NOT NULL COMMENT 'Password encriptada',
        tipo ENUM('aluno', 'professor', 'bibliotecario') NOT NULL COMMENT 'Tipo/perfil do utilizador',
        data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação da conta',
        
        PRIMARY KEY (id_utilizador),
        INDEX idx_email (email),
        INDEX idx_tipo (tipo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
      COMMENT='Utilizadores do sistema (alunos, professores, bibliotecários)'
    `);
    console.log('✅ Tabela utilizadores criada');

    // ============================================
    // TABELA: Livros
    // ============================================
    console.log('📚 A criar tabela livros...');
    await connection.query(`
      CREATE TABLE livros (
        id_livro INT(11) NOT NULL AUTO_INCREMENT,
        titulo VARCHAR(200) NOT NULL COMMENT 'Título do livro',
        autor VARCHAR(150) NOT NULL COMMENT 'Autor do livro',
        isbn VARCHAR(20) NOT NULL UNIQUE COMMENT 'Código ISBN único do livro',
        categoria VARCHAR(50) DEFAULT NULL COMMENT 'Categoria/género do livro',
        descricao TEXT DEFAULT NULL COMMENT 'Descrição ou sinopse do livro',
        data_publicacao DATE DEFAULT NULL COMMENT 'Data de publicação do livro',
        total_copias INT(11) NOT NULL DEFAULT 1 COMMENT 'Número total de cópias disponíveis',
        copias_disponiveis INT(11) NOT NULL DEFAULT 1 COMMENT 'Número de cópias atualmente disponíveis',
        
        PRIMARY KEY (id_livro),
        INDEX idx_titulo (titulo),
        INDEX idx_autor (autor),
        INDEX idx_isbn (isbn),
        INDEX idx_categoria (categoria)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
      COMMENT='Catálogo de livros da biblioteca'
    `);
    console.log('✅ Tabela livros criada');

    // ============================================
    // TABELA: Empréstimos
    // ============================================
    console.log('📖 A criar tabela emprestimos...');
    await connection.query(`
      CREATE TABLE emprestimos (
        id_emprestimo INT(11) NOT NULL AUTO_INCREMENT,
        id_utilizador INT(11) NOT NULL COMMENT 'Utilizador que fez o empréstimo',
        id_livro INT(11) NOT NULL COMMENT 'Livro emprestado',
        isbn VARCHAR(20) DEFAULT NULL COMMENT 'ISBN do livro (redundância para histórico)',
        categoria VARCHAR(50) DEFAULT NULL COMMENT 'Categoria do livro no momento do empréstimo',
        descricao TEXT DEFAULT NULL COMMENT 'Descrição do livro',
        data_emprestimo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e hora do empréstimo',
        data_devolucao_prevista DATETIME NOT NULL COMMENT 'Data prevista para devolução',
        estado ENUM('ativo', 'devolvido', 'atrasado') NOT NULL DEFAULT 'ativo' COMMENT 'Estado atual do empréstimo',
        multa DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Valor da multa por atraso (em euros)',
        
        PRIMARY KEY (id_emprestimo),
        INDEX idx_utilizador (id_utilizador),
        INDEX idx_livro (id_livro),
        INDEX idx_estado (estado),
        INDEX idx_data_emprestimo (data_emprestimo),
        
        CONSTRAINT fk_emprestimo_utilizador 
          FOREIGN KEY (id_utilizador) 
          REFERENCES utilizadores(id_utilizador)
          ON DELETE RESTRICT
          ON UPDATE CASCADE,
        
        CONSTRAINT fk_emprestimo_livro 
          FOREIGN KEY (id_livro) 
          REFERENCES livros(id_livro)
          ON DELETE RESTRICT
          ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
      COMMENT='Gestão de empréstimos de livros'
    `);
    console.log('✅ Tabela emprestimos criada');

    // ============================================
    // TABELA: Reservas
    // ============================================
    console.log('📋 A criar tabela reservas...');
    await connection.query(`
      CREATE TABLE reservas (
        id_reserva INT(11) NOT NULL AUTO_INCREMENT,
        id_utilizador INT(11) NOT NULL COMMENT 'Utilizador que fez a reserva',
        id_livro INT(11) NOT NULL COMMENT 'Livro reservado',
        data_reserva DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e hora da reserva',
        data_expiracao DATETIME NOT NULL COMMENT 'Data de expiração da reserva (+7 dias)',
        estado ENUM('pendente', 'confirmada', 'cancelada', 'expirada') NOT NULL DEFAULT 'pendente' COMMENT 'Estado atual da reserva',
        posicao_fila INT(11) DEFAULT NULL COMMENT 'Posição do utilizador na fila de espera',
        
        PRIMARY KEY (id_reserva),
        INDEX idx_utilizador (id_utilizador),
        INDEX idx_livro (id_livro),
        INDEX idx_estado (estado),
        INDEX idx_data_reserva (data_reserva),
        
        CONSTRAINT fk_reserva_utilizador 
          FOREIGN KEY (id_utilizador) 
          REFERENCES utilizadores(id_utilizador)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        
        CONSTRAINT fk_reserva_livro 
          FOREIGN KEY (id_livro) 
          REFERENCES livros(id_livro)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
      COMMENT='Gestão de reservas de livros'
    `);
    console.log('✅ Tabela reservas criada');

    // ============================================
    // TABELA: Notificações
    // ============================================
    console.log('🔔 A criar tabela notificacoes...');
    await connection.query(`
      CREATE TABLE notificacoes (
        id_notificacao INT(11) NOT NULL AUTO_INCREMENT,
        id_utilizador INT(11) NOT NULL COMMENT 'Utilizador destinatário',
        mensagem TEXT NOT NULL COMMENT 'Conteúdo da mensagem de notificação',
        tipo ENUM('disponibilidade', 'devolucao', 'atraso', 'reserva') NOT NULL COMMENT 'Tipo de notificação',
        data_envio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e hora de envio da notificação',
        lida BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Indica se a notificação foi lida',
        
        PRIMARY KEY (id_notificacao),
        INDEX idx_utilizador (id_utilizador),
        INDEX idx_tipo (tipo),
        INDEX idx_lida (lida),
        INDEX idx_data_envio (data_envio),
        
        CONSTRAINT fk_notificacao_utilizador 
          FOREIGN KEY (id_utilizador) 
          REFERENCES utilizadores(id_utilizador)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
      COMMENT='Sistema de notificações para utilizadores'
    `);
    console.log('✅ Tabela notificacoes criada');

    // ============================================
    // TABELA: Relatórios
    // ============================================
    console.log('📊 A criar tabela relatorios...');
    await connection.query(`
      CREATE TABLE relatorios (
        id_relatorio INT(11) NOT NULL AUTO_INCREMENT,
        tipo VARCHAR(100) NOT NULL COMMENT 'Tipo de relatório',
        data_geracao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e hora de geração',
        conteudo TEXT DEFAULT NULL COMMENT 'Conteúdo do relatório',
        id_bibliotecario INT(11) NOT NULL COMMENT 'Bibliotecário que gerou',
        
        PRIMARY KEY (id_relatorio),
        INDEX idx_tipo (tipo),
        INDEX idx_data_geracao (data_geracao),
        INDEX idx_bibliotecario (id_bibliotecario),
        
        CONSTRAINT fk_relatorio_bibliotecario 
          FOREIGN KEY (id_bibliotecario) 
          REFERENCES utilizadores(id_utilizador)
          ON DELETE RESTRICT
          ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
      COMMENT='Relatórios gerados pelo sistema'
    `);
    console.log('✅ Tabela relatorios criada');

    console.log('\n🎉 Base de dados inicializada com sucesso!');
    console.log('Execute "npm run seed-db" para popular com dados de exemplo\n');

  } catch (error) {
    console.error('❌ Erro ao inicializar base de dados:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

initDatabase();
