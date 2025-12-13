/**
 * ========================================================================
 * FICHEIRO PRINCIPAL DO SERVIDOR - BOOKTRACK API
 * ========================================================================
 * 
 * Este é o ficheiro central que controla todo o servidor da aplicação BookTrack.
 * É como o "coração" da aplicação - aqui é onde tudo começa e se organiza.
 * 
 * O que faz este ficheiro:
 * 1. Carrega as configurações necessárias
 * 2. Cria o servidor web
 * 3. Configura como o servidor funciona (middlewares)
 * 4. Define as rotas (caminhos) para aceder aos dados
 * 5. Inicia o servidor e fica à escuta de pedidos
 * 
 * ========================================================================
 */

// ⚙️ PASSO 1: CARREGAR CONFIGURAÇÕES
// ===================================
// Isto lê o ficheiro .env que tem valores secretos e configurações especiais
// Por exemplo: a password da base de dados, a chave do servidor, etc.
require('dotenv').config();

// 📦 PASSO 2: IMPORTAR BIBLIOTECAS NECESSÁRIAS
// =============================================
// Express: Uma biblioteca que facilita criar um servidor web
const express = require('express');

// CORS: Permite que outras aplicações (exemplo: a aplicação no telemóvel) 
// consigam comunicar com este servidor. Sem isto, por segurança, seria bloqueado.
const cors = require('cors');

// Path: Uma ferramenta para trabalhar com caminhos de ficheiros
const path = require('path');

// ⚠️ PASSO 3: IMPORTAR FERRAMENTAS DE TRATAMENTO DE ERROS
// ========================================================
// Isto são funções especiais que lidam com os erros que possam acontecer
// - errorHandler: Trata erros gerais
// - notFound: Trata quando alguém tenta aceder a uma página que não existe (erro 404)
const { errorHandler, notFound } = require('./middleware/errorHandler');

// 🌐 PASSO 4: CRIAR O SERVIDOR EXPRESS
// ======================================
// "app" é agora o nosso servidor web. É o objeto principal com o qual vamos trabalhar
// para adicionar funcionalidades, definir rotas, etc.
const app = express();


// 🔧 PASSO 5: CONFIGURAR O SERVIDOR (MIDDLEWARES)
// ================================================
// Middlewares são como "filtros" que processam cada pedido que o servidor recebe
// Todos os pedidos passam por estes filtros antes de chegar ao destino final

// Ativar CORS: Permite comunicações seguras entre esta API e outros serviços
app.use(cors());

// Permitir que o servidor processe dados em formato JSON
// (isto é o formato padrão para enviar dados para cá)
app.use(express.json());

// Permitir que o servidor processe dados enviados através de formulários HTML
// extended: true significa que aceita dados mais complexos
app.use(express.urlencoded({ extended: true }));


// 📍 PASSO 6: DEFINIR AS ROTAS (CAMINHOS) DA API
// ===============================================
// As rotas são como os "caminhos" que as pessoas podem seguir para aceder aos dados
// Por exemplo: "/api/livros" é o caminho para aceder aos livros
// 
// Cada rota está organizada num ficheiro separado para ser mais fácil de manter
// Por exemplo:
// - /api/auth      → Tudo relacionado com login/registo de utilizadores
// - /api/livros    → Tudo relacionado com a lista de livros
// - /api/reservas  → Tudo relacionado com reservas de livros
// - /api/emprestimos → Tudo relacionado com empréstimos de livros
// - /api/utilizadores → Tudo relacionado com dados de utilizadores

// Rota de autenticação (login, registo, etc)
app.use('/api/auth', require('./routes/auth'));

// Rota de livros (ver livros, adicionar novos, etc)
app.use('/api/livros', require('./routes/livros'));

// Rota de reservas (ver reservas, fazer novas reservas, etc)
app.use('/api/reservas', require('./routes/reservas'));

// Rota de empréstimos (histórico de empréstimos, etc)
app.use('/api/emprestimos', require('./routes/emprestimos'));

// Rota de utilizadores (perfis, dados dos utilizadores, etc)
app.use('/api/utilizadores', require('./routes/utilizadores'));


// 🧪 ROTA DE TESTE
// ================
// Esta é uma rota simples para verificar se o servidor está a funcionar
// Se entrares em: http://localhost:5000/api
// Vais ver uma mensagem dizendo que a API está viva
app.get('/api', (req, res) => {
  // res.json() envia uma resposta em formato JSON
  res.json({
    // Campos de resposta:
    success: true,                          // Indica que tudo correu bem
    message: 'API BookTrack está a funcionar!',  // Mensagem de boas-vindas
    version: '1.0.0',                       // Versão atual da API
    endpoints: {                            // Lista dos principais caminhos disponíveis
      auth: '/api/auth',
      livros: '/api/livros',
      reservas: '/api/reservas',
      emprestimos: '/api/emprestimos'
    }
  });
});

// 🏥 ROTA DE VERIFICAÇÃO DE SAÚDE
// ================================
// Esta rota verifica se o servidor está funcional
// É como um "pulso" do servidor - mostra que está vivo
app.get('/api/health', (req, res) => {
  res.json({
    // Indica o estado atual do servidor
    success: true,                          // Sem erros
    status: 'healthy',                      // Estado: saudável
    timestamp: new Date().toISOString()     // Hora exata da verificação
  });
});


// ⚠️ PASSO 7: TRATAMENTO DE ERROS
// ================================
// Estes são como "redes de segurança" que apanham problemas que possam ocorrer

// Se alguém tentar aceder a uma rota que não existe (erro 404)
app.use(notFound);

// Para qualquer outro erro que aconteça, ativar o gestor de erros
app.use(errorHandler);


// 🚀 PASSO 8: INICIAR O SERVIDOR
// ================================

// Definir a porta (o "número de porta" onde o servidor vai ouvir)
// Isto permite que a aplicação escolha uma porta personalizada através do ficheiro .env
// Se nenhuma for especificada, usa a porta 5000 por padrão
const PORT = process.env.PORT || 5000;

// Iniciar o servidor e deixá-lo à escuta de pedidos
// A função dentro de () executa quando o servidor inicia com sucesso
app.listen(PORT, () => {
  // Mostrar uma mensagem bonita no console para confirmar que o servidor começou
  console.log('\n╔╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╗');
  console.log('║                                          ║');
  console.log('║     🚀 BookTrack API Server              ║');
  console.log('║                                          ║');
  console.log('╚╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝\n');
  
  // Mostrar informações úteis sobre o servidor
  console.log(`📝 Servidor a correr em: http://localhost:${PORT}`);
  console.log(`🌝 Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📚 API disponível em: http://localhost:${PORT}/api\n`);
  
  // Listar todos os endpoints (caminhos) disponíveis
  console.log('Endpoints disponíveis:');
  console.log('  - POST   /api/auth/register              (Criar nova conta)');
  console.log('  - POST   /api/auth/login                 (Fazer login)');
  console.log('  - GET    /api/auth/me                    (Ver meu perfil)');
  console.log('  - GET    /api/livros                     (Ver todos os livros)');
  console.log('  - GET    /api/livros/:id                 (Ver detalhes de um livro)');
  console.log('  - POST   /api/livros                     (Adicionar novo livro)');
  console.log('  - GET    /api/reservas                   (Ver minhas reservas)');
  console.log('  - POST   /api/reservas                   (Fazer nova reserva)');
  console.log('  - GET    /api/emprestimos                (Ver histórico de empréstimos)');
  console.log('  - POST   /api/emprestimos                (Registar novo empréstimo)');
  console.log('\n✨ Pronto para receber pedidos!\n');
});


// 🔴 PASSO 9: TRATAMENTO DE ERROS NÃO ESPERADOS
// ===============================================
// Por vezes, podem ocorrer erros que não foram apanhados pelas redes de segurança anteriores
// Este código garante que esses erros são registados e o servidor não fica "congelado"
process.on('unhandledRejection', (err) => {
  // Mostrar o erro no console para o programador poder ver o que correu mal
  console.error('❌ Erro não tratado:', err);
  
  // Encerrar o servidor (sair) de forma segura
  // Isto evita que o servidor continue a funcionar com um problema grave
  process.exit(1);
});
