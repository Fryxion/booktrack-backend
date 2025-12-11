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

// Middleware para verificar se o utilizador é admin
const isAdmin = (req, res, next) => {
  if (req.user.tipo !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores podem realizar esta ação.'
    });
  }
  next();
};

// Middleware para verificar se o utilizador é funcionário ou admin
const isStaff = (req, res, next) => {
  if (req.user.tipo !== 'Admin' && req.user.tipo !== 'Funcionário') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Permissões insuficientes.'
    });
  }
  next();
};

module.exports = { auth, isAdmin, isStaff };
