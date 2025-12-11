const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, isStaff } = require('../middleware/auth');

// @route   GET /api/livros
router.get('/', async (req, res) => {
  try {
    const { search, categoria } = req.query;
    let sql = 'SELECT * FROM livros WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (titulo LIKE ? OR autor LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (categoria) {
      sql += ' AND categoria = ?';
      params.push(categoria);
    }

    sql += ' ORDER BY titulo ASC';

    const [livros] = await db.query(sql, params);

    res.json({
      success: true,
      count: livros.length,
      data: livros
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar livros' });
  }
});

// @route   GET /api/livros/:id
router.get('/:id', async (req, res) => {
  try {
    const [livros] = await db.query('SELECT * FROM livros WHERE id_livro = ?', [req.params.id]);

    if (livros.length === 0) {
      return res.status(404).json({ success: false, message: 'Livro não encontrado' });
    }

    res.json({ success: true, data: livros[0] });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ success: false, message: 'Erro ao obter livro' });
  }
});

// @route   POST /api/livros
router.post('/', [auth, isStaff], [
  body('titulo').trim().notEmpty(),
  body('autor').trim().notEmpty(),
  body('isbn').trim().notEmpty(),
  body('categoria').trim().notEmpty(),
  body('total_copias').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { titulo, autor, isbn, categoria, descricao, data_publicacao, total_copias } = req.body;

    const [existing] = await db.query('SELECT id_livro FROM livros WHERE isbn = ?', [isbn]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'ISBN já existe' });
    }

    const [result] = await db.query(
      `INSERT INTO livros (titulo, autor, isbn, categoria, descricao, data_publicacao, total_copias, copias_disponiveis)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, autor, isbn, categoria, descricao, data_publicacao, total_copias, total_copias]
    );

    const [novoLivro] = await db.query('SELECT * FROM livros WHERE id_livro = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Livro criado com sucesso',
      data: novoLivro[0]
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar livro' });
  }
});

// @route   PUT /api/livros/:id
router.put('/:id', [auth, isStaff], async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, autor, isbn, categoria, descricao, data_publicacao, total_copias, copias_disponiveis } = req.body;

    const [livros] = await db.query('SELECT * FROM livros WHERE id_livro = ?', [id]);
    if (livros.length === 0) {
      return res.status(404).json({ success: false, message: 'Livro não encontrado' });
    }

    if (isbn) {
      const [existing] = await db.query('SELECT id_livro FROM livros WHERE isbn = ? AND id_livro != ?', [isbn, id]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'ISBN já existe' });
      }
    }

    await db.query(
      `UPDATE livros SET 
        titulo = COALESCE(?, titulo),
        autor = COALESCE(?, autor),
        isbn = COALESCE(?, isbn),
        categoria = COALESCE(?, categoria),
        descricao = COALESCE(?, descricao),
        data_publicacao = COALESCE(?, data_publicacao),
        total_copias = COALESCE(?, total_copias),
        copias_disponiveis = COALESCE(?, copias_disponiveis)
      WHERE id_livro = ?`,
      [titulo, autor, isbn, categoria, descricao, data_publicacao, total_copias, copias_disponiveis, id]
    );

    const [livroAtualizado] = await db.query('SELECT * FROM livros WHERE id_livro = ?', [id]);

    res.json({
      success: true,
      message: 'Livro atualizado com sucesso',
      data: livroAtualizado[0]
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar livro' });
  }
});

// @route   DELETE /api/livros/:id
router.delete('/:id', [auth, isStaff], async (req, res) => {
  try {
    const { id } = req.params;

    const [livros] = await db.query('SELECT * FROM livros WHERE id_livro = ?', [id]);
    if (livros.length === 0) {
      return res.status(404).json({ success: false, message: 'Livro não encontrado' });
    }

    const [reservasAtivas] = await db.query(
      'SELECT COUNT(*) as count FROM reservas WHERE id_livro = ? AND estado = ?',
      [id, 'pendente']
    );

    const [emprestimosAtivos] = await db.query(
      'SELECT COUNT(*) as count FROM emprestimos WHERE id_livro = ? AND estado = ?',
      [id, 'ativo']
    );

    if (reservasAtivas[0].count > 0 || emprestimosAtivos[0].count > 0) {
      return res.status(400).json({ success: false, message: 'Livro tem reservas ou empréstimos ativos' });
    }

    await db.query('DELETE FROM livros WHERE id_livro = ?', [id]);

    res.json({ success: true, message: 'Livro eliminado com sucesso' });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ success: false, message: 'Erro ao eliminar livro' });
  }
});

// @route   GET /api/livros/categorias/list
router.get('/categorias/list', async (req, res) => {
  try {
    const [categorias] = await db.query('SELECT DISTINCT categoria FROM livros WHERE categoria IS NOT NULL ORDER BY categoria');

    res.json({
      success: true,
      data: categorias.map(c => c.categoria)
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar categorias' });
  }
});

module.exports = router;
