const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { auth } = require('../middleware/auth');

// @route   GET /api/reservas
// @desc    Obter todas as reservas (admin) ou do utilizador autenticado
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let sql = `
      SELECT r.*, 
             l.titulo as livro_titulo, 
             l.autor as livro_autor,
             u.nome as utilizador_nome, 
             u.email as utilizador_email
      FROM reservas r
      JOIN livros l ON r.livro_id = l.id
      JOIN utilizadores u ON r.utilizador_id = u.id
    `;
    
    const params = [];
    
    // Se não for administrador, mostrar apenas as suas reservas
    if (req.user.tipo !== 'Administrador') {
      sql += ' WHERE r.utilizador_id = ?';
      params.push(req.user.id);
    }
    
    sql += ' ORDER BY r.criado_em DESC';
    
    const [reservas] = await pool.query(sql, params);
    
    res.json({
      success: true,
      count: reservas.length,
      data: reservas
    });
  } catch (error) {
    console.error('Erro ao obter reservas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter reservas'
    });
  }
});

// @route   GET /api/reservas/:id
// @desc    Obter reserva por ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const [reservas] = await pool.query(`
      SELECT r.*, 
             l.titulo as livro_titulo, 
             l.autor as livro_autor,
             u.nome as utilizador_nome, 
             u.email as utilizador_email
      FROM reservas r
      JOIN livros l ON r.id_livro = l.id_livro
      JOIN utilizadores u ON r.id_utilizador = u.id_utilizador
      WHERE r.id_reserva = ?
    `, [req.params.id]);
    
    if (reservas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada'
      });
    }
    
    const reserva = reservas[0];
    
    // Verificar permissões
    if (req.user.tipo !== 'Administrador' && reserva.utilizador_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não tem permissão para aceder a esta reserva'
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
      message: 'Erro ao obter reserva'
    });
  }
});

// @route   POST /api/reservas
// @desc    Criar nova reserva
// @access  Private
router.post('/', [
  auth,
  body('livro_id').isInt({ min: 1 }).withMessage('ID do livro inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { livro_id } = req.body;
    const utilizador_id = req.user.id;

    // Verificar se o livro existe
    const [livros] = await pool.query('SELECT * FROM livros WHERE id = ?', [livro_id]);
    if (livros.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Livro não encontrado'
      });
    }

    const livro = livros[0];

    // Verificar se o utilizador já tem uma reserva ativa para este livro
    const [existingReservation] = await pool.query(
      'SELECT id FROM reservas WHERE utilizador_id = ? AND livro_id = ? AND estado = "ativa"',
      [utilizador_id, livro_id]
    );

    if (existingReservation.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Já tem uma reserva ativa para este livro'
      });
    }

    // Verificar se o utilizador já tem um empréstimo ativo para este livro
    const [existingLoan] = await pool.query(
      'SELECT id FROM emprestimos WHERE utilizador_id = ? AND livro_id = ? AND estado = "ativo"',
      [utilizador_id, livro_id]
    );

    if (existingLoan.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Já tem um empréstimo ativo para este livro'
      });
    }

    // Calcular data de expiração (7 dias a partir de hoje)
    const dataExpiracao = new Date();
    dataExpiracao.setDate(dataExpiracao.getDate() + 7);

    // Criar reserva
    const [result] = await pool.query(
      'INSERT INTO reservas (utilizador_id, livro_id, data_expiracao) VALUES (?, ?, ?)',
      [utilizador_id, livro_id, dataExpiracao.toISOString().split('T')[0]]
    );

    // Obter a reserva criada
    const [newReservation] = await pool.query(`
      SELECT r.*, 
             l.titulo as livro_titulo, 
             l.autor as livro_autor,
             u.nome as utilizador_nome, 
             u.email as utilizador_email
      FROM reservas r
      JOIN livros l ON r.livro_id = l.id
      JOIN utilizadores u ON r.utilizador_id = u.id
      WHERE r.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Reserva criada com sucesso',
      data: newReservation[0]
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
    const [existingReservation] = await pool.query('SELECT * FROM reservas WHERE id = ?', [req.params.id]);
    if (existingReservation.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada'
      });
    }

    const reserva = existingReservation[0];

    // Verificar permissões
    if (req.user.tipo !== 'Administrador' && reserva.utilizador_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não tem permissão para cancelar esta reserva'
      });
    }

    // Verificar se a reserva já foi cancelada ou concluída
    if (reserva.estado !== 'ativa') {
      return res.status(400).json({
        success: false,
        message: `Esta reserva já foi ${reserva.estado === 'cancelada' ? 'cancelada' : 'concluída'}`
      });
    }

    // Cancelar reserva
    await pool.query(
      'UPDATE reservas SET estado = "cancelada", atualizado_em = CURRENT_TIMESTAMP WHERE id = ?',
      [req.params.id]
    );

    // Obter reserva atualizada
    const [updatedReservation] = await pool.query(`
      SELECT r.*, 
             l.titulo as livro_titulo, 
             l.autor as livro_autor,
             u.nome as utilizador_nome, 
             u.email as utilizador_email
      FROM reservas r
      JOIN livros l ON r.livro_id = l.id
      JOIN utilizadores u ON r.utilizador_id = u.id
      WHERE r.id = ?
    `, [req.params.id]);

    res.json({
      success: true,
      message: 'Reserva cancelada com sucesso',
      data: updatedReservation[0]
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