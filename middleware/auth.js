const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT
const auth = (req, res, next) => {
  try {
    // Obter token do header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acesso negado. Token não fornecido.'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado.'
    });
  }
};

// Middleware para verificar role/tipo do utilizador
// Aceita um array de tipos permitidos: ['aluno', 'professor', 'bibliotecario']
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticação necessária.'
      });
    }

    if (!allowedRoles.includes(req.user.tipo)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissões insuficientes.'
      });
    }

    next();
  };
};

// Middleware específico para verificar se é bibliotecário
const isBibliotecario = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticação necessária.'
    });
  }

  if (req.user.tipo !== 'bibliotecario') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas bibliotecários podem realizar esta ação.'
    });
  }
  next();
};

// Middleware específico para verificar se é professor ou bibliotecário
const isStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticação necessária.'
    });
  }

  if (req.user.tipo !== 'professor' && req.user.tipo !== 'bibliotecario') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Permissões insuficientes.'
    });
  }
  next();
};

module.exports = { 
  auth, 
  checkRole, 
  isBibliotecario, 
  isStaff 
};