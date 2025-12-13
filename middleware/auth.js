/**
 * ========================================================================
 * MIDDLEWARE DE AUTENTICAÇÃO E AUTORIZAÇÃO - BOOKTRACK API
 * ========================================================================
 * 
 * Este ficheiro contém "middlewares" (filtros) de segurança.
 * Um middleware é uma função que fica "no meio" do caminho de um pedido.
 * 
 * Analogia: Imagine um banco
 * 1. AUTH: O guarda da porta verifica se tem um cartão (token)
 * 2. CHECKROLE/PERMISSÕES: O caixa verifica se é cliente normal ou gerente
 * 3. Se não passar, acesso negado!
 * 
 * FLUXO DE UM PEDIDO COM AUTENTICAÇÃO:
 * 
 *     Cliente faz pedido
 *            ↓
 *     AUTH middleware: Verifica token JWT
 *            ↓
 *     Se token inválido/inexistente → ACESSO NEGADO (401)
 *            ↓
 *     Se token válido → Extrai dados do token
 *            ↓
 *     CHECKROLE middleware: Verifica se tem permissão
 *            ↓
 *     Se tipo incorreto → ACESSO NEGADO (403)
 *            ↓
 *     Se tipo correto → Deixa passar para a rota!
 * 
 * ========================================================================
 */

// 📦 PASSO 1: IMPORTAR AS FERRAMENTAS NECESSÁRIAS
// ================================================

// JWT: Biblioteca para verificar tokens de autenticação
const jwt = require('jsonwebtoken');

// ═══════════════════════════════════════════════════════════════════════
// MIDDLEWARE 1: AUTH - VERIFICAR TOKEN JWT
// ═══════════════════════════════════════════════════════════════════════
// 
// O que faz:
// Este middleware verifica se o utilizador enviou um token válido.
// Se o token não existir ou for inválido, BLOQUEIA o acesso.
// 
// Como funciona:
// 1. Procura o token no header "Authorization"
// 2. Remove a palavra "Bearer " do início (padrão HTTP)
// 3. Verifica se o token é válido usando a chave secreta
// 4. Se for válido, extrai os dados e coloca em req.user
// 5. Se for inválido, bloqueia com erro 401
// 
// Formato do header:
// Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
//                ↑       ↑
//                |       Token (gerado no login/registo)
//                Palavra-chave obrigatória
// 
// IMPORTANTE:
// - Se não há token → Erro 401 (Não autenticado)
// - Se token inválido → Erro 401 (Não autenticado)
// - Se token expirou → Erro 401 (Não autenticado)
// 
// Exemplo de uso numa rota:
// router.get('/minha-rota', auth, async (req, res) => {
//   // Aqui o utilizador é obrigatoriamente autenticado
//   // req.user tem: { id, email, tipo }
// });
// 
const auth = (req, res, next) => {
  try {
    // 🔍 PASSO 1: PROCURAR O TOKEN NO HEADER
    // =======================================
    // Header "Authorization" tem formato: "Bearer [token]"
    // O ?. é "optional chaining" - não dá erro se não existir
    // .replace('Bearer ', '') remove a palavra "Bearer "
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Se não há token:
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acesso negado. Token não fornecido.'
      });
    }

    // ✅ PASSO 2: VERIFICAR E DESCODIFICAR O TOKEN
    // ===========================================
    // jwt.verify:
    // - Verifica a assinatura do token (não foi alterado)
    // - Verifica se não expirou
    // - Descodifica e retorna os dados guardados
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Guardar dados do utilizador no req para uso posterior
    // decoded tem: { id, email, tipo, iat, exp }
    req.user = decoded;
    
    // ✅ TUDO OK - DEIXAR PASSAR PARA A PRÓXIMA FUNÇÃO
    // ================================================
    next();
  } catch (error) {
    // 🚨 ERRO: Token inválido ou expirado
    // ===================================
    res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado.'
    });
  }
};


// ═══════════════════════════════════════════════════════════════════════
// MIDDLEWARE 2: CHECKROLE - VERIFICAR TIPO DE UTILIZADOR
// ═══════════════════════════════════════════════════════════════════════
// 
// O que faz:
// Verifica se o utilizador tem o tipo correto (aluno, professor, bibliotecário).
// É usado para permitir ou bloquear acesso a operações específicas.
// 
// Como funciona:
// 1. Verifica se o utilizador está autenticado (req.user existe)
// 2. Verifica se o tipo do utilizador está na lista de permitidos
// 3. Se não tiver permissão, bloqueia com erro 403
// 
// IMPORTANTE:
// - Deve ser usado DEPOIS do middleware "auth"
// - Sempre que a rota receber múltiplos middlewares, "auth" vai primeiro
// 
// Exemplo de uso:
// router.post('/criar-livro', auth, checkRole(['bibliotecario']), async (req, res) => {
//   // Apenas bibliotecários conseguem executar isto
// });
// 
// router.post('/ver-emprestimos', auth, checkRole(['aluno', 'professor', 'bibliotecario']), async (req, res) => {
//   // Qualquer um autenticado consegue ver empréstimos
// });
// 
// Parâmetros:
// allowedRoles: Array com os tipos permitidos
//   - ['aluno']
//   - ['professor']
//   - ['bibliotecario']
//   - ['aluno', 'professor'] (múltiplos)
//   - ['aluno', 'professor', 'bibliotecario'] (todos)
// 
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // ✅ PASSO 1: VERIFICAR SE ESTÁ AUTENTICADO
    // =========================================
    // Se não há req.user, significa que falhou o middleware "auth"
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticação necessária.'
      });
    }

    // ✅ PASSO 2: VERIFICAR SE TEM PERMISSÃO
    // ====================================
    // allowedRoles.includes(req.user.tipo) verifica se o tipo está na lista
    if (!allowedRoles.includes(req.user.tipo)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissões insuficientes.'
      });
    }

    // ✅ TUDO OK - DEIXAR PASSAR
    // ==========================
    next();
  };
};


// ═══════════════════════════════════════════════════════════════════════
// MIDDLEWARE 3: ISBIBLIOTECARIO - VERIFICAR SE É BIBLIOTECÁRIO
// ═══════════════════════════════════════════════════════════════════════
// 
// O que faz:
// Atalho para verificar especificamente se é bibliotecário.
// É equivalente a: auth, checkRole(['bibliotecario'])
// Mas mais simples de usar.
// 
// Exemplo de uso:
// router.post('/criar-livro', auth, isBibliotecario, async (req, res) => {
//   // Apenas bibliotecários
// });
// 
// NOTA: É apenas uma "açúcar sintática" - faz a mesma coisa que checkRole
// Escolha usar isto ou checkRole dependendo do seu gosto!
// 
const isBibliotecario = (req, res, next) => {
  // ✅ PASSO 1: VERIFICAR SE ESTÁ AUTENTICADO
  // =========================================
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticação necessária.'
    });
  }

  // ✅ PASSO 2: VERIFICAR SE É BIBLIOTECÁRIO
  // =======================================
  if (req.user.tipo !== 'bibliotecario') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas bibliotecários podem realizar esta ação.'
    });
  }
  
  // ✅ TUDO OK - DEIXAR PASSAR
  // ==========================
  next();
};


// ═══════════════════════════════════════════════════════════════════════
// MIDDLEWARE 4: ISSTAFF - VERIFICAR SE É STAFF (PROFESSOR OU BIBLIOTECÁRIO)
// ═══════════════════════════════════════════════════════════════════════
// 
// O que faz:
// Verifica se o utilizador é "staff" - isto é, professor OU bibliotecário.
// Alunos NÃO podem passar.
// 
// Exemplo de uso:
// router.get('/relatorios', auth, isStaff, async (req, res) => {
//   // Apenas professores ou bibliotecários
// });
// 
// Casos de uso típicos:
// - Acesso a relatórios
// - Ver dados agregados
// - Moderar conteúdo
// 
// É equivalente a: auth, checkRole(['professor', 'bibliotecario'])
// 
const isStaff = (req, res, next) => {
  // ✅ PASSO 1: VERIFICAR SE ESTÁ AUTENTICADO
  // =========================================
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticação necessária.'
    });
  }

  // ✅ PASSO 2: VERIFICAR SE É STAFF
  // ================================
  // Staff = Professor OU Bibliotecário
  if (req.user.tipo !== 'professor' && req.user.tipo !== 'bibliotecario') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas staff pode aceder aqui.'
    });
  }
  
  // ✅ TUDO OK - DEIXAR PASSAR
  // ==========================
  next();
};

module.exports = { 
  auth, 
  checkRole, 
  isBibliotecario, 
  isStaff 
};

// ═══════════════════════════════════════════════════════════════════════
// RESUMO GERAL - COMO USAR ESTE FICHEIRO
// ═══════════════════════════════════════════════════════════════════════
//
// Este ficheiro exporta 4 middlewares de segurança. Segue um exemplo de
// como usá-los numa rota:
//
// ┌─────────────────────────────────────────────────────────────────┐
// │ EXEMPLO 1: Qualquer utilizador autenticado pode aceder          │
// ├─────────────────────────────────────────────────────────────────┤
// │ router.get('/meu-perfil', auth, async (req, res) => {           │
// │   // req.user.id, req.user.email, req.user.tipo                 │
// │ });                                                             │
// └─────────────────────────────────────────────────────────────────┘
//
// ┌─────────────────────────────────────────────────────────────────┐
// │ EXEMPLO 2: Apenas bibliotecários                                │
// ├─────────────────────────────────────────────────────────────────┤
// │ router.post('/criar-livro', auth, isBibliotecario, async (...) {│
// │   // Cria livro                                                 │
// │ });                                                             │
// └─────────────────────────────────────────────────────────────────┘
//
// ┌─────────────────────────────────────────────────────────────────┐
// │ EXEMPLO 3: Alunos ou Professores (mas não bibliotecários)       │
// ├─────────────────────────────────────────────────────────────────┤
// │ router.post('/emprestar', auth,                                 │
// │   checkRole(['aluno', 'professor']),                            │
// │   async (...) { ... }                                           │
// │ );                                                              │
// └─────────────────────────────────────────────────────────────────┘
//
// ┌─────────────────────────────────────────────────────────────────┐
// │ EXEMPLO 4: Staff (professor ou bibliotecário)                   │
// ├─────────────────────────────────────────────────────────────────┤
// │ router.get('/relatorios', auth, isStaff, async (...) {          │
// │   // Relatórios só para staff                                   │
// │ });                                                             │
// └─────────────────────────────────────────────────────────────────┘
//
// ORDEM IMPORTANTE - sempre colocar auth PRIMEIRO!
// ═══════════════════════════════════════════════════════════════════════
//
// ✅ CORRETO:
// router.post('/dados', auth, isBibliotecario, handler);
//
// ❌ ERRADO:
// router.post('/dados', isBibliotecario, auth, handler);
//           (isBibliotecario precisa de auth já ter extraído a info!)
//
// ═══════════════════════════════════════════════════════════════════════