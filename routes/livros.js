const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');

// @route   GET /api/livros
// @desc    Listar todos os livros (com filtros opcionais)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { categoria, disponivel, pesquisa } = req.query;
    
    let query = 'SELECT * FROM livros WHERE 1=1';
    const params = [];

    // Filtro por categoria
    if (categoria) {
      query += ' AND categoria = ?';
      params.push(categoria);
    }

    // Filtro por disponibilidade
    if (disponivel === 'true') {
      query += ' AND copias_disponiveis > 0';
    } else if (disponivel === 'false') {
      query += ' AND copias_disponiveis = 0';
    }

    // Filtro por pesquisa (título ou autor)
    if (pesquisa) {
      query += ' AND (titulo LIKE ? OR autor LIKE ?)';
      params.push(`%${pesquisa}%`, `%${pesquisa}%`);
    }

    query += ' ORDER BY titulo';

    const [livros] = await pool.query(query, params);

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

// @route   GET /api/livros/categorias/list
// @desc    Listar todas as categorias de livros
// @access  Public
router.get('/categorias/list', async (req, res) => {
  try {
    const [categorias] = await pool.query(
      'SELECT DISTINCT categoria FROM livros WHERE categoria IS NOT NULL ORDER BY categoria'
    );

    res.json({
      success: true,
      count: categorias.length,
      data: categorias.map(row => row.categoria)
    });
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar categorias'
    });
  }
});

// @route   GET /api/livros/:id
// @desc    Obter detalhes de um livro específico
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const [livros] = await pool.query(
      'SELECT * FROM livros WHERE id_livro = ?',
      [req.params.id]
    );

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
// @access  Private (Bibliotecário apenas)
router.post('/', auth, checkRole(['bibliotecario']), [
  body('titulo').trim().notEmpty().withMessage('Título é obrigatório'),
  body('autor').trim().notEmpty().withMessage('Autor é obrigatório'),
  body('isbn').trim().notEmpty().withMessage('ISBN é obrigatório'),
  body('total_copias').isInt({ min: 1 }).withMessage('Total de cópias deve ser um número positivo')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { titulo, autor, isbn, categoria, descricao, data_publicacao, total_copias } = req.body;

    // Verificar se ISBN já existe
    const [existingBook] = await pool.query(
      'SELECT id_livro FROM livros WHERE isbn = ?',
      [isbn]
    );

    if (existingBook.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um livro com este ISBN'
      });
    }

    // Inserir livro
    const [result] = await pool.query(
      `INSERT INTO livros (titulo, autor, isbn, categoria, descricao, data_publicacao, total_copias, copias_disponiveis) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, autor, isbn, categoria || null, descricao || null, data_publicacao || null, total_copias, total_copias]
    );

    res.status(201).json({
      success: true,
      message: 'Livro criado com sucesso',
      data: {
        id: result.insertId,
        titulo,
        autor,
        isbn,
        categoria,
        descricao,
        data_publicacao,
        total_copias,
        copias_disponiveis: total_copias
      }
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
// @access  Private (Bibliotecário apenas)
router.put('/:id', auth, checkRole(['bibliotecario']), [
  body('titulo').optional().trim().notEmpty().withMessage('Título não pode ser vazio'),
  body('autor').optional().trim().notEmpty().withMessage('Autor não pode ser vazio'),
  body('isbn').optional().trim().notEmpty().withMessage('ISBN não pode ser vazio')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { titulo, autor, isbn, categoria, descricao, data_publicacao, total_copias } = req.body;

    // Verificar se livro existe
    const [existingBook] = await pool.query(
      'SELECT * FROM livros WHERE id_livro = ?',
      [req.params.id]
    );

    if (existingBook.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Livro não encontrado'
      });
    }

    const livro = existingBook[0];

    // Se alterar o total de cópias, ajustar as disponíveis
    let copias_disponiveis = livro.copias_disponiveis;
    if (total_copias !== undefined) {
      const diferenca = total_copias - livro.total_copias;
      copias_disponiveis = Math.max(0, livro.copias_disponiveis + diferenca);
    }

    // Verificar ISBN duplicado (se alterado)
    if (isbn && isbn !== livro.isbn) {
      const [duplicateISBN] = await pool.query(
        'SELECT id_livro FROM livros WHERE isbn = ? AND id_livro != ?',
        [isbn, req.params.id]
      );

      if (duplicateISBN.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Já existe outro livro com este ISBN'
        });
      }
    }

    // Atualizar livro
    await pool.query(
      `UPDATE livros 
       SET titulo = COALESCE(?, titulo),
           autor = COALESCE(?, autor),
           isbn = COALESCE(?, isbn),
           categoria = COALESCE(?, categoria),
           descricao = COALESCE(?, descricao),
           data_publicacao = COALESCE(?, data_publicacao),
           total_copias = COALESCE(?, total_copias),
           copias_disponiveis = ?
       WHERE id_livro = ?`,
      [titulo, autor, isbn, categoria, descricao, data_publicacao, total_copias, copias_disponiveis, req.params.id]
    );

    // Buscar livro atualizado
    const [updatedBook] = await pool.query(
      'SELECT * FROM livros WHERE id_livro = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Livro atualizado com sucesso',
      data: updatedBook[0]
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
// @access  Private (Bibliotecário apenas)
router.delete('/:id', auth, checkRole(['bibliotecario']), async (req, res) => {
  try {
    // Verificar se livro existe
    const [livros] = await pool.query(
      'SELECT id_livro FROM livros WHERE id_livro = ?',
      [req.params.id]
    );

    if (livros.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Livro não encontrado'
      });
    }

    // Verificar se existem empréstimos ativos
    const [emprestimosAtivos] = await pool.query(
      'SELECT id_emprestimo FROM emprestimos WHERE id_livro = ? AND data_publicacao = ?',
      [req.params.id, 'ativo']
    );

    if (emprestimosAtivos.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível eliminar livro com empréstimos ativos'
      });
    }

    // Verificar se existem reservas pendentes
    const [reservasPendentes] = await pool.query(
      'SELECT id_reserva FROM reservas WHERE id_livro = ? AND estado = ?',
      [req.params.id, 'pendente']
    );

    if (reservasPendentes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível eliminar livro com reservas pendentes'
      });
    }

    // Eliminar livro
    await pool.query('DELETE FROM livros WHERE id_livro = ?', [req.params.id]);

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

module.exports = router;