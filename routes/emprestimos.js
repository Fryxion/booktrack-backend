const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, isStaff } = require('../middleware/auth');

// @route   GET /api/emprestimos
router.get('/', auth, async (req, res) => {
  try {
    let sql, params;

    if (req.user.tipo === 'bibliotecario') {
      sql = `SELECT e.*, u.nome as utilizador_nome, u.email as utilizador_email,
             l.titulo as livro_titulo, l.autor as livro_autor
             FROM emprestimos e
             JOIN utilizadores u ON e.id_utilizador = u.id_utilizador
             JOIN livros l ON e.id_livro = l.id_livro
             ORDER BY e.data_emprestimo DESC`;
      params = [];
    } else {
      sql = `SELECT e.*, l.titulo as livro_titulo, l.autor as livro_autor
             FROM emprestimos e
             JOIN livros l ON e.id_livro = l.id_livro
             WHERE e.id_utilizador = ?
             ORDER BY e.data_emprestimo DESC`;
      params = [req.user.id];
    }

    const [emprestimos] = await db.query(sql, params);
    res.json({ success: true, count: emprestimos.length, data: emprestimos });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar empréstimos' });
  }
});

// @route   GET /api/emprestimos/ativos
router.get('/ativos', auth, async (req, res) => {
  try {
    const [emprestimos] = await db.query(`
      SELECT e.*, l.titulo as livro_titulo, l.autor as livro_autor, l.categoria as livro_categoria
      FROM emprestimos e
      JOIN livros l ON e.id_livro = l.id_livro
      WHERE e.id_utilizador = ? AND e.estado = 'ativo'
      ORDER BY e.data_devolucao_prevista ASC
    `, [req.user.id]);

    res.json({ success: true, count: emprestimos.length, data: emprestimos });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar empréstimos' });
  }
});

// @route   GET /api/emprestimos/historico
router.get('/historico', auth, async (req, res) => {
  try {
    const [emprestimos] = await db.query(`
      SELECT e.*, l.titulo as livro_titulo, l.autor as livro_autor
      FROM emprestimos e
      JOIN livros l ON e.id_livro = l.id_livro
      WHERE e.id_utilizador = ? AND e.estado = 'devolvido'
      ORDER BY e.data_emprestimo DESC
    `, [req.user.id]);

    res.json({ success: true, count: emprestimos.length, data: emprestimos });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ success: false, message: 'Erro ao obter histórico' });
  }
});

// @route   POST /api/emprestimos
router.post('/', [auth, isStaff], [
  body('id_utilizador').isInt(),
  body('id_livro').isInt(),
  body('dias').optional().isInt({ min: 1, max: 30 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id_utilizador, id_livro, dias = 14 } = req.body;

    const [utilizadores] = await db.query('SELECT id_utilizador FROM utilizadores WHERE id_utilizador = ?', [id_utilizador]);
    if (utilizadores.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilizador não encontrado' });
    }

    const [livros] = await db.query('SELECT * FROM livros WHERE id_livro = ?', [id_livro]);
    if (livros.length === 0) {
      return res.status(404).json({ success: false, message: 'Livro não encontrado' });
    }

    const livro = livros[0];
    if (livro.copias_disponiveis <= 0) {
      return res.status(400).json({ success: false, message: 'Livro não disponível' });
    }

    const [emprestimoExistente] = await db.query(
      'SELECT id_emprestimo FROM emprestimos WHERE id_utilizador = ? AND id_livro = ? AND estado = ?',
      [id_utilizador, id_livro, 'ativo']
    );

    if (emprestimoExistente.length > 0) {
      return res.status(400).json({ success: false, message: 'Empréstimo ativo já existe' });
    }

    const dataEmprestimo = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const dataDevolucao = new Date();
    dataDevolucao.setDate(dataDevolucao.getDate() + dias);
    const dataDevolucaoPrevista = dataDevolucao.toISOString().slice(0, 19).replace('T', ' ');

    const [result] = await db.query(
      'INSERT INTO emprestimos (id_utilizador, id_livro, isbn, categoria, descricao, data_emprestimo, data_devolucao_prevista, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id_utilizador, id_livro, livro.isbn, livro.categoria, livro.descricao, dataEmprestimo, dataDevolucaoPrevista, 'ativo']
    );

    await db.query('UPDATE livros SET copias_disponiveis = copias_disponiveis - 1 WHERE id_livro = ?', [id_livro]);
    await db.query('UPDATE reservas SET estado = ? WHERE id_utilizador = ? AND id_livro = ? AND estado = ?',
      ['confirmada', id_utilizador, id_livro, 'pendente']
    );

    const [novoEmprestimo] = await db.query(`
      SELECT e.*, u.nome as utilizador_nome, u.email as utilizador_email,
             l.titulo as livro_titulo, l.autor as livro_autor
      FROM emprestimos e
      JOIN utilizadores u ON e.id_utilizador = u.id_utilizador
      JOIN livros l ON e.id_livro = l.id_livro
      WHERE e.id_emprestimo = ?
    `, [result.insertId]);

    res.status(201).json({ success: true, message: 'Empréstimo criado com sucesso', data: novoEmprestimo[0] });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar empréstimo' });
  }
});

// @route   PUT /api/emprestimos/:id/devolver
router.put('/:id/devolver', [auth, isStaff], async (req, res) => {
  try {
    const { id } = req.params;

    const [emprestimos] = await db.query('SELECT * FROM emprestimos WHERE id_emprestimo = ?', [id]);
    if (emprestimos.length === 0) {
      return res.status(404).json({ success: false, message: 'Empréstimo não encontrado' });
    }

    const emprestimo = emprestimos[0];

    if (emprestimo.estado !== 'ativo' && emprestimo.estado !== 'atrasado') {
      return res.status(400).json({ success: false, message: 'Empréstimo já foi devolvido' });
    }

    await db.query('UPDATE emprestimos SET estado = ? WHERE id_emprestimo = ?', ['devolvido', id]);
    await db.query('UPDATE livros SET copias_disponiveis = copias_disponiveis + 1 WHERE id_livro = ?', [emprestimo.id_livro]);

    res.json({ success: true, message: 'Devolução registada com sucesso' });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ success: false, message: 'Erro ao registar devolução' });
  }
});

// @route   PUT /api/emprestimos/:id/renovar
router.put('/:id/renovar', auth, [
  body('dias').optional().isInt({ min: 1, max: 14 })
], async (req, res) => {
  try {
    const { id } = req.params;
    const { dias = 14 } = req.body;

    const [emprestimos] = await db.query('SELECT * FROM emprestimos WHERE id_emprestimo = ?', [id]);
    if (emprestimos.length === 0) {
      return res.status(404).json({ success: false, message: 'Empréstimo não encontrado' });
    }

    const emprestimo = emprestimos[0];

    if (req.user.tipo !== 'bibliotecario' && emprestimo.id_utilizador !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Sem permissão' });
    }

    if (emprestimo.estado !== 'ativo') {
      return res.status(400).json({ success: false, message: 'Apenas empréstimos ativos podem ser renovados' });
    }

    const novaDataDevolucao = new Date();
    novaDataDevolucao.setDate(novaDataDevolucao.getDate() + dias);
    const dataDevolucaoPrevista = novaDataDevolucao.toISOString().slice(0, 19).replace('T', ' ');

    await db.query('UPDATE emprestimos SET data_devolucao_prevista = ? WHERE id_emprestimo = ?', [dataDevolucaoPrevista, id]);

    res.json({
      success: true,
      message: 'Empréstimo renovado com sucesso',
      data: { nova_data_devolucao: dataDevolucaoPrevista }
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ success: false, message: 'Erro ao renovar empréstimo' });
  }
});

module.exports = router;
