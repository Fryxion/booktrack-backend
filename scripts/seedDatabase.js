const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/booktrack.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Erro ao conectar à base de dados:', err.message);
    process.exit(1);
  }
});

db.run('PRAGMA foreign_keys = ON');

const seedDatabase = async () => {
  try {
    // Hash da password padrão (password: "123456")
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Inserir utilizadores de exemplo
    const utilizadores = [
      {
        nome: 'José Saramago',
        email: 'josesaramago@gmail.com',
        password: hashedPassword,
        tipo: 'Professor',
        data_registo: '15/09/2025'
      },
      {
        nome: 'Maria Silva',
        email: 'maria.silva@escola.pt',
        password: hashedPassword,
        tipo: 'Aluno',
        data_registo: '01/09/2025'
      },
      {
        nome: 'João Santos',
        email: 'joao.santos@escola.pt',
        password: hashedPassword,
        tipo: 'Funcionário',
        data_registo: '10/09/2025'
      },
      {
        nome: 'Admin Sistema',
        email: 'admin@booktrack.pt',
        password: hashedPassword,
        tipo: 'Admin',
        data_registo: '01/01/2025'
      }
    ];

    console.log('📝 A inserir utilizadores...');
    for (const user of utilizadores) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO utilizadores (nome, email, password, tipo, data_registo) VALUES (?, ?, ?, ?, ?)`,
          [user.nome, user.email, user.password, user.tipo, user.data_registo],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    console.log('✅ Utilizadores inseridos');

    // Inserir livros de exemplo
    const livros = [
      {
        titulo: 'Os Lusíadas',
        autor: 'Luís de Camões',
        isbn: '978-9722034364',
        publicacao: '1572',
        categoria: 'Poesia Épica',
        descricao: 'Epopeia que narra os feitos dos navegadores portugueses, principalmente Vasco da Gama na descoberta do caminho marítimo para a Índia.',
        disponivel: 1,
        quantidade_total: 3,
        quantidade_disponivel: 2
      },
      {
        titulo: 'Memorial do Convento',
        autor: 'José Saramago',
        isbn: '978-9722019521',
        publicacao: '1982',
        categoria: 'Romance Histórico',
        descricao: 'Romance histórico sobre a construção do Convento de Mafra no século XVIII, entrelaçando as vidas de Baltasar e Blimunda.',
        disponivel: 1,
        quantidade_total: 2,
        quantidade_disponivel: 1
      },
      {
        titulo: 'Mensagem',
        autor: 'Fernando Pessoa',
        isbn: '978-9722520447',
        publicacao: '1934',
        categoria: 'Poesia',
        descricao: 'Obra poética sobre a história e o destino de Portugal, dividida em três partes: Brasão, Mar Português e O Encoberto.',
        disponivel: 0,
        quantidade_total: 2,
        quantidade_disponivel: 0
      },
      {
        titulo: 'A Cidade e as Serras',
        autor: 'Eça de Queirós',
        isbn: '978-9722019828',
        publicacao: '1901',
        categoria: 'Romance',
        descricao: 'Romance que contrasta a vida na cidade de Paris com a vida rural nas serras portuguesas, através da personagem Jacinto.',
        disponivel: 1,
        quantidade_total: 3,
        quantidade_disponivel: 3
      },
      {
        titulo: 'O Crime do Padre Amaro',
        autor: 'Eça de Queirós',
        isbn: '978-9722019835',
        publicacao: '1875',
        categoria: 'Romance Realista',
        descricao: 'Romance realista que retrata a hipocrisia e corrupção do clero numa pequena cidade portuguesa.',
        disponivel: 1,
        quantidade_total: 2,
        quantidade_disponivel: 2
      },
      {
        titulo: 'O Primo Basílio',
        autor: 'Eça de Queirós',
        isbn: '978-9722034371',
        publicacao: '1878',
        categoria: 'Romance Realista',
        descricao: 'Romance que aborda o adultério e a sociedade burguesa lisboeta do século XIX.',
        disponivel: 1,
        quantidade_total: 2,
        quantidade_disponivel: 2
      },
      {
        titulo: 'Ensaio sobre a Cegueira',
        autor: 'José Saramago',
        isbn: '978-9722019545',
        publicacao: '1995',
        categoria: 'Romance',
        descricao: 'Parábola sobre a natureza humana e a sociedade, onde uma epidemia de cegueira branca atinge uma cidade.',
        disponivel: 1,
        quantidade_total: 3,
        quantidade_disponivel: 3
      },
      {
        titulo: 'O Ano da Morte de Ricardo Reis',
        autor: 'José Saramago',
        isbn: '978-9722019552',
        publicacao: '1984',
        categoria: 'Romance',
        descricao: 'Romance que explora a vida de Ricardo Reis, um dos heterónimos de Fernando Pessoa, em Lisboa de 1935-1936.',
        disponivel: 1,
        quantidade_total: 2,
        quantidade_disponivel: 2
      }
    ];

    console.log('📚 A inserir livros...');
    for (const livro of livros) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO livros (titulo, autor, isbn, publicacao, categoria, descricao, disponivel, quantidade_total, quantidade_disponivel) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [livro.titulo, livro.autor, livro.isbn, livro.publicacao, livro.categoria, livro.descricao, livro.disponivel, livro.quantidade_total, livro.quantidade_disponivel],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    console.log('✅ Livros inseridos');

    // Inserir reservas de exemplo
    const reservas = [
      {
        utilizador_id: 1,
        livro_id: 1,
        data_reserva: '10/11/2025',
        data_expiracao: '17/11/2025',
        status: 'ativa'
      },
      {
        utilizador_id: 1,
        livro_id: 2,
        data_reserva: '12/11/2025',
        data_expiracao: '19/11/2025',
        status: 'ativa'
      }
    ];

    console.log('📋 A inserir reservas...');
    for (const reserva of reservas) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO reservas (utilizador_id, livro_id, data_reserva, data_expiracao, status) 
           VALUES (?, ?, ?, ?, ?)`,
          [reserva.utilizador_id, reserva.livro_id, reserva.data_reserva, reserva.data_expiracao, reserva.status],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    console.log('✅ Reservas inseridas');

    // Inserir histórico de empréstimos
    const emprestimos = [
      {
        utilizador_id: 1,
        livro_id: 3,
        data_emprestimo: '01/10/2025',
        data_devolucao_prevista: '15/10/2025',
        data_devolucao_real: '15/10/2025',
        status: 'devolvido'
      },
      {
        utilizador_id: 1,
        livro_id: 4,
        data_emprestimo: '20/09/2025',
        data_devolucao_prevista: '04/10/2025',
        data_devolucao_real: '04/10/2025',
        status: 'devolvido'
      }
    ];

    console.log('📖 A inserir empréstimos...');
    for (const emprestimo of emprestimos) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO emprestimos (utilizador_id, livro_id, data_emprestimo, data_devolucao_prevista, data_devolucao_real, status) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [emprestimo.utilizador_id, emprestimo.livro_id, emprestimo.data_emprestimo, emprestimo.data_devolucao_prevista, emprestimo.data_devolucao_real, emprestimo.status],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    console.log('✅ Empréstimos inseridos');

    console.log('\n🎉 Base de dados populada com sucesso!');
    console.log('\n📌 Credenciais de teste:');
    console.log('   Email: josesaramago@gmail.com');
    console.log('   Password: 123456\n');
    console.log('   Email: admin@booktrack.pt');
    console.log('   Password: 123456\n');

    db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao popular base de dados:', error);
    db.close();
    process.exit(1);
  }
};

seedDatabase();
