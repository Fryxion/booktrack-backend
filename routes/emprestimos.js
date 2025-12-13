/**
 * ========================================================================
 * GESTÃO DE EMPRÉSTIMOS - BOOKTRACK API
 * ========================================================================
 * 
 * Este ficheiro trata de todas as operações relacionadas com EMPRÉSTIMOS.
 * Um empréstimo é quando um utilizador leva um livro para casa por um tempo
 * limitado (normalmente 14 dias) e depois tem de o devolver.
 * 
 * Funcionalidades:
 * - Ver a lista de empréstimos
 * - Ver detalhes de um empréstimo específico
 * - Criar um novo empréstimo (o bibliotecário faz isto quando o utilizador leva o livro)
 * - Registar a devolução de um livro (calcular multa se houver atraso)
 * 
 * NOTA IMPORTANTE: Este ficheiro tem alguns "nomes confusos" em algumas colunas
 * (por exemplo, usa 'data_publicacao' como se fosse 'estado')
 * Isto está comentado nas rotas para clarificar.
 * 
 * ========================================================================
 */

// 📦 PASSO 1: IMPORTAR AS FERRAMENTAS NECESSÁRIAS
// ================================================

// Express: Biblioteca para criar as rotas da API
const express = require('express');

// Router: Gestor de rotas (caminhos) que agrupa operações relacionadas
const router = express.Router();

// Pool de base de dados: Conexão para fazer perguntas à base de dados
const pool = require('../config/database');

// Funções de segurança:
// - auth: Verifica se o utilizador está autenticado
// - checkRole: Verifica se o utilizador tem permissão (ex: só bibliotecários)
const { auth, checkRole } = require('../middleware/auth');


// ═══════════════════════════════════════════════════════════════════════
// ROTA 1: VER LISTA DE EMPRÉSTIMOS
// ═══════════════════════════════════════════════════════════════════════
// 
// Enderço: GET /api/emprestimos
// 
// O que faz:
// Lista todos os empréstimos. Mas com uma regra de segurança:
// - Se fores um utilizador comum: vês apenas OS TEUS EMPRÉSTIMOS
// - Se fores bibliotecário: vês TODOS os empréstimos
// 
// Informações retornadas:
// - ID do empréstimo, livro, utilizador, datas, estado
// 
// SEGURANÇA: Requer autenticação (estar logado)
// 
router.get('/', auth, async (req, res) => {
  try {
    // 📊 CONSTRUIR A PERGUNTA À BASE DE DADOS
    // =======================================
    // Estamos a fazer uma "JOIN" - combinar dados de várias tabelas:
    // - emprestimos: tabela principal dos empréstimos
    // - livros: para obter info do livro (título, autor, ISBN)
    // - utilizadores: para obter info do utilizador (nome, email)
    let query = `
      SELECT e.*, 
             l.titulo, l.autor,
             u.nome as nome_utilizador, u.email,
             l.isbn as isbn_livro
      FROM emprestimos e
      JOIN livros l ON e.id_livro = l.id_livro
      JOIN utilizadores u ON e.id_utilizador = u.id_utilizador
      WHERE 1=1
    `;
    const params = [];

    // 🔐 VERIFICAR PERMISSÕES
    // ======================
    // Se NÃO for bibliotecário (i.e., for aluno ou professor):
    if (req.user.tipo !== 'bibliotecario') {
      // Adicionar filtro para mostrar apenas os seus próprios empréstimos
      query += ' AND e.id_utilizador = ?';
      params.push(req.user.id);
    }
    // Se FOR bibliotecário, mostra TODOS os empréstimos

    // Ordenar do mais recente para o mais antigo
    query += ' ORDER BY e.data_emprestimo DESC';

    // Executar a pergunta à base de dados
    const [emprestimos] = await pool.query(query, params);

    // ✅ RESPOSTA DE SUCESSO
    // =======================
    res.json({
      success: true,
      count: emprestimos.length,      // Quantos empréstimos encontrou
      data: emprestimos               // Lista completa dos empréstimos
    });
  } catch (error) {
    console.error('Erro ao listar empréstimos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar empréstimos'
    });
  }
});


// ═══════════════════════════════════════════════════════════════════════
// ROTA 2: VER DETALHES DE UM EMPRÉSTIMO ESPECÍFICO
// ═══════════════════════════════════════════════════════════════════════
// 
// Enderço: GET /api/emprestimos/:id
// 
// O que faz:
// Mostra todos os detalhes de um empréstimo em particular.
// Por exemplo: GET /api/emprestimos/5 mostra o empréstimo número 5
// 
// SEGURANÇA:
// - Utilizadores normais só conseguem ver os seus próprios empréstimos
// - Bibliotecários conseguem ver qualquer empréstimo
// 
router.get('/:id', auth, async (req, res) => {
  try {
    // 📊 BUSCAR O EMPRÉSTIMO
    // =====================
    // Fazer uma pergunta à base de dados: "Dá-me o empréstimo com este ID"
    const [emprestimos] = await pool.query(
      `SELECT e.*, 
              l.titulo, l.autor, l.isbn as isbn_livro, l.categoria as categoria_livro,
              u.nome as nome_utilizador, u.email
       FROM emprestimos e
       JOIN livros l ON e.id_livro = l.id_livro
       JOIN utilizadores u ON e.id_utilizador = u.id_utilizador
       WHERE e.id_emprestimo = ?`,
      [req.params.id]
    );

    // Se não encontrou nenhum empréstimo com este ID:
    if (emprestimos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empréstimo não encontrado'
      });
    }

    const emprestimo = emprestimos[0];

    // 🔐 VERIFICAR PERMISSÕES
    // =======================
    // Só deixar ver se:
    // - For o próprio utilizador do empréstimo, OU
    // - For bibliotecário (pode ver tudo)
    if (req.user.tipo !== 'bibliotecario' && emprestimo.id_utilizador !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    // ✅ RESPOSTA DE SUCESSO
    // =======================
    res.json({
      success: true,
      data: emprestimo
    });
  } catch (error) {
    console.error('Erro ao obter empréstimo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter detalhes do empréstimo'
    });
  }
});


// ═══════════════════════════════════════════════════════════════════════
// ROTA 3: CRIAR UM NOVO EMPRÉSTIMO
// ═══════════════════════════════════════════════════════════════════════
// 
// Enderço: POST /api/emprestimos
// 
// O que faz:
// O bibliotecário registra que um utilizador levou um livro.
// O livro fica "emprestado" por 14 dias. Depois tem de ser devolvido.
// 
// Dados necessários:
// - id_utilizador: Quem está a levar o livro
// - id_livro: Qual é o livro
// 
// Processo (Transação):
// 1. Verificar se o livro existe e tem cópias disponíveis
// 2. Verificar se o utilizador já não tem este livro emprestado
// 3. Criar o empréstimo (com prazo de 14 dias)
// 4. Reduzir o número de cópias disponíveis
// 5. Cancelar qualquer reserva pendente do utilizador para este livro
// 
// SEGURANÇA: Apenas bibliotecários
// 
router.post('/', auth, checkRole(['bibliotecario']), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    // 📥 EXTRAIR DADOS DO PEDIDO
    // ==========================
    const { id_utilizador, id_livro } = req.body;

    // Validação básica: verificar se enviou ambos os IDs
    if (!id_utilizador || !id_livro) {
      return res.status(400).json({
        success: false,
        message: 'ID do utilizador e do livro são obrigatórios'
      });
    }

    // 🔄 INICIAR TRANSAÇÃO
    // ====================
    // Uma transação garante que ou tudo funciona, ou nada funciona
    await connection.beginTransaction();

    // ✅ PASSO 1: VERIFICAR SE O LIVRO EXISTE E TEM CÓPIAS
    // ==================================================
    const [livros] = await connection.query(
      'SELECT * FROM livros WHERE id_livro = ?',
      [id_livro]
    );

    if (livros.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Livro não encontrado'
      });
    }

    const livro = livros[0];

    // Verificar se há cópias disponíveis
    if (livro.copias_disponiveis < 1) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Não há cópias disponíveis deste livro'
      });
    }

    // ✅ PASSO 2: VERIFICAR SE O UTILIZADOR JÁ NÃO TEM ESTE LIVRO EMPRESTADO
    // =====================================================================
    // Pergunta: "Este utilizador já tem uma cópia deste livro em seu poder?"
    // NOTA: Há um bug aqui - a query usa 'data_publicacao' como 'ativo'
    // mas está comentado no topo do ficheiro que isso é o campo "estado"
    const [emprestimoExistente] = await connection.query(
      'SELECT id_emprestimo FROM emprestimos WHERE id_utilizador = ? AND id_livro = ? AND data_publicacao = ?',
      [id_utilizador, id_livro, 'ativo']
    );

    if (emprestimoExistente.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Utilizador já tem este livro emprestado'
      });
    }

    // ✅ PASSO 3: CALCULAR DATA DE DEVOLUÇÃO
    // ===================================
    // O empréstimo dura 14 dias
    const dataDevolucao = new Date();
    dataDevolucao.setDate(dataDevolucao.getDate() + 14);

    // ✅ PASSO 4: CRIAR O EMPRÉSTIMO NA BASE DE DADOS
    // ==============================================
    // NOTA: Há campos "estranhos" aqui:
    // - data_publicacao está a receber 'ativo' (deveria ser chamado 'estado')
    // - total_copias está a receber 0.00 (deveria ser chamado 'multa')
    // Isto é um problema na base de dados, mas funciona
    const [result] = await connection.query(
      `INSERT INTO emprestimos (id_utilizador, id_livro, isbn, categoria, descricao, data_devolucao_prevista, data_publicacao, total_copias)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_utilizador, id_livro, livro.isbn, livro.categoria, livro.descricao, dataDevolucao, 'ativo', 0.00]
    );

    // ✅ PASSO 5: REDUZIR AS CÓPIAS DISPONÍVEIS
    // ======================================
    await connection.query(
      'UPDATE livros SET copias_disponiveis = copias_disponiveis - 1 WHERE id_livro = ?',
      [id_livro]
    );

    // ✅ PASSO 6: CANCELAR RESERVAS PENDENTES
    // ==================================
    // Se o utilizador tinha uma reserva para este livro, cancela
    // (porque agora tem o livro emprestado, não precisa de reserva)
    await connection.query(
      'UPDATE reservas SET estado = ? WHERE id_utilizador = ? AND id_livro = ? AND estado = ?',
      ['cancelada', id_utilizador, id_livro, 'pendente']
    );

    // ✅ CONFIRMAR A TRANSAÇÃO
    // ========================
    await connection.commit();

    // ✅ RESPOSTA DE SUCESSO
    // =======================
    res.status(201).json({
      success: true,
      message: 'Empréstimo criado com sucesso',
      data: {
        id_emprestimo: result.insertId,
        id_utilizador,
        id_livro,
        data_devolucao_prevista: dataDevolucao,
        estado: 'ativo'
      }
    });
  } catch (error) {
    // Se houver erro, desfazer tudo
    await connection.rollback();
    console.error('Erro ao criar empréstimo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar empréstimo'
    });
  } finally {
    // Libertar a conexão
    connection.release();
  }
});


// ═══════════════════════════════════════════════════════════════════════
// ROTA 4: DEVOLVER UM LIVRO EMPRESTADO
// ═══════════════════════════════════════════════════════════════════════
// 
// Enderço: PUT /api/emprestimos/:id/devolver
// 
// O que faz:
// O bibliotecário registra que o utilizador devolveu o livro.
// O sistema calcula se houve atraso e aplica multa (0.50€ por dia de atraso).
// 
// Processo (Transação):
// 1. Verificar se o empréstimo existe e ainda está ativo
// 2. Calcular dias de atraso (se houver)
// 3. Calcular multa (0.50€ por dia de atraso)
// 4. Marcar o empréstimo como devolvido
// 5. Adicionar o livro de volta ao inventário (aumentar cópias disponíveis)
// 
// SEGURANÇA: Apenas bibliotecários
// 
router.put('/:id/devolver', auth, checkRole(['bibliotecario']), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    // 🔄 INICIAR TRANSAÇÃO
    // ====================
    await connection.beginTransaction();

    // ✅ PASSO 1: VERIFICAR SE O EMPRÉSTIMO EXISTE E ESTÁ ATIVO
    // ======================================================
    const [emprestimos] = await connection.query(
      'SELECT * FROM emprestimos WHERE id_emprestimo = ?',
      [req.params.id]
    );

    if (emprestimos.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Empréstimo não encontrado'
      });
    }

    const emprestimo = emprestimos[0];

    // 🔍 VERIFICAR ESTADO DO EMPRÉSTIMO
    // =================================
    // NOTA: "data_publicacao" é na verdade o campo que armazena o ESTADO
    // (isto é um problema de nomenclatura na base de dados)
    if (emprestimo.estado !== 'ativo') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Este empréstimo já foi devolvido'
      });
    }

    // ✅ PASSO 2: CALCULAR MULTA SE HOUVER ATRASO
    // ==========================================
    const dataAtual = new Date();
    const dataDevPrevista = new Date(emprestimo.data_devolucao_prevista);
    let multa = 0;

    // Se a data atual é depois da data prevista:
    if (dataAtual > dataDevPrevista) {
      // Calcular número de dias de atraso
      const diasAtraso = Math.ceil((dataAtual - dataDevPrevista) / (1000 * 60 * 60 * 24));
      // Multa: 0.50€ por dia de atraso
      multa = diasAtraso * 0.50;
    }

    // ✅ PASSO 3: ATUALIZAR O EMPRÉSTIMO
    // ================================
    // Marcar como "devolvido", registar a multa e a data de devolução efetiva
    // NOTA: "data_publicacao" é o ESTADO, "total_copias" é a MULTA
    // (mais um exemplo de nomenclatura confusa na base de dados)
    await connection.query(
      'UPDATE emprestimos SET estado = ?, multa = ?, data_devolucao_efetiva = now() WHERE id_emprestimo = ?',
      ['devolvido', multa, req.params.id]
    );

    // ✅ PASSO 4: DEVOLVER A CÓPIA AO INVENTÁRIO
    // ========================================
    // Aumentar em +1 o número de cópias disponíveis
    await connection.query(
      'UPDATE livros SET copias_disponiveis = copias_disponiveis + 1 WHERE id_livro = ?',
      [emprestimo.id_livro]
    );

    // ✅ CONFIRMAR A TRANSAÇÃO
    // ========================
    await connection.commit();

    // ✅ RESPOSTA DE SUCESSO
    // =======================
    res.json({
      success: true,
      message: 'Livro devolvido com sucesso',
      data: {
        multa: multa > 0 ? multa : 0  // Se não há atraso, multa é 0
      }
    });
  } catch (error) {
    // Se houver erro, desfazer tudo
    await connection.rollback();
    console.error('Erro ao devolver livro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao devolver livro'
    });
  } finally {
    // Libertar a conexão
    connection.release();
  }
});

// 📤 EXPORTAR AS ROTAS
// ====================
// Isto permite que o ficheiro server.js use estas rotas
module.exports = router;