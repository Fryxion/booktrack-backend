const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');

// GET /api/utilizadores - Listar todos os utilizadores (apenas bibliotecário)
router.get('/', auth, checkRole(['bibliotecario']), async (req, res) => {
  try {
    const [utilizadores] = await pool.query(
      `SELECT 
        id_utilizador, 
        nome, 
        email, 
        tipo, 
        data_criacao 
       FROM utilizadores 
       ORDER BY data_criacao DESC`
    );
    
    res.json({
      success: true,
      data: utilizadores
    });
  } catch (error) {
    console.error('Erro ao listar utilizadores:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar utilizadores'
    });
  }
});

// PUT /api/utilizadores/:id/tipo - Alterar tipo de utilizador (apenas bibliotecário)
router.put('/:id/tipo', auth, checkRole(['bibliotecario']), async (req, res) => {
  const { id } = req.params;
  const { tipo } = req.body;
  
  try {
    // Validar tipo
    const tiposValidos = ['aluno', 'professor', 'bibliotecario'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo inválido. Deve ser: aluno, professor ou bibliotecario'
      });
    }
    
    // Verificar se utilizador existe
    const [utilizador] = await pool.query(
      'SELECT id_utilizador FROM utilizadores WHERE id_utilizador = ?',
      [id]
    );
    
    if (utilizador.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }
    
    // Atualizar tipo
    await pool.query(
      'UPDATE utilizadores SET tipo = ? WHERE id_utilizador = ?',
      [tipo, id]
    );
    
    res.json({
      success: true,
      message: 'Tipo de utilizador atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar tipo de utilizador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar tipo de utilizador'
    });
  }
});

module.exports = router;