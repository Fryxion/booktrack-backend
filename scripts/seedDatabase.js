const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'booktrack',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4'
};

const seedDatabase = async () => {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado à base de dados');

    // Hash da password "123456" (igual ao script SQL original)
    const password_hash = '$2a$10$3our6BIGaCR7UaT/ApcGYuDWlxPO8Jb20wS2LfOyikT4LdMD0DEf2';

    // ============================================
    // INSERIR UTILIZADORES
    // ============================================
    console.log('📝 A inserir utilizadores...');
    
    await connection.query(`
      INSERT INTO utilizadores (nome, email, password_hash, tipo) VALUES
      ('José Saramago', 'josesaramago@gmail.com', ?, 'professor'),
      ('Maria Silva', 'maria.silva@aluno.pt', ?, 'aluno'),
      ('João Costa', 'joao.costa@aluno.pt', ?, 'aluno'),
      ('Ana Bibliotecária', 'ana.bib@biblioteca.pt', ?, 'bibliotecario')
    `, [password_hash, password_hash, password_hash, password_hash]);
    
    console.log('✅ Utilizadores inseridos');

    // ============================================
    // INSERIR LIVROS
    // ============================================
    console.log('📚 A inserir livros...');
    
    await connection.query(`
      INSERT INTO livros (titulo, autor, isbn, categoria, descricao, data_publicacao, total_copias, copias_disponiveis) VALUES
      ('Os Lusíadas', 'Luís de Camões', '978-0000000001', 'Poesia Épica', 'Epopeia que narra os feitos dos navegadores portugueses, principalmente Vasco da Gama na descoberta do caminho marítimo para a Índia.', '1572-01-01', 3, 2),
      ('Memorial do Convento', 'José Saramago', '978-0000000002', 'Romance Histórico', 'Romance histórico sobre a construção do Convento de Mafra no século XVIII.', '1982-01-01', 2, 2),
      ('Mensagem', 'Fernando Pessoa', '978-0000000003', 'Poesia', 'Obra poética sobre a história e o destino de Portugal.', '1934-01-01', 2, 0),
      ('A Cidade e as Serras', 'Eça de Queirós', '978-0000000004', 'Romance', 'Romance que contrasta a vida na cidade de Paris com a vida rural nas serras portuguesas.', '1901-01-01', 3, 3),
      ('O Crime do Padre Amaro', 'Eça de Queirós', '978-0000000005', 'Romance Realista', 'Romance realista que retrata a hipocrisia e corrupção do clero numa pequena cidade portuguesa.', '1875-01-01', 2, 2)
    `);
    
    console.log('✅ Livros inseridos');

    console.log('\n🎉 Base de dados populada com sucesso!');
    console.log('\n📌 Credenciais de teste (password para todos: 123456):');
    console.log('\n   👨‍🏫 Professor:');
    console.log('      Email: josesaramago@gmail.com');
    console.log('      Password: 123456\n');
    console.log('   👨‍🎓 Aluno 1:');
    console.log('      Email: maria.silva@aluno.pt');
    console.log('      Password: 123456\n');
    console.log('   👨‍🎓 Aluno 2:');
    console.log('      Email: joao.costa@aluno.pt');
    console.log('      Password: 123456\n');
    console.log('   👩‍💼 Bibliotecária:');
    console.log('      Email: ana.bib@biblioteca.pt');
    console.log('      Password: 123456\n');

  } catch (error) {
    console.error('❌ Erro ao popular base de dados:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

seedDatabase();
