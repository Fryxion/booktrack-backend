const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');

// @route   GET /api/emprestimos
// @desc    Listar empréstimos
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = `
      SELECT e.*, 
             l.titulo, l.autor,
             u.nome as nome_utilizador, u.email,
             l.isbn as isbn_livro
      FROM emprestimos e
      JOIN livros l ON e.id_livro = l.id_livro
      JOIN utilizadores u ON e.id_utilizador = u.id_utilizador
      WHERE 1=1
    `;
    const params = [];

    // Se não for bibliotecário, mostrar apenas os seus empréstimos
    if (req.user.tipo !== 'bibliotecario') {
      query += ' AND e.id_utilizador = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY e.data_emprestimo DESC';

    const [emprestimos] = await pool.query(query, params);

    res.json({
      success: true,
      count: emprestimos.length,
      data: emprestimos
    });
  } catch (error) {
    console.error('Erro ao listar empréstimos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar empréstimos'
    });
  }
});

// @route   GET /api/emprestimos/:id
// @desc    Obter detalhes de um empréstimo específico
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const [emprestimos] = await pool.query(
      `SELECT e.*, 
              l.titulo, l.autor, l.isbn as isbn_livro, l.categoria as categoria_livro,
              u.nome as nome_utilizador, u.email
       FROM emprestimos e
       JOIN livros l ON e.id_livro = l.id_livro
       JOIN utilizadores u ON e.id_utilizador = u.id_utilizador
       WHERE e.id_emprestimo = ?`,
      [req.params.id]
    );

    if (emprestimos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empréstimo não encontrado'
      });
    }

    const emprestimo = emprestimos[0];

    // Verificar permissões
    if (req.user.tipo !== 'bibliotecario' && emprestimo.id_utilizador !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    res.json({
      success: true,
      data: emprestimo
    });
  } catch (error) {
    console.error('Erro ao obter empréstimo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter detalhes do empréstimo'
    });
  }
});

// @route   POST /api/emprestimos
// @desc    Criar novo empréstimo
// @access  Private (Bibliotecário apenas)
router.post('/', auth, checkRole(['bibliotecario']), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id_utilizador, id_livro } = req.body;

    if (!id_utilizador || !id_livro) {
      return res.status(400).json({
        success: false,
        message: 'ID do utilizador e do livro são obrigatórios'
      });
    }

    await connection.beginTransaction();

    // Verificar se livro existe e está disponível
    const [livros] = await connection.query(
      'SELECT * FROM livros WHERE id_livro = ?',
      [id_livro]
    );

    if (livros.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Livro não encontrado'
      });
    }

    const livro = livros[0];

    if (livro.copias_disponiveis < 1) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Não há cópias disponíveis deste livro'
      });
    }

    // Verificar se utilizador já tem este livro emprestado
    const [emprestimoExistente] = await connection.query(
      'SELECT id_emprestimo FROM emprestimos WHERE id_utilizador = ? AND id_livro = ? AND data_publicacao = ?',
      [id_utilizador, id_livro, 'ativo']
    );

    if (emprestimoExistente.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Utilizador já tem este livro emprestado'
      });
    }

    // Calcular data de devolução prevista (14 dias)
    const dataDevolucao = new Date();
    dataDevolucao.setDate(dataDevolucao.getDate() + 14);

    // Criar empréstimo
    const [result] = await connection.query(
      `INSERT INTO emprestimos (id_utilizador, id_livro, isbn, categoria, descricao, data_devolucao_prevista, data_publicacao, total_copias)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_utilizador, id_livro, livro.isbn, livro.categoria, livro.descricao, dataDevolucao, 'ativo', 0.00]
    );

    // Atualizar cópias disponíveis
    await connection.query(
      'UPDATE livros SET copias_disponiveis = copias_disponiveis - 1 WHERE id_livro = ?',
      [id_livro]
    );

    // Cancelar reservas do utilizador para este livro
    await connection.query(
      'UPDATE reservas SET estado = ? WHERE id_utilizador = ? AND id_livro = ? AND estado = ?',
      ['cancelada', id_utilizador, id_livro, 'pendente']
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Empréstimo criado com sucesso',
      data: {
        id_emprestimo: result.insertId,
        id_utilizador,
        id_livro,
        data_devolucao_prevista: dataDevolucao,
        estado: 'ativo'
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao criar empréstimo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar empréstimo'
    });
  } finally {
    connection.release();
  }
});

// @route   PUT /api/emprestimos/:id/devolver
// @desc    Devolver livro emprestado
// @access  Private (Bibliotecário apenas)
router.put('/:id/devolver', auth, checkRole(['bibliotecario']), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Verificar se empréstimo existe e está ativo
    const [emprestimos] = await connection.query(
      'SELECT * FROM emprestimos WHERE id_emprestimo = ?',
      [req.params.id]
    );

    if (emprestimos.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Empréstimo não encontrado'
      });
    }

    const emprestimo = emprestimos[0];

    // ATENÇÃO: "data_publicacao" é o ESTADO
    if (emprestimo.estado !== 'ativo') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Este empréstimo já foi devolvido'
      });
    }

    // Calcular multa se houver atraso
    const dataAtual = new Date();
    const dataDevPrevista = new Date(emprestimo.data_devolucao_prevista);
    let multa = 0;

    if (dataAtual > dataDevPrevista) {
      const diasAtraso = Math.ceil((dataAtual - dataDevPrevista) / (1000 * 60 * 60 * 24));
      multa = diasAtraso * 0.50; // 0.50€ por dia de atraso
    }

    // Atualizar empréstimo - ATENÇÃO: "data_publicacao" é o ESTADO e "total_copias" é a MULTA
    await connection.query(
      'UPDATE emprestimos SET estado = ?, multa = ?, data_devolucao_efetiva = now() WHERE id_emprestimo = ?',
      ['devolvido', multa, req.params.id]
    );

    // Atualizar cópias disponíveis
    await connection.query(
      'UPDATE livros SET copias_disponiveis = copias_disponiveis + 1 WHERE id_livro = ?',
      [emprestimo.id_livro]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Livro devolvido com sucesso',
      data: {
        multa: multa > 0 ? multa : 0
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao devolver livro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao devolver livro'
    });
  } finally {
    connection.release();
  }
});

module.exports = router;