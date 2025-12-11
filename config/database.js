const mysql = require('mysql2/promise');

// Configuração da conexão com MariaDB
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'booktrack',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

// Criar pool de conexões
const pool = mysql.createPool(dbConfig);

// Testar conexão
pool.getConnection()
  .then(connection => {
    console.log('✅ Conectado à base de dados MariaDB');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar à base de dados:', err.message);
    console.error('Verifique as credenciais no ficheiro .env');
  });

module.exports = pool;
