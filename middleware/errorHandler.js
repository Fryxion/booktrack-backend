// ═══════════════════════════════════════════════════════════════════════════
// FICHEIRO: errorHandler.js
// ═══════════════════════════════════════════════════════════════════════════
//
// O QUE FAZ:
// Este ficheiro contém middlewares especializados em TRATAR ERROS.
// Quando algo corre mal na aplicação, estes middlewares capturam o erro
// e enviam uma resposta adequada ao cliente (em vez de crashar a aplicação).
//
// ANALOGIA:
// Pense numa loja: se o caixa encontra um problema ao processar um pagamento,
// ele não simplesmente desliga o sistema. Ele trata o erro graciosamente,
// informa o cliente e continua a trabalhar.
//
// IMPORTANTE: Este é um middleware ESPECIAL de erro.
// Tem 4 parâmetros: (err, req, res, next)
// Todos os outros middlewares têm 3: (req, res, next)
// O Express reconhece isso automaticamente!
//
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE 1: ERRORHANDLER - TRATAR ERROS
// ═══════════════════════════════════════════════════════════════════════════
// 
// Quando alguém lança um erro (throw new Error(...) ou next(err)),
// este middleware o apanha e trata de forma apropriada.
// 
const errorHandler = (err, req, res, next) => {
  // 📝 PASSO 1: REGISTAR O ERRO NO CONSOLE (PARA DIAGNÓSTICO)
  // ========================================================
  // Isto ajuda os programadores a debugar problemas.
  // Em produção, isto seria escrito num ficheiro de log.
  console.error('Erro:', err);

  // 🔍 PASSO 2: VERIFICAR O TIPO DE ERRO
  // ===================================
  // Erros diferentes requerem respostas diferentes.
  // Vamos verificar qual é o erro e responder apropriadamente.

  // ❌ TIPO 1: ERRO DE VALIDAÇÃO
  // ===========================
  // Isto acontece quando os dados enviados pelo cliente não são válidos.
  // Exemplo: E-mail sem @ , idade negativa, campo obrigatório em falta.
  // Código HTTP: 400 (Bad Request - "Pedido Inválido")
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors: err.errors  // Detalhe exato do que está errado
    });
  }

  // ❌ TIPO 2: ERRO DE TOKEN JWT INVÁLIDO
  // ====================================
  // Isto acontece quando o token está corrompido ou modificado.
  // Exemplo: token com caracteres removidos, token fake.
  // Código HTTP: 401 (Unauthorized - "Não Autorizado")
  // Significado: "Você não está autenticado corretamente"
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }

  // ❌ TIPO 3: ERRO DE TOKEN JWT EXPIRADO
  // ====================================
  // Isto acontece quando o token é válido MAS já passou o tempo de expiração.
  // Exemplo: Fez login há 7 dias, token expirou (tempo configurado).
  // Código HTTP: 401 (Unauthorized - "Não Autorizado")
  // Significado: "Seu token expirou, faça login novamente"
  // 
  // O cliente (app/website) deve detectar isto e redirecionar para login.
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado'
    });
  }

  // ❌ TIPO 4: ERRO GENÉRICO / DESCONHECIDO
  // ======================================
  // Se o erro não é nenhum dos tipos acima, é um erro desconhecido.
  // Vamos enviar uma resposta genérica segura.
  // 
  // Código HTTP: 500 (Internal Server Error - "Erro Interno")
  // Significado: Algo correu mal no servidor
  // 
  // Se estivermos em DESENVOLVIMENTO, mostramos a stack trace (diagnóstico).
  // Se estivermos em PRODUÇÃO, NÃO mostramos (é um risco de segurança).
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    // Isto é uma sintaxe moderna JavaScript: Se não estivermos em produção, adiciona a propriedade "stack"
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};



// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE 2: NOTFOUND - TRATAR ROTAS NÃO ENCONTRADAS
// ═══════════════════════════════════════════════════════════════════════════
// 
// O que faz:
// Quando o cliente tenta aceder a uma URL que NÃO EXISTE, este middleware
// cria um erro apropriado e passa-o para o errorHandler acima.
// 
// Exemplo:
// - Cliente tenta: GET /api/xyz123 (rota não existe)
// - Este middleware apanha isso
// - Cria um erro: "Rota não encontrada - /api/xyz123"
// - Passa para errorHandler que envia resposta 404
// 
// IMPORTANTE: Este middleware deve estar NO FINAL do ficheiro server.js,
// DEPOIS de todas as outras rotas. Isto é porque o Express testa as rotas
// de cima para baixo. Se não encontrar nenhuma, cai aqui.
// 
const notFound = (req, res, next) => {
  // 🔍 PASSO 1: CRIAR ERRO DESCRITIVO
  // ================================
  // Incluímos a URL original que o cliente tentou para ajudar no diagnóstico.
  const error = new Error(`Rota não encontrada - ${req.originalUrl}`);
  
  // 🔍 PASSO 2: DEFINIR CÓDIGO HTTP APROPRIADO
  // =========================================
  // 404 = "Not Found" (Não Encontrado)
  res.status(404);
  
  // 🔍 PASSO 3: PASSAR PARA O ERRORHANDLER
  // ====================================
  // Ao chamar next(error), passamos para o middleware de erro acima.
  // Ele vai tratar e enviar a resposta ao cliente.
  next(error);
};


module.exports = { errorHandler, notFound };

// ═══════════════════════════════════════════════════════════════════════════
// RESUMO - COMO USAR ESTE FICHEIRO
// ═══════════════════════════════════════════════════════════════════════════
//
// No ficheiro server.js, estes middlewares são usados assim:
//
// ┌────────────────────────────────────────────────────────────────────────┐
// │ // EM server.js                                                        │
// │                                                                        │
// │ const { errorHandler, notFound } = require('./middleware/errorHandler');
// │                                                                        │
// │ // ... TODAS AS ROTAS AQUI ...                                        │
// │ app.use('/api/auth', authRoutes);                                      │
// │ app.use('/api/livros', livrosRoutes);                                  │
// │                                                                        │
// │ // DEPOIS de todas as rotas, adicione estes middlewares:              │
// │ app.use(notFound);           // Captura rotas não encontradas         │
// │ app.use(errorHandler);       // Trata erros                           │
// └────────────────────────────────────────────────────────────────────────┘
//
// FLUXO QUANDO ALGO CORRE MAL:
// ═══════════════════════════════════════════════════════════════════════════
//
//  Pedido HTTP
//      │
//      ├─> Rota encontrada? ─────────► SIM ─> Handler executa
//      │                                        │
//      │                                        └─> Erro lançado?
//      │                                               │
//      │                                               ├─> SIM: next(err)
//      │                                               │
//      │                                               └─> NÃO: res.json() ✅
//      │
//      └─> Rota NOT encontrada? ─────► SIM ─> notFound middleware
//                                             │
//                                             └─> Cria erro 404
//                                                 │
//                                                 └─> next(error)
//                                                     │
//                                                     └─► errorHandler
//                                                         │
//                                                         └─> Resposta HTTP
//
// EXEMPLOS DE MENSAGENS DE ERRO ENVIADAS AO CLIENTE:
// ═══════════════════════════════════════════════════════════════════════════
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ Erro 400 - Validação Falhou                                             │
// ├─────────────────────────────────────────────────────────────────────────┤
// │ {                                                                       │
// │   "success": false,                                                    │
// │   "message": "Erro de validação",                                      │
// │   "errors": { "email": "Email inválido" }                             │
// │ }                                                                       │
// └─────────────────────────────────────────────────────────────────────────┘
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ Erro 401 - Token Expirado                                               │
// ├─────────────────────────────────────────────────────────────────────────┤
// │ {                                                                       │
// │   "success": false,                                                    │
// │   "message": "Token expirado"                                          │
// │ }                                                                       │
// │ → Cliente deve fazer login novamente!                                  │
// └─────────────────────────────────────────────────────────────────────────┘
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ Erro 404 - Rota Não Encontrada                                          │
// ├─────────────────────────────────────────────────────────────────────────┤
// │ {                                                                       │
// │   "success": false,                                                    │
// │   "message": "Rota não encontrada - /api/xyz123"                       │
// │ }                                                                       │
// │ → Cliente tentou acessar URL que não existe                            │
// └─────────────────────────────────────────────────────────────────────────┘
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ Erro 500 - Erro Interno do Servidor                                     │
// ├─────────────────────────────────────────────────────────────────────────┤
// │ {                                                                       │
// │   "success": false,                                                    │
// │   "message": "Erro interno do servidor"                                │
// │   [Se DESENVOLVIMENTO: "stack": "Error: ..."]                          │
// │ }                                                                       │
// │ → Algo correu mal que não era esperado                                 │
// └─────────────────────────────────────────────────────────────────────────┘
//
// CÓDIGOS HTTP USADOS:
// ═══════════════════════════════════════════════════════════════════════════
// 400 = Bad Request      → Cliente enviou dados inválidos
// 401 = Unauthorized     → Autenticação falhou (token inválido/expirado)
// 404 = Not Found        → Rota não existe
// 500 = Server Error     → Algo correu mal no servidor
//
// ═══════════════════════════════════════════════════════════════════════════
