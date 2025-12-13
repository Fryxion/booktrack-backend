/**
 * ========================================================================
 * AUTENTICAÇÃO E AUTORIZAÇÃO - BOOKTRACK API
 * ========================================================================
 * 
 * Este ficheiro trata de TUDO RELACIONADO COM CONTAS DE UTILIZADOR:
 * - Registar uma nova conta
 * - Fazer login (entrar na conta)
 * - Ver dados da minha conta
 * - Alterar a password
 * - Atualizar perfil (nome, email)
 * - Eliminar a conta
 * 
 * CONCEITOS IMPORTANTES:
 * 
 * 1. BCRYPT: Encriptação de passwords
 *    - Nunca guardamos passwords em texto simples na base de dados!
 *    - Usamos BCRYPT para transformar a password num "código ilegível"
 *    - Mesmo que alguém roube a base de dados, não consegue ler as passwords
 * 
 * 2. JWT (JSON Web Tokens): Autenticação
 *    - Quando faz login, recebe um "token" (uma espécie de bilhete)
 *    - Este token prova que está autenticado
 *    - Cada pedido posterior deve incluir este token
 *    - O servidor verifica se o token é válido antes de deixar fazer algo
 * 
 * ========================================================================
 */

// 📦 PASSO 1: IMPORTAR AS FERRAMENTAS NECESSÁRIAS
// ================================================

// Express: Biblioteca para criar as rotas da API
const express = require('express');

// Router: Gestor de rotas que agrupa operações relacionadas
const router = express.Router();

// BCRYPT: Biblioteca para encriptar passwords
// Transforma "12345" em algo como "$2b$10$XYZ..."
const bcrypt = require('bcryptjs');

// JWT: Biblioteca para criar tokens de autenticação
// Tokens são "bilhetes" que provam que está logado
const jwt = require('jsonwebtoken');

// body, validationResult: Ferramentas para validar dados
// Verifica se email é válido, se password é forte, etc.
const { body, validationResult } = require('express-validator');

// Pool de base de dados: Conexão para fazer perguntas à base de dados
const pool = require('../config/database');

// auth: Middleware que verifica se está autenticado
// Se não está, bloqueia o acesso
const { auth } = require('../middleware/auth');


// ═══════════════════════════════════════════════════════════════════════
// ROTA 1: REGISTAR NOVO UTILIZADOR (CRIAR CONTA)
// ═══════════════════════════════════════════════════════════════════════
// 
// Enderço: POST /api/auth/register
// 
// O que faz:
// Cria uma nova conta para um utilizador na plataforma.
// Depois de registado, o utilizador consegue fazer login.
// 
// Dados necessários:
// - nome: Nome completo (OBRIGATÓRIO)
// - email: Email único (OBRIGATÓRIO, deve ser email válido)
// - password: Password secreta (OBRIGATÓRIO, mínimo 6 caracteres)
// - tipo: O tipo de utilizador (OBRIGATÓRIO)
//   * "aluno" - Um estudante
//   * "professor" - Um docente
//   * "bibliotecario" - Administrador da biblioteca
// 
// Validações:
// 1. Verifica se o nome não está vazio
// 2. Verifica se o email é válido (formato de email)
// 3. Verifica se a password tem pelo menos 6 caracteres
// 4. Verifica se o tipo é um dos valores permitidos
// 5. Verifica se o email não já está registado
// 
// SEGURANÇA: PÚBLICO - qualquer pessoa consegue registar
// 
router.post('/register', [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Password deve ter pelo menos 6 caracteres'),
  body('tipo').isIn(['aluno', 'professor', 'bibliotecario']).withMessage('Tipo de utilizador inválido')
], async (req, res) => {
  try {
    // 🔍 VERIFICAR VALIDAÇÕES
    // ======================
    // O express-validator faz as verificações e retorna os erros
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Se há erros de validação, devolver lista
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 📥 EXTRAIR DADOS DO PEDIDO
    // ==========================
    const { nome, email, password, tipo } = req.body;

    // ✅ PASSO 1: VERIFICAR SE O EMAIL JÁ EXISTE
    // =========================================
    // Emails devem ser únicos (cada utilizador tem um email diferente)
    const [existingUser] = await pool.query('SELECT id_utilizador FROM utilizadores WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Este email já está registado'
      });
    }

    // ✅ PASSO 2: ENCRIPTAR A PASSWORD
    // ==============================
    // Transformar a password num "código ilegível"
    // Exemplo: "123456" vira "$2b$10$XYZ..."
    // Importante: NUNCA guardamos a password original na base de dados!
    const hashedPassword = await bcrypt.hash(password, 10);
    // O "10" é o "custo" da encriptação (mais alto = mais seguro mas mais lento)

    // ✅ PASSO 3: INSERIR O UTILIZADOR NA BASE DE DADOS
    // ================================================
    const [result] = await pool.query(
      'INSERT INTO utilizadores (nome, email, password_hash, tipo) VALUES (?, ?, ?, ?)',
      [nome, email, hashedPassword, tipo]
    );

    // ✅ PASSO 4: CRIAR TOKEN JWT
    // ==========================
    // Gerar um "token" (bilhete de autenticação) que o utilizador pode usar
    // Este token contém o ID, email e tipo do utilizador
    // O token expira após o tempo definido em JWT_EXPIRE
    const token = jwt.sign(
      { id: result.insertId, email, tipo },
      process.env.JWT_SECRET,          // Chave secreta do servidor
      { expiresIn: process.env.JWT_EXPIRE }  // Tempo de expiração
    );

    // ✅ RESPOSTA DE SUCESSO
    // =======================
    res.status(201).json({
      success: true,
      message: 'Utilizador registado com sucesso',
      data: {
        token,                           // O token para futuros pedidos
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


// ═══════════════════════════════════════════════════════════════════════
// ROTA 2: FAZER LOGIN (ENTRAR NA CONTA)
// ═══════════════════════════════════════════════════════════════════════
// 
// Enderço: POST /api/auth/login
// 
// O que faz:
// Verifica as credenciais (email e password) e, se forem corretos,
// retorna um token que o utilizador pode usar para fazer pedidos.
// 
// Dados necessários:
// - email: O seu email (OBRIGATÓRIO)
// - password: A sua password (OBRIGATÓRIO)
// 
// Validações:
// 1. Verifica se o email é válido (formato)
// 2. Verifica se a password não está vazia
// 
// Fluxo:
// 1. Procurar o utilizador na base de dados pelo email
// 2. Verificar se a password introduzida corresponde à guardada
// 3. Se for correto, gerar um token JWT
// 4. Retornar o token e dados do utilizador
// 
// SEGURANÇA: PÚBLICO - qualquer pessoa consegue fazer login
// 
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Password é obrigatória')
], async (req, res) => {
  try {
    // 🔍 VERIFICAR VALIDAÇÕES
    // ======================
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 📥 EXTRAIR DADOS DO PEDIDO
    // ==========================
    const { email, password } = req.body;

    // ✅ PASSO 1: PROCURAR O UTILIZADOR
    // ================================
    // Fazer uma pergunta à base de dados: "Há alguém com este email?"
    const [users] = await pool.query(
      'SELECT id_utilizador, nome, email, password_hash, tipo FROM utilizadores WHERE email = ?',
      [email]
    );

    // Se não encontrou ninguém com este email:
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou password incorretos'
      });
    }

    const user = users[0];

    // ✅ PASSO 2: VERIFICAR A PASSWORD
    // ==============================
    // Comparar a password introduzida com a guardada na base de dados
    // bcrypt.compare faz uma comparação segura:
    // - A password introduzida é encriptada
    // - Compara com a versão encriptada guardada
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou password incorretos'
      });
    }

    // ✅ PASSO 3: CRIAR TOKEN JWT
    // ==========================
    // Se a password é correta, gerar um novo token de autenticação
    const token = jwt.sign(
      { id: user.id_utilizador, email: user.email, tipo: user.tipo },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // ✅ RESPOSTA DE SUCESSO
    // =======================
    res.json({
      success: true,
      message: 'Login efetuado com sucesso',
      data: {
        token,                           // O token para futuros pedidos
        user: {
          id: user.id_utilizador,
          nome: user.nome,
          email: user.email,
          tipo: user.tipo
        }
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


// ═══════════════════════════════════════════════════════════════════════
// ROTA 3: VER DADOS DO UTILIZADOR ATUAL (MINHA CONTA)
// ═══════════════════════════════════════════════════════════════════════
// 
// Enderço: GET /api/auth/me
// 
// O que faz:
// Mostra os dados do utilizador que está logado neste momento.
// É como consultar "a minha conta".
// 
// Informações retornadas:
// - ID, Nome, Email, Tipo (aluno/professor/bibliotecário)
// - Data de criação da conta
// 
// SEGURANÇA: Requer autenticação (estar logado)
// Usa o middleware "auth" que verifica o token JWT
// 
router.get('/me', auth, async (req, res) => {
  try {
    // 📊 BUSCAR OS DADOS DO UTILIZADOR AUTENTICADO
    // ===========================================
    // req.user.id vem do token JWT (foi extraído e verificado pelo middleware auth)
    const [users] = await pool.query(
      'SELECT id_utilizador, nome, email, tipo, data_criacao FROM utilizadores WHERE id_utilizador = ?',
      [req.user.id]
    );
    
    // Se não encontrou (isto não deveria acontecer, mas é proteção):
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    const user = users[0];

    // ✅ RESPOSTA DE SUCESSO
    // =======================
    res.json({
      success: true,
      data: {
        id: user.id_utilizador,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo,
        data_criacao: user.data_criacao
      }
    });
  } catch (error) {
    console.error('Erro ao obter utilizador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter dados do utilizador'
    });
  }
});


// ═══════════════════════════════════════════════════════════════════════
// ROTA 4: ALTERAR A PASSWORD
// ═══════════════════════════════════════════════════════════════════════
// 
// Enderço: PUT /api/auth/update-password
// 
// O que faz:
// Permite que o utilizador mude a sua password.
// Para segurança, é necessário fornecer a password atual.
// 
// Dados necessários:
// - currentPassword: A sua password atual (OBRIGATÓRIO)
// - newPassword: A nova password (OBRIGATÓRIO, mínimo 6 caracteres)
// 
// Validações:
// 1. Verifica se a password atual foi fornecida
// 2. Verifica se a nova password tem pelo menos 6 caracteres
// 3. Verifica se a password atual é correta
// 
// SEGURANÇA: Requer autenticação (estar logado)
// 
router.put('/update-password', auth, [
  body('currentPassword').notEmpty().withMessage('Password atual é obrigatória'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nova password deve ter pelo menos 6 caracteres')
], async (req, res) => {
  try {
    // 🔍 VERIFICAR VALIDAÇÕES
    // ======================
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 📥 EXTRAIR DADOS DO PEDIDO
    // ==========================
    const { currentPassword, newPassword } = req.body;

    // ✅ PASSO 1: OBTER A PASSWORD ATUAL DO UTILIZADOR
    // ==============================================
    const [users] = await pool.query(
      'SELECT password_hash FROM utilizadores WHERE id_utilizador = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    // ✅ PASSO 2: VERIFICAR SE A PASSWORD ATUAL É CORRETA
    // ================================================
    // Para segurança, só deixamos mudar a password se souber a atual
    const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password atual incorreta'
      });
    }

    // ✅ PASSO 3: ENCRIPTAR A NOVA PASSWORD
    // ====================================
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // ✅ PASSO 4: ATUALIZAR NA BASE DE DADOS
    // ====================================
    await pool.query(
      'UPDATE utilizadores SET password_hash = ? WHERE id_utilizador = ?',
      [hashedPassword, req.user.id]
    );

    // ✅ RESPOSTA DE SUCESSO
    // =======================
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


// ═══════════════════════════════════════════════════════════════════════
// ROTA 5: ATUALIZAR PERFIL (NOME E EMAIL)
// ═══════════════════════════════════════════════════════════════════════
// 
// Enderço: PUT /api/auth/update-profile
// 
// O que faz:
// Permite que o utilizador mude o seu nome, email ou password.
// Todos os campos são OPCIONAIS.
// 
// Dados (todos opcionais):
// - nome: Novo nome (opcional)
// - email: Novo email (opcional)
// - password: Nova password (opcional)
// 
// Validações:
// 1. Se forneceu nome, verifica se não está vazio
// 2. Se forneceu email, verifica se é um email válido
// 3. Se forneceu password, verifica se tem pelo menos 6 caracteres
// 4. Se alterou email, verifica se o novo email não já existe
// 5. Regenera um novo token com os dados atualizados
// 
// SEGURANÇA: Requer autenticação (estar logado)
// 
router.put('/update-profile', auth, [
  body('nome').optional().trim().notEmpty().withMessage('Nome não pode estar vazio'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password deve ter pelo menos 6 caracteres')
], async (req, res) => {
  try {
    // 🔍 VERIFICAR VALIDAÇÕES
    // ======================
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 📥 EXTRAIR DADOS DO PEDIDO
    // ==========================
    const { nome, email, password } = req.body;

    // ✅ PASSO 1: VERIFICAR SE O UTILIZADOR EXISTE
    // ==========================================
    const [users] = await pool.query(
      'SELECT id_utilizador, nome, email, tipo, password_hash FROM utilizadores WHERE id_utilizador = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    const user = users[0];

    // ✅ PASSO 2: VERIFICAR SE O EMAIL JÁ EXISTE (SE FOI ALTERADO)
    // ========================================================
    // Se forneceu um novo email e é diferente do atual:
    if (email && email !== user.email) {
      // Verificar se já existe outro utilizador com este email
      const [existingUser] = await pool.query(
        'SELECT id_utilizador FROM utilizadores WHERE email = ? AND id_utilizador != ?',
        [email, req.user.id]
      );
      
      if (existingUser.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Este email já está registado'
        });
      }
    }

    // ✅ PASSO 3: PREPARAR OS CAMPOS A ATUALIZAR
    // ========================================
    // Construir dinamicamente a query UPDATE com apenas os campos alterados
    const updateFields = [];
    const updateValues = [];

    // Se forneceu novo nome:
    if (nome) {
      updateFields.push('nome = ?');
      updateValues.push(nome);
    }

    // Se forneceu novo email:
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    // Se forneceu nova password:
    if (password) {
      // Encriptar antes de guardar
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password_hash = ?');
      updateValues.push(hashedPassword);
    }

    // Se não há nada a atualizar:
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum campo a atualizar'
      });
    }

    // ✅ PASSO 4: EXECUTAR A ATUALIZAÇÃO
    // ================================
    // Adicionar o ID do utilizador aos valores
    updateValues.push(req.user.id);

    // Construir e executar a query dinamicamente
    await pool.query(
      `UPDATE utilizadores SET ${updateFields.join(', ')} WHERE id_utilizador = ?`,
      updateValues
    );

    // ✅ PASSO 5: BUSCAR E RETORNAR OS DADOS ATUALIZADOS
    // ================================================
    const [updatedUsers] = await pool.query(
      'SELECT id_utilizador, nome, email, tipo FROM utilizadores WHERE id_utilizador = ?',
      [req.user.id]
    );

    const updatedUser = updatedUsers[0];

    // ✅ PASSO 6: GERAR NOVO TOKEN
    // ==========================
    // Se os dados foram alterados (especialmente email), gerar um novo token
    // para que o cliente possa usar a partir de agora
    const token = jwt.sign(
      { id: updatedUser.id_utilizador, email: updatedUser.email, tipo: updatedUser.tipo },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // ✅ RESPOSTA DE SUCESSO
    // =======================
    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: {
        token,                               // Novo token com dados atualizados
        user: {
          id: updatedUser.id_utilizador,
          nome: updatedUser.nome,
          email: updatedUser.email,
          tipo: updatedUser.tipo
        }
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil'
    });
  }
});


// ═══════════════════════════════════════════════════════════════════════
// ROTA 6: ELIMINAR CONTA (APAGAR UTILIZADOR)
// ═══════════════════════════════════════════════════════════════════════
// 
// Enderço: DELETE /api/auth/delete-account
// 
// O que faz:
// Permite que o utilizador elimine permanentemente a sua conta.
// Esta ação é irreversível!
// 
// Dados necessários:
// - password: A sua password atual (para confirmar que quer eliminar)
// 
// Validações:
// 1. Verifica se a password foi fornecida
// 2. Verifica se a password é correta
// 3. Verifica se há registos associados à conta
//    (ex: empréstimos, reservas) que impediriam a eliminação
// 
// IMPORTANTE:
// Se o utilizador tem dados associados (empréstimos ativos, etc.),
// a eliminação será bloqueada por CONSTRAINT de chave estrangeira.
// Isto é uma proteção: não queremos perder dados!
// 
// SEGURANÇA: Requer autenticação (estar logado)
// 
router.delete('/delete-account', auth, [
  body('password').notEmpty().withMessage('Password é obrigatória para confirmar eliminação')
], async (req, res) => {
  try {
    // 🔍 VERIFICAR VALIDAÇÕES
    // ======================
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 📥 EXTRAIR DADOS DO PEDIDO
    // ==========================
    const { password } = req.body;

    // ✅ PASSO 1: VALIDAR SE O UTILIZADOR EXISTE
    // ========================================
    const [users] = await pool.query(
      'SELECT id_utilizador, password_hash FROM utilizadores WHERE id_utilizador = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    // ✅ PASSO 2: VERIFICAR A PASSWORD PARA CONFIRMAR
    // ==============================================
    // Para segurança, pedimos a password para confirmar que quer eliminar
    // (isto evita eliminações acidentais se alguém roubar a sessão)
    const isMatch = await bcrypt.compare(password, users[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password incorreta'
      });
    }

    // ✅ PASSO 3: ELIMINAR O UTILIZADOR
    // ===============================
    await pool.query(
      'DELETE FROM utilizadores WHERE id_utilizador = ?',
      [req.user.id]
    );

    // ✅ RESPOSTA DE SUCESSO
    // =======================
    res.json({
      success: true,
      message: 'Conta eliminada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao eliminar conta:', error);
    
    // 🚨 TRATAMENTO DE ERRO ESPECIAL
    // =============================
    // Se o erro é um "constraint" (restrição de chave estrangeira):
    // significa que há dados associados à conta que impedem a eliminação
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível eliminar a conta. Existem registos associados (empréstimos, reservas, etc.)'
      });
    }
    
    // Para qualquer outro erro:
    res.status(500).json({
      success: false,
      message: 'Erro ao eliminar conta'
    });
  }
});

// 📤 EXPORTAR AS ROTAS
// ====================
// Isto permite que o ficheiro server.js use estas rotas
module.exports = router;