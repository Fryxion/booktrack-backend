/**
 * ========================================================================
 * GESTÃO DE UTILIZADORES - BOOKTRACK API
 * ========================================================================
 * 
 * Este ficheiro trata de todas as operações relacionadas com utilizadores.
 * Define os "caminhos" (rotas) que o servidor pode usar para:
 * - Ver a lista de todos os utilizadores
 * - Alterar o tipo/papel de um utilizador (aluno, professor, bibliotecário)
 * 
 * IMPORTANTE: Algumas operações só podem ser feitas por bibliotecários
 * (o "administrador" da biblioteca)
 * 
 * ========================================================================
 */

// 📦 PASSO 1: IMPORTAR AS FERRAMENTAS NECESSÁRIAS
// ================================================

// Express: A biblioteca que cria as rotas (caminhos) da API
const express = require('express');

// Router: Uma ferramenta do Express que ajuda a organizar as rotas
// Pensa nisto como um "gestor de caminhos" que agrupa rotas relacionadas
const router = express.Router();

// Pool de base de dados: A conexão com a base de dados
// Permite-nos fazer perguntas (queries) à base de dados para obter ou modificar dados
const pool = require('../config/database');

// Importar duas funções de segurança:
// - auth: Verifica se o utilizador está autenticado (fez login)
// - checkRole: Verifica se o utilizador tem permissão para fazer a ação
//              (por exemplo, apenas bibliotecários podem ver todos os utilizadores)
const { auth, checkRole } = require('../middleware/auth');


// ═══════════════════════════════════════════════════════════════════════
// ROTA 1: VER LISTA DE TODOS OS UTILIZADORES
// ═══════════════════════════════════════════════════════════════════════
// 
// Enderço: GET /api/utilizadores
// 
// O que faz:
// Mostra uma lista completa com todos os utilizadores da biblioteca
// com informações como: ID, Nome, Email, Tipo (aluno/professor/bibliotecario)
// e a data em que se registaram
// 
// SEGURANÇA: Apenas bibliotecários têm permissão para ver isto!
// 
// Explicação dos "middlewares" de segurança:
// - auth: Verifica se a pessoa está autenticada (fez login)
// - checkRole(['bibliotecario']): Verifica se é bibliotecário
// 
router.get('/', auth, checkRole(['bibliotecario']), async (req, res) => {
  // TRY: Tentar executar o código. Se houver erro, apanha-o
  try {
    // 📊 BUSCAR DADOS DA BASE DE DADOS
    // ================================
    // Estamos a fazer uma pergunta à base de dados:
    // "Dá-me a lista de todos os utilizadores com os campos que peço"
    // 
    // Campos que pedimos:
    // - id_utilizador: Número único que identifica cada utilizador
    // - nome: O nome completo do utilizador
    // - email: O email do utilizador
    // - tipo: Se é aluno, professor ou bibliotecário
    // - data_criacao: Quando se registou
    //
    // ORDER BY data_criacao DESC: Ordena do mais recente para o mais antigo
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

    // ✅ RESPOSTA DE SUCESSO
    // =======================
    // Enviar de volta a lista de utilizadores em formato JSON (estruturado)
    res.json({
      success: true,           // Indica que tudo correu bem
      data: utilizadores       // A lista completa de utilizadores
    });
  } 
  // CATCH: Se houver algum erro acima, este código executa
  catch (error) {
    // 🚨 ERRO: Algo correu mal!
    // =========================
    
    // Registar o erro no console para o programador ver e corrigir
    console.error('Erro ao listar utilizadores:', error);
    
    // Enviar uma mensagem de erro ao cliente
    // Status 500 = "Erro no servidor" (não foi culpa da pessoa, foi nosso)
    res.status(500).json({
      success: false,              // Indica que algo correu mal
      message: 'Erro ao listar utilizadores'  // Mensagem explicando o erro
    });
  }
});


// ═══════════════════════════════════════════════════════════════════════
// ROTA 2: ALTERAR O TIPO DE UM UTILIZADOR
// ═══════════════════════════════════════════════════════════════════════
// 
// Enderço: PUT /api/utilizadores/:id/tipo
// 
// O que faz:
// Permite ao bibliotecário mudar o tipo de um utilizador.
// Por exemplo: passar um aluno para professor, ou vice-versa.
// 
// Tipos de utilizador disponíveis:
// - aluno: Um estudante que usa a biblioteca
// - professor: Um professor que usa a biblioteca
// - bibliotecario: Administrador da biblioteca
// 
// SEGURANÇA: Apenas bibliotecários podem fazer isto!
// 
// Como chamar:
// PUT /api/utilizadores/123/tipo
// Com um "corpo" (body) contendo: { "tipo": "professor" }
// 
router.put('/:id/tipo', auth, checkRole(['bibliotecario']), async (req, res) => {
  // EXTRAIR DADOS DO PEDIDO
  // =======================
  // :id é o número do utilizador que queremos alterar (vem no URL)
  const { id } = req.params;
  
  // tipo é o novo tipo que queremos atribuir (vem no corpo do pedido)
  const { tipo } = req.body;
  
  try {
    // 🔍 PASSO 1: VALIDAR O TIPO ENVIADO
    // ===================================
    // Verificar se o tipo que o cliente enviou é válido
    // Só aceitamos estes três tipos:
    const tiposValidos = ['aluno', 'professor', 'bibliotecario'];
    
    // Se o tipo enviado NÃO está na lista de válidos:
    if (!tiposValidos.includes(tipo)) {
      // Enviar erro 400 = "Pedido inválido"
      return res.status(400).json({
        success: false,              // Falha
        message: 'Tipo inválido. Deve ser: aluno, professor ou bibliotecario'  // Explicar qual é o problema
      });
    }
    
    // 🔍 PASSO 2: VERIFICAR SE O UTILIZADOR EXISTE
    // =============================================
    // Antes de alterar nada, precisamos confirmar que este utilizador existe na base de dados
    const [utilizador] = await pool.query(
      'SELECT id_utilizador FROM utilizadores WHERE id_utilizador = ?',
      [id]
    );
    
    // Se a base de dados não encontrou nenhum utilizador com este ID:
    if (utilizador.length === 0) {
      // Enviar erro 404 = "Não encontrado"
      return res.status(404).json({
        success: false,              // Falha
        message: 'Utilizador não encontrado'  // O utilizador não existe
      });
    }
    
    // ✏️ PASSO 3: ATUALIZAR O TIPO NA BASE DE DADOS
    // =============================================
    // Agora que validamos tudo, podemos atualizar o tipo deste utilizador
    // UPDATE significa: alterar dados que já existem
    await pool.query(
      'UPDATE utilizadores SET tipo = ? WHERE id_utilizador = ?',
      [tipo, id]  // O novo tipo e o ID do utilizador a alterar
    );
    
    // ✅ RESPOSTA DE SUCESSO
    // ======================
    // Tudo correu bem! Enviar confirmação
    res.json({
      success: true,                                      // Sucesso!
      message: 'Tipo de utilizador atualizado com sucesso'  // Confirmação
    });
  } 
  // CATCH: Se houver algum erro acima, este código executa
  catch (error) {
    // 🚨 ERRO: Algo correu mal!
    // ============================
    
    // Registar o erro no console para o programador ver e corrigir
    console.error('Erro ao atualizar tipo de utilizador:', error);
    
    // Enviar uma mensagem de erro ao cliente
    // Status 500 = "Erro no servidor"
    res.status(500).json({
      success: false,                          // Falha
      message: 'Erro ao atualizar tipo de utilizador'  // Descrição do erro
    });
  }
});

// 📤 EXPORTAR AS ROTAS
// ====================
// Isto permite que outros ficheiros (como server.js) usem estas rotas
// Sem esta linha, o resto da aplicação não conseguiria aceder a estas funções
module.exports = router;