const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { auth } = require('../middleware/auth');

// Debug: verificar variáveis de ambiente
console.log('[AUTH] Verificando variáveis de ambiente...');
console.log('[AUTH] JWT_SECRET:', process.env.JWT_SECRET ? 'DEFINIDO' : 'NÃO DEFINIDO');
console.log('[AUTH] JWT_EXPIRE:', process.env.JWT_EXPIRE || 'não definido (será usado padrão)');

// Validar variáveis de ambiente necessárias
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET não definido nas variáveis de ambiente');
}

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
    const [existingUser] = await pool.query('SELECT id FROM utilizadores WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Este email já está registado'
      });
    }

    // Encriptar password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserir utilizador
    const [result] = await pool.query(
      'INSERT INTO utilizadores (nome, email, password_hash, tipo) VALUES (?, ?, ?, ?)',
      [nome, email, hashedPassword, tipo]
    );

    // Criar token JWT
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpire = process.env.JWT_EXPIRE || '7d';
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET não definido nas variáveis de ambiente');
    }
    
    const token = jwt.sign(
      { id: result.insertId, email, tipo },
      jwtSecret,
      { expiresIn: jwtExpire }
    );

    res.status(201).json({
      success: true,
      message: 'Utilizador registado com sucesso',
      data: {
        token,
        user: {
          id: result.insertId,
          nome,
          email,
          tipo
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
    const [users] = await pool.query('SELECT * FROM utilizadores WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou password incorretos'
      });
    }

    const user = users[0];

    // Verificar password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou password incorretos'
      });
    }

    // Criar token JWT
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpire = process.env.JWT_EXPIRE || '7d';
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET não definido nas variáveis de ambiente');
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, tipo: user.tipo },
      jwtSecret,
      { expiresIn: jwtExpire }
    );

    // Remover password do objeto user
    delete user.password_hash;

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
    const [users] = await pool.query('SELECT id, nome, email, tipo, data_registo FROM utilizadores WHERE id = ?', [req.user.id]);
    
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
    const [users] = await pool.query('SELECT password FROM utilizadores WHERE id = ?', [req.user.id]);
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
    await pool.query(
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