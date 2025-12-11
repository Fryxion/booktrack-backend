const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { errorHandler, notFound } = require('./middleware/errorHandler');

// Inicializar Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/livros', require('./routes/livros'));
app.use('/api/reservas', require('./routes/reservas'));
app.use('/api/emprestimos', require('./routes/emprestimos'));

// Rota de teste
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API BookTrack est� a funcionar!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      livros: '/api/livros',
      reservas: '/api/reservas',
      emprestimos: '/api/emprestimos'
    }
  });
});

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Middleware de erro 404
app.use(notFound);

// Middleware de tratamento de erros
app.use(errorHandler);

// Configurar porta
const PORT = process.env.PORT || 5000;

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n╔╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╗');
  console.log('║                                          ║');
  console.log('║     🚀 BookTrack API Server              ║');
  console.log('║                                          ║');
  console.log('╚╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝\n');
  console.log(`📝 Servidor a correr em: http://localhost:${PORT}`);
  console.log(`🌝 Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📚 API disponível em: http://localhost:${PORT}/api\n`);
  console.log('Endpoints disponíveis:');
  console.log('  - POST   /api/auth/register');
  console.log('  - POST   /api/auth/login');
  console.log('  - GET    /api/auth/me');
  console.log('  - GET    /api/livros');
  console.log('  - GET    /api/livros/:id');
  console.log('  - POST   /api/livros');
  console.log('  - GET    /api/reservas');
  console.log('  - POST   /api/reservas');
  console.log('  - GET    /api/emprestimos');
  console.log('  - POST   /api/emprestimos');
  console.log('\n✨ Pronto para receber pedidos!\n');
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Erro não tratado:', err);
  process.exit(1);
});
