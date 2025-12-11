const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, isStaff } = require('../middleware/auth');

// Função auxiliar para executar queries
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const queryRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Função auxiliar para calcular data de expiração (7 dias)
const calcularDataExpiracao = () => {
  const data = new Date();
  data.setDate(data.getDate() + 7);
  return data.toLocaleDateString('pt-PT');
};

// @route   GET /api/reservas
// @desc    Listar reservas (todas para staff, apenas do utilizador para outros)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let sql;
    let params;

    if (req.user.tipo === 'Admin' || req.user.tipo === 'Funcionário') {
      // Staff pode ver todas as reservas
      sql = `
        SELECT r.*, 
               u.nome as utilizador_nome, 
               u.email as utilizador_email,
               l.titulo as livro_titulo,
               l.autor as livro_autor
        FROM reservas r
        JOIN utilizadores u ON r.utilizador_id = u.id
        JOIN livros l ON r.livro_id = l.id
        ORDER BY r.criado_em DESC
      `;
      params = [];
    } else {
      // Utilizadores normais veem apenas suas reservas
      sql = `
        SELECT r.*,
               l.titulo as livro_titulo,
               l.autor as livro_autor
        FROM reservas r
        JOIN livros l ON r.livro_id = l.id
        WHERE r.utilizador_id = ?
        ORDER BY r.criado_em DESC
      `;
      params = [req.user.id];
    }

    const reservas = await query(sql, params);

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

// @route   GET /api/reservas/minhas
// @desc    Listar reservas ativas do utilizador atual
// @access  Private
router.get('/minhas', auth, async (req, res) => {
  try {
    const reservas = await query(`
      SELECT r.*,
             l.titulo as livro_titulo,
             l.autor as livro_autor,
             l.categoria as livro_categoria
      FROM reservas r
      JOIN livros l ON r.livro_id = l.id
      WHERE r.utilizador_id = ? AND r.status = 'ativa'
      ORDER BY r.data_expiracao ASC
    `, [req.user.id]);

    res.json({
      success: true,
      count: reservas.length,
      data: reservas
    });
  } catch (error) {
    console.error('Erro ao listar reservas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar suas reservas'
    });
  }
});

// @route   GET /api/reservas/:id
// @desc    Obter detalhes de uma reserva
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const reservas = await query(`
      SELECT r.*,
             u.nome as utilizador_nome,
             u.email as utilizador_email,
             l.titulo as livro_titulo,
             l.autor as livro_autor
      FROM reservas r
      JOIN utilizadores u ON r.utilizador_id = u.id
      JOIN livros l ON r.livro_id = l.id
      WHERE r.id = ?
    `, [req.params.id]);

    if (reservas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada'
      });
    }

    const reserva = reservas[0];

    // Verificar se o utilizador tem permissão para ver esta reserva
    if (req.user.tipo !== 'Admin' && req.user.tipo !== 'Funcionário' && reserva.utilizador_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não tem permissão para ver esta reserva'
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
router.post('/', auth, [
  body('livro_id').isInt().withMessage('ID do livro é obrigatório')
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

    // Verificar se o livro existe e está disponível
    const livros = await query('SELECT * FROM livros WHERE id = ?', [livro_id]);
    if (livros.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Livro não encontrado'
      });
    }

    const livro = livros[0];
    if (livro.quantidade_disponivel <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Livro não disponível para reserva'
      });
    }

    // Verificar se o utilizador já tem uma reserva ativa para este livro
    const reservaExistente = await query(
      'SELECT id FROM reservas WHERE utilizador_id = ? AND livro_id = ? AND status = ?',
      [utilizador_id, livro_id, 'ativa']
    );

    if (reservaExistente.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Já tem uma reserva ativa para este livro'
      });
    }

    // Verificar se o utilizador tem empréstimo ativo deste livro
    const emprestimoAtivo = await query(
      'SELECT id FROM emprestimos WHERE utilizador_id = ? AND livro_id = ? AND status = ?',
      [utilizador_id, livro_id, 'ativo']
    );

    if (emprestimoAtivo.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Já tem um empréstimo ativo deste livro'
      });
    }

    // Criar reserva
    const dataReserva = new Date().toLocaleDateString('pt-PT');
    const dataExpiracao = calcularDataExpiracao();

    const result = await queryRun(
      'INSERT INTO reservas (utilizador_id, livro_id, data_reserva, data_expiracao, status) VALUES (?, ?, ?, ?, ?)',
      [utilizador_id, livro_id, dataReserva, dataExpiracao, 'ativa']
    );

    // Atualizar quantidade disponível do livro
    await queryRun(
      'UPDATE livros SET quantidade_disponivel = quantidade_disponivel - 1, disponivel = CASE WHEN quantidade_disponivel - 1 > 0 THEN 1 ELSE 0 END, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?',
      [livro_id]
    );

    const novaReserva = await query(`
      SELECT r.*,
             l.titulo as livro_titulo,
             l.autor as livro_autor
      FROM reservas r
      JOIN livros l ON r.livro_id = l.id
      WHERE r.id = ?
    `, [result.id]);

    res.status(201).json({
      success: true,
      message: 'Reserva criada com sucesso',
      data: novaReserva[0]
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
    const { id } = req.params;

    // Obter reserva
    const reservas = await query('SELECT * FROM reservas WHERE id = ?', [id]);
    if (reservas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada'
      });
    }

    const reserva = reservas[0];

    // Verificar permissões
    if (req.user.tipo !== 'Admin' && req.user.tipo !== 'Funcionário' && reserva.utilizador_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não tem permissão para cancelar esta reserva'
      });
    }

    // Verificar se a reserva está ativa
    if (reserva.status !== 'ativa') {
      return res.status(400).json({
        success: false,
        message: 'Esta reserva já não está ativa'
      });
    }

    // Cancelar reserva
    await queryRun(
      'UPDATE reservas SET status = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?',
      ['cancelada', id]
    );

    // Devolver disponibilidade ao livro
    await queryRun(
      'UPDATE livros SET quantidade_disponivel = quantidade_disponivel + 1, disponivel = 1, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?',
      [reserva.livro_id]
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

// @route   PUT /api/reservas/:id/completar
// @desc    Marcar reserva como completada (quando livro é levantado)
// @access  Private (Staff)
router.put('/:id/completar', [auth, isStaff], async (req, res) => {
  try {
    const { id } = req.params;

    // Obter reserva
    const reservas = await query('SELECT * FROM reservas WHERE id = ?', [id]);
    if (reservas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada'
      });
    }

    const reserva = reservas[0];

    if (reserva.status !== 'ativa') {
      return res.status(400).json({
        success: false,
        message: 'Esta reserva não está ativa'
      });
    }

    // Completar reserva
    await queryRun(
      'UPDATE reservas SET status = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?',
      ['completada', id]
    );

    res.json({
      success: true,
      message: 'Reserva completada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao completar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao completar reserva'
    });
  }
});

module.exports = router;
