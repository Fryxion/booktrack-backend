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

// @route   GET /api/livros
// @desc    Listar todos os livros (com pesquisa opcional)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, categoria, disponivel } = req.query;

    let sql = 'SELECT * FROM livros WHERE 1=1';
    const params = [];

    // Filtro de pesquisa
    if (search) {
      sql += ' AND (titulo LIKE ? OR autor LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Filtro de categoria
    if (categoria) {
      sql += ' AND categoria = ?';
      params.push(categoria);
    }

    // Filtro de disponibilidade
    if (disponivel !== undefined) {
      sql += ' AND disponivel = ?';
      params.push(disponivel === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY titulo ASC';

    const livros = await query(sql, params);

    res.json({
      success: true,
      count: livros.length,
      data: livros
    });
  } catch (error) {
    console.error('Erro ao listar livros:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar livros'
    });
  }
});

// @route   GET /api/livros/:id
// @desc    Obter detalhes de um livro
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const livros = await query('SELECT * FROM livros WHERE id = ?', [req.params.id]);

    if (livros.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Livro não encontrado'
      });
    }

    res.json({
      success: true,
      data: livros[0]
    });
  } catch (error) {
    console.error('Erro ao obter livro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter detalhes do livro'
    });
  }
});

// @route   POST /api/livros
// @desc    Criar novo livro
// @access  Private (Funcionário/Admin)
router.post('/', [auth, isStaff], [
  body('titulo').trim().notEmpty().withMessage('Título é obrigatório'),
  body('autor').trim().notEmpty().withMessage('Autor é obrigatório'),
  body('categoria').trim().notEmpty().withMessage('Categoria é obrigatória'),
  body('quantidade_total').isInt({ min: 1 }).withMessage('Quantidade total deve ser maior que 0')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      titulo,
      autor,
      isbn,
      publicacao,
      categoria,
      descricao,
      quantidade_total,
      capa_url
    } = req.body;

    // Verificar se ISBN já existe (se fornecido)
    if (isbn) {
      const existing = await query('SELECT id FROM livros WHERE isbn = ?', [isbn]);
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Já existe um livro com este ISBN'
        });
      }
    }

    const result = await queryRun(
      `INSERT INTO livros (titulo, autor, isbn, publicacao, categoria, descricao, quantidade_total, quantidade_disponivel, capa_url, disponivel)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, autor, isbn, publicacao, categoria, descricao, quantidade_total, quantidade_total, capa_url, 1]
    );

    const novoLivro = await query('SELECT * FROM livros WHERE id = ?', [result.id]);

    res.status(201).json({
      success: true,
      message: 'Livro criado com sucesso',
      data: novoLivro[0]
    });
  } catch (error) {
    console.error('Erro ao criar livro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar livro'
    });
  }
});

// @route   PUT /api/livros/:id
// @desc    Atualizar livro
// @access  Private (Funcionário/Admin)
router.put('/:id', [auth, isStaff], async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      autor,
      isbn,
      publicacao,
      categoria,
      descricao,
      quantidade_total,
      quantidade_disponivel,
      capa_url
    } = req.body;

    // Verificar se livro existe
    const livros = await query('SELECT * FROM livros WHERE id = ?', [id]);
    if (livros.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Livro não encontrado'
      });
    }

    // Verificar ISBN duplicado (excluindo o livro atual)
    if (isbn) {
      const existing = await query('SELECT id FROM livros WHERE isbn = ? AND id != ?', [isbn, id]);
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Já existe outro livro com este ISBN'
        });
      }
    }

    // Determinar disponibilidade
    const disponivel = quantidade_disponivel > 0 ? 1 : 0;

    await queryRun(
      `UPDATE livros SET 
        titulo = COALESCE(?, titulo),
        autor = COALESCE(?, autor),
        isbn = COALESCE(?, isbn),
        publicacao = COALESCE(?, publicacao),
        categoria = COALESCE(?, categoria),
        descricao = COALESCE(?, descricao),
        quantidade_total = COALESCE(?, quantidade_total),
        quantidade_disponivel = COALESCE(?, quantidade_disponivel),
        disponivel = ?,
        capa_url = COALESCE(?, capa_url),
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [titulo, autor, isbn, publicacao, categoria, descricao, quantidade_total, quantidade_disponivel, disponivel, capa_url, id]
    );

    const livroAtualizado = await query('SELECT * FROM livros WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Livro atualizado com sucesso',
      data: livroAtualizado[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar livro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar livro'
    });
  }
});

// @route   DELETE /api/livros/:id
// @desc    Eliminar livro
// @access  Private (Admin)
router.delete('/:id', [auth, isStaff], async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se livro existe
    const livros = await query('SELECT * FROM livros WHERE id = ?', [id]);
    if (livros.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Livro não encontrado'
      });
    }

    // Verificar se existem reservas ou empréstimos ativos
    const reservasAtivas = await query(
      'SELECT COUNT(*) as count FROM reservas WHERE livro_id = ? AND status = ?',
      [id, 'ativa']
    );

    const emprestimosAtivos = await query(
      'SELECT COUNT(*) as count FROM emprestimos WHERE livro_id = ? AND status = ?',
      [id, 'ativo']
    );

    if (reservasAtivas[0].count > 0 || emprestimosAtivos[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível eliminar este livro porque tem reservas ou empréstimos ativos'
      });
    }

    await queryRun('DELETE FROM livros WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Livro eliminado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao eliminar livro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao eliminar livro'
    });
  }
});

// @route   GET /api/livros/categorias/list
// @desc    Listar todas as categorias
// @access  Public
router.get('/categorias/list', async (req, res) => {
  try {
    const categorias = await query('SELECT DISTINCT categoria FROM livros WHERE categoria IS NOT NULL ORDER BY categoria');

    res.json({
      success: true,
      data: categorias.map(c => c.categoria)
    });
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar categorias'
    });
  }
});

module.exports = router;
