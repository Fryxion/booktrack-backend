const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');

// @route   GET /api/reservas
// @desc    Listar reservas
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = `
      SELECT r.*, 
             l.titulo, l.autor, l.isbn,
             u.nome as nome_utilizador, u.email
      FROM reservas r
      JOIN livros l ON r.id_livro = l.id_livro
      JOIN utilizadores u ON r.id_utilizador = u.id_utilizador
      WHERE 1=1
    `;
    const params = [];

    // Se não for bibliotecário, mostrar apenas as suas reservas
    if (req.user.tipo !== 'bibliotecario') {
      query += ' AND r.id_utilizador = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY r.data_reserva DESC';

    const [reservas] = await pool.query(query, params);

    res.json({
      success: true,
      count: reservas.length,
      data: reservas
    });
  } catch (error) {
    console.error('Erro ao listar reservas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar reservas'
    });
  }
});

// @route   GET /api/reservas/:id
// @desc    Obter detalhes de uma reserva específica
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const [reservas] = await pool.query(
      `SELECT r.*, 
              l.titulo, l.autor, l.isbn, l.categoria,
              u.nome as nome_utilizador, u.email
       FROM reservas r
       JOIN livros l ON r.id_livro = l.id_livro
       JOIN utilizadores u ON r.id_utilizador = u.id_utilizador
       WHERE r.id_reserva = ?`,
      [req.params.id]
    );

    if (reservas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada'
      });
    }

    const reserva = reservas[0];

    // Verificar permissões (apenas o próprio utilizador ou bibliotecário pode ver)
    if (req.user.tipo !== 'bibliotecario' && reserva.id_utilizador !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    res.json({
      success: true,
      data: reserva
    });
  } catch (error) {
    console.error('Erro ao obter reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter detalhes da reserva'
    });
  }
});

// @route   POST /api/reservas
// @desc    Criar nova reserva
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { id_livro } = req.body;

    if (!id_livro) {
      return res.status(400).json({
        success: false,
        message: 'ID do livro é obrigatório'
      });
    }

    // Verificar se livro existe
    const [livros] = await pool.query(
      'SELECT * FROM livros WHERE id_livro = ?',
      [id_livro]
    );

    if (livros.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Livro não encontrado'
      });
    }

    const livro = livros[0];

    // Verificar se utilizador já tem uma reserva ativa deste livro
    const [reservaExistente] = await pool.query(
      'SELECT id_reserva FROM reservas WHERE id_utilizador = ? AND id_livro = ? AND estado IN (?, ?)',
      [req.user.id, id_livro, 'pendente', 'confirmada']
    );

    if (reservaExistente.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Já tem uma reserva ativa deste livro'
      });
    }

    // Verificar se utilizador já tem este livro emprestado
    const [emprestimoAtivo] = await pool.query(
      'SELECT id_emprestimo FROM emprestimos WHERE id_utilizador = ? AND id_livro = ? AND data_publicacao = ?',
      [req.user.id, id_livro, 'ativo']
    );

    if (emprestimoAtivo.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Já tem este livro emprestado'
      });
    }

    // Calcular data de expiração (7 dias a partir de hoje)
    const dataExpiracao = new Date();
    dataExpiracao.setDate(dataExpiracao.getDate() + 7);

    // Calcular posição na fila
    const [reservasExistentes] = await pool.query(
      'SELECT COUNT(*) as total FROM reservas WHERE id_livro = ? AND estado = ?',
      [id_livro, 'pendente']
    );
    const posicaoFila = reservasExistentes[0].total + 1;

    // Criar reserva
    const [result] = await pool.query(
      `INSERT INTO reservas (id_utilizador, id_livro, data_expiracao, estado, posicao_fila)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, id_livro, dataExpiracao, 'pendente', posicaoFila]
    );

    res.status(201).json({
      success: true,
      message: 'Reserva criada com sucesso',
      data: {
        id_reserva: result.insertId,
        id_utilizador: req.user.id,
        id_livro,
        data_expiracao: dataExpiracao,
        estado: 'pendente',
        posicao_fila: posicaoFila
      }
    });
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar reserva'
    });
  }
});

// @route   PUT /api/reservas/:id/cancelar
// @desc    Cancelar reserva
// @access  Private
router.put('/:id/cancelar', auth, async (req, res) => {
  try {
    // Verificar se reserva existe
    const [reservas] = await pool.query(
      'SELECT * FROM reservas WHERE id_reserva = ?',
      [req.params.id]
    );

    if (reservas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada'
      });
    }

    const reserva = reservas[0];

    // Verificar permissões (apenas o próprio utilizador ou bibliotecário pode cancelar)
    if (req.user.tipo !== 'bibliotecario' && reserva.id_utilizador !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    // Verificar se reserva já foi cancelada ou está expirada
    if (reserva.estado === 'cancelada' || reserva.estado === 'expirada') {
      return res.status(400).json({
        success: false,
        message: 'Esta reserva já foi cancelada ou expirou'
      });
    }

    // Cancelar reserva
    await pool.query(
      'UPDATE reservas SET estado = ? WHERE id_reserva = ?',
      ['cancelada', req.params.id]
    );

    res.json({
      success: true,
      message: 'Reserva cancelada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao cancelar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao cancelar reserva'
    });
  }
});

module.exports = router;