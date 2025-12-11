const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth } = require('../middleware/auth');

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

// @route   POST /api/auth/register
// @desc    Registar novo utilizador
// @access  Public
router.post('/register', [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Password deve ter pelo menos 6 caracteres'),
  body('tipo').isIn(['Aluno', 'Professor', 'Funcionário']).withMessage('Tipo de utilizador inválido')
], async (req, res) => {
  try {
    // Validar dados
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { nome, email, password, tipo } = req.body;

    // Verificar se email já existe
    const existingUser = await query('SELECT id FROM utilizadores WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Este email já está registado'
      });
    }

    // Encriptar password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Data atual
    const dataRegisto = new Date().toLocaleDateString('pt-PT');

    // Inserir utilizador
    const result = await queryRun(
      'INSERT INTO utilizadores (nome, email, password, tipo, data_registo) VALUES (?, ?, ?, ?, ?)',
      [nome, email, hashedPassword, tipo, dataRegisto]
    );

    // Criar token JWT
    const token = jwt.sign(
      { id: result.id, email, tipo },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'Utilizador registado com sucesso',
      data: {
        token,
        user: {
          id: result.id,
          nome,
          email,
          tipo,
          data_registo: dataRegisto
        }
      }
    });
  } catch (error) {
    console.error('Erro no registo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registar utilizador'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login de utilizador
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Password é obrigatória')
], async (req, res) => {
  try {
    // Validar dados
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Procurar utilizador
    const users = await query('SELECT * FROM utilizadores WHERE email = ? AND ativo = 1', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou password incorretos'
      });
    }

    const user = users[0];

    // Verificar password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou password incorretos'
      });
    }

    // Criar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, tipo: user.tipo },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Remover password do objeto user
    delete user.password;

    res.json({
      success: true,
      message: 'Login efetuado com sucesso',
      data: {
        token,
        user
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao efetuar login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Obter dados do utilizador atual
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const users = await query('SELECT id, nome, email, tipo, data_registo FROM utilizadores WHERE id = ?', [req.user.id]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('Erro ao obter utilizador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter dados do utilizador'
    });
  }
});

// @route   PUT /api/auth/update-password
// @desc    Atualizar password do utilizador
// @access  Private
router.put('/update-password', auth, [
  body('currentPassword').notEmpty().withMessage('Password atual é obrigatória'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nova password deve ter pelo menos 6 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Obter utilizador
    const users = await query('SELECT password FROM utilizadores WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    // Verificar password atual
    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password atual incorreta'
      });
    }

    // Encriptar nova password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar password
    await queryRun(
      'UPDATE utilizadores SET password = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({
      success: true,
      message: 'Password atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar password:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar password'
    });
  }
});

module.exports = router;
