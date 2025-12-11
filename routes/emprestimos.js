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

// @route   GET /api/emprestimos
// @desc    Listar empréstimos (todos para staff, apenas do utilizador para outros)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let sql;
    let params;

    if (req.user.tipo === 'Admin' || req.user.tipo === 'Funcionário') {
      sql = `
        SELECT e.*,
               u.nome as utilizador_nome,
               u.email as utilizador_email,
               l.titulo as livro_titulo,
               l.autor as livro_autor
        FROM emprestimos e
        JOIN utilizadores u ON e.utilizador_id = u.id
        JOIN livros l ON e.livro_id = l.id
        ORDER BY e.criado_em DESC
      `;
      params = [];
    } else {
      sql = `
        SELECT e.*,
               l.titulo as livro_titulo,
               l.autor as livro_autor
        FROM emprestimos e
        JOIN livros l ON e.livro_id = l.id
        WHERE e.utilizador_id = ?
        ORDER BY e.criado_em DESC
      `;
      params = [req.user.id];
    }

    const emprestimos = await query(sql, params);

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

// @route   GET /api/emprestimos/ativos
// @desc    Listar empréstimos ativos do utilizador
// @access  Private
router.get('/ativos', auth, async (req, res) => {
  try {
    const emprestimos = await query(`
      SELECT e.*,
             l.titulo as livro_titulo,
             l.autor as livro_autor,
             l.categoria as livro_categoria
      FROM emprestimos e
      JOIN livros l ON e.livro_id = l.id
      WHERE e.utilizador_id = ? AND e.status = 'ativo'
      ORDER BY e.data_devolucao_prevista ASC
    `, [req.user.id]);

    res.json({
      success: true,
      count: emprestimos.length,
      data: emprestimos
    });
  } catch (error) {
    console.error('Erro ao listar empréstimos ativos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar empréstimos ativos'
    });
  }
});

// @route   GET /api/emprestimos/historico
// @desc    Obter histórico de empréstimos do utilizador
// @access  Private
router.get('/historico', auth, async (req, res) => {
  try {
    const emprestimos = await query(`
      SELECT e.*,
             l.titulo as livro_titulo,
             l.autor as livro_autor
      FROM emprestimos e
      JOIN livros l ON e.livro_id = l.id
      WHERE e.utilizador_id = ? AND e.status = 'devolvido'
      ORDER BY e.data_devolucao_real DESC
    `, [req.user.id]);

    res.json({
      success: true,
      count: emprestimos.length,
      data: emprestimos
    });
  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter histórico de empréstimos'
    });
  }
});

// @route   GET /api/emprestimos/:id
// @desc    Obter detalhes de um empréstimo
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const emprestimos = await query(`
      SELECT e.*,
             u.nome as utilizador_nome,
             u.email as utilizador_email,
             l.titulo as livro_titulo,
             l.autor as livro_autor
      FROM emprestimos e
      JOIN utilizadores u ON e.utilizador_id = u.id
      JOIN livros l ON e.livro_id = l.id
      WHERE e.id = ?
    `, [req.params.id]);

    if (emprestimos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empréstimo não encontrado'
      });
    }

    const emprestimo = emprestimos[0];

    // Verificar permissões
    if (req.user.tipo !== 'Admin' && req.user.tipo !== 'Funcionário' && emprestimo.utilizador_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não tem permissão para ver este empréstimo'
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
// @desc    Criar novo empréstimo (Staff)
// @access  Private (Staff)
router.post('/', [auth, isStaff], [
  body('utilizador_id').isInt().withMessage('ID do utilizador é obrigatório'),
  body('livro_id').isInt().withMessage('ID do livro é obrigatório'),
  body('dias').optional().isInt({ min: 1, max: 30 }).withMessage('Dias deve estar entre 1 e 30')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { utilizador_id, livro_id, dias = 14 } = req.body;

    // Verificar se utilizador existe
    const utilizadores = await query('SELECT id FROM utilizadores WHERE id = ?', [utilizador_id]);
    if (utilizadores.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    // Verificar se livro existe e está disponível
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
        message: 'Livro não disponível para empréstimo'
      });
    }

    // Verificar se utilizador já tem empréstimo ativo deste livro
    const emprestimoExistente = await query(
      'SELECT id FROM emprestimos WHERE utilizador_id = ? AND livro_id = ? AND status = ?',
      [utilizador_id, livro_id, 'ativo']
    );

    if (emprestimoExistente.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Este utilizador já tem um empréstimo ativo deste livro'
      });
    }

    // Criar empréstimo
    const dataEmprestimo = new Date().toLocaleDateString('pt-PT');
    const dataDevolucao = new Date();
    dataDevolucao.setDate(dataDevolucao.getDate() + dias);
    const dataDevolucaoPrevista = dataDevolucao.toLocaleDateString('pt-PT');

    const result = await queryRun(
      'INSERT INTO emprestimos (utilizador_id, livro_id, data_emprestimo, data_devolucao_prevista, status) VALUES (?, ?, ?, ?, ?)',
      [utilizador_id, livro_id, dataEmprestimo, dataDevolucaoPrevista, 'ativo']
    );

    // Atualizar quantidade disponível do livro
    await queryRun(
      'UPDATE livros SET quantidade_disponivel = quantidade_disponivel - 1, disponivel = CASE WHEN quantidade_disponivel - 1 > 0 THEN 1 ELSE 0 END, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?',
      [livro_id]
    );

    // Cancelar reserva se existir
    await queryRun(
      'UPDATE reservas SET status = ?, atualizado_em = CURRENT_TIMESTAMP WHERE utilizador_id = ? AND livro_id = ? AND status = ?',
      ['completada', utilizador_id, livro_id, 'ativa']
    );

    const novoEmprestimo = await query(`
      SELECT e.*,
             u.nome as utilizador_nome,
             u.email as utilizador_email,
             l.titulo as livro_titulo,
             l.autor as livro_autor
      FROM emprestimos e
      JOIN utilizadores u ON e.utilizador_id = u.id
      JOIN livros l ON e.livro_id = l.id
      WHERE e.id = ?
    `, [result.id]);

    res.status(201).json({
      success: true,
      message: 'Empréstimo criado com sucesso',
      data: novoEmprestimo[0]
    });
  } catch (error) {
    console.error('Erro ao criar empréstimo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar empréstimo'
    });
  }
});

// @route   PUT /api/emprestimos/:id/devolver
// @desc    Registar devolução de livro
// @access  Private (Staff)
router.put('/:id/devolver', [auth, isStaff], async (req, res) => {
  try {
    const { id } = req.params;

    // Obter empréstimo
    const emprestimos = await query('SELECT * FROM emprestimos WHERE id = ?', [id]);
    if (emprestimos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empréstimo não encontrado'
      });
    }

    const emprestimo = emprestimos[0];

    if (emprestimo.status !== 'ativo' && emprestimo.status !== 'atrasado') {
      return res.status(400).json({
        success: false,
        message: 'Este empréstimo já foi devolvido'
      });
    }

    // Registar devolução
    const dataDevolucaoReal = new Date().toLocaleDateString('pt-PT');

    await queryRun(
      'UPDATE emprestimos SET data_devolucao_real = ?, status = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?',
      [dataDevolucaoReal, 'devolvido', id]
    );

    // Devolver disponibilidade ao livro
    await queryRun(
      'UPDATE livros SET quantidade_disponivel = quantidade_disponivel + 1, disponivel = 1, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?',
      [emprestimo.livro_id]
    );

    res.json({
      success: true,
      message: 'Devolução registada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao registar devolução:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registar devolução'
    });
  }
});

// @route   PUT /api/emprestimos/:id/renovar
// @desc    Renovar empréstimo
// @access  Private
router.put('/:id/renovar', auth, [
  body('dias').optional().isInt({ min: 1, max: 14 }).withMessage('Dias deve estar entre 1 e 14')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { dias = 14 } = req.body;

    // Obter empréstimo
    const emprestimos = await query('SELECT * FROM emprestimos WHERE id = ?', [id]);
    if (emprestimos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empréstimo não encontrado'
      });
    }

    const emprestimo = emprestimos[0];

    // Verificar permissões
    if (req.user.tipo !== 'Admin' && req.user.tipo !== 'Funcionário' && emprestimo.utilizador_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não tem permissão para renovar este empréstimo'
      });
    }

    if (emprestimo.status !== 'ativo') {
      return res.status(400).json({
        success: false,
        message: 'Apenas empréstimos ativos podem ser renovados'
      });
    }

    // Calcular nova data de devolução
    const novaDataDevolucao = new Date();
    novaDataDevolucao.setDate(novaDataDevolucao.getDate() + dias);
    const dataDevolucaoPrevista = novaDataDevolucao.toLocaleDateString('pt-PT');

    await queryRun(
      'UPDATE emprestimos SET data_devolucao_prevista = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?',
      [dataDevolucaoPrevista, id]
    );

    res.json({
      success: true,
      message: 'Empréstimo renovado com sucesso',
      data: {
        nova_data_devolucao: dataDevolucaoPrevista
      }
    });
  } catch (error) {
    console.error('Erro ao renovar empréstimo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao renovar empréstimo'
    });
  }
});

module.exports = router;
