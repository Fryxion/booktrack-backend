/**
 * ========================================================================
 * GESTÃO DE LIVROS - BOOKTRACK API
 * ========================================================================
 * 
 * Este ficheiro trata de todas as operações relacionadas com LIVROS.
 * Os livros são o "coração" da biblioteca - aqui é onde se definem
 * todos os detalhes dos livros que a biblioteca tem.
 * 
 * Funcionalidades:
 * - Ver a lista de livros (com filtros)
 * - Ver categorias disponíveis
 * - Ver detalhes de um livro específico
 * - Criar um novo livro (apenas bibliotecários)
 * - Atualizar informações de um livro (apenas bibliotecários)
 * - Eliminar um livro (apenas bibliotecários)
 * 
 * ========================================================================
 */

// 📦 PASSO 1: IMPORTAR AS FERRAMENTAS NECESSÁRIAS
// ================================================

// Express: Biblioteca para criar as rotas da API
const express = require('express');

// Router: Gestor de rotas (caminhos) que agrupa operações relacionadas
const router = express.Router();

// body, validationResult: Ferramentas para validar dados enviados
// Exemplo: verificar se o título não está vazio
const { body, validationResult } = require('express-validator');

// Pool de base de dados: Conexão para fazer perguntas à base de dados
const pool = require('../config/database');

// Funções de segurança:
// - auth: Verifica se o utilizador está autenticado
// - checkRole: Verifica se o utilizador tem permissão (ex: só bibliotecários)
const { auth, checkRole } = require('../middleware/auth');


// ═══════════════════════════════════════════════════════════════════════
// ROTA 1: LISTAR TODOS OS LIVROS (COM FILTROS OPCIONAIS)
// ═══════════════════════════════════════════════════════════════════════
// 
// Enderço: GET /api/livros
// 
// O que faz:
// Lista todos os livros da biblioteca. Mas permite ao utilizador
// aplicar filtros para encontrar exatamente o que precisa.
// 
// Filtros disponíveis (opcionais):
// - categoria: Filtrar por tipo de livro (ex: "Ficção Científica", "História")
// - disponivel: true/false - mostrar apenas livros disponíveis ou indisponíveis
// - pesquisa: Procurar por título ou autor (qualquer palavra que contenha)
// 
// Exemplos de chamadas:
// GET /api/livros                              (todos os livros)
// GET /api/livros?categoria=Ficção             (só ficção)
// GET /api/livros?disponivel=true              (só livros disponíveis)
// GET /api/livros?pesquisa=Harry               (livros com "Harry" no título/autor)
// 
// SEGURANÇA: PÚBLICO - qualquer pessoa consegue aceder
// 
router.get('/', async (req, res) => {
  try {
    // 🔍 EXTRAIR FILTROS DO PEDIDO
    // ===========================
    const { categoria, disponivel, pesquisa } = req.query;
    
    // 📊 CONSTRUIR A PERGUNTA À BASE DE DADOS
    // =======================================
    // Começamos com uma query básica que mostra todos os livros
    let query = 'SELECT * FROM livros WHERE 1=1';
    const params = [];

    // FILTRO 1: Por categoria
    // =====================
    // Se o utilizador pediu para filtrar por categoria:
    if (categoria) {
      query += ' AND categoria = ?';
      params.push(categoria);
    }

    // FILTRO 2: Por disponibilidade
    // ============================
    // Se o utilizador quer só livros disponíveis:
    if (disponivel === 'true') {
      query += ' AND copias_disponiveis > 0';  // Cópias disponíveis > 0
    } 
    // Se o utilizador quer só livros indisponíveis:
    else if (disponivel === 'false') {
      query += ' AND copias_disponiveis = 0';  // Zero cópias disponíveis
    }

    // FILTRO 3: Por pesquisa (título ou autor)
    // ========================================
    // Se o utilizador fez uma pesquisa:
    if (pesquisa) {
      // % significa "qualquer coisa" - por exemplo "%harry%" encontra "Harry", "harry", "HARRY"
      query += ' AND (titulo LIKE ? OR autor LIKE ?)';
      params.push(`%${pesquisa}%`, `%${pesquisa}%`);
    }

    // Ordenar alfabeticamente por título
    query += ' ORDER BY titulo';

    // Executar a pergunta à base de dados com todos os filtros
    const [livros] = await pool.query(query, params);

    // ✅ RESPOSTA DE SUCESSO
    // =======================
    res.json({
      success: true,
      count: livros.length,         // Quantos livros encontrou
      data: livros                  // Lista completa dos livros
    });
  } catch (error) {
    console.error('Erro ao listar livros:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar livros'
    });
  }
});


// ═══════════════════════════════════════════════════════════════════════
// ROTA 2: LISTAR TODAS AS CATEGORIAS
// ═══════════════════════════════════════════════════════════════════════
// 
// Enderço: GET /api/livros/categorias/list
// 
// O que faz:
// Mostra uma lista de todas as categorias únicas disponíveis.
// Útil para mostrar num dropdown (lista de seleção) quando se quer
// filtrar livros por categoria.
// 
// Exemplo de resposta:
// ["Ficção Científica", "História", "Tecnologia", "Romance"]
// 
// SEGURANÇA: PÚBLICO - qualquer pessoa consegue aceder
// 
router.get('/categorias/list', async (req, res) => {
  try {
    // 📊 BUSCAR CATEGORIAS ÚNICAS
    // ===========================
    // DISTINCT significa: mostrar cada categoria uma só vez
    // (mesmo que haja 50 livros de Ficção Científica, aparece uma só vez)
    const [categorias] = await pool.query(
      'SELECT DISTINCT categoria FROM livros WHERE categoria IS NOT NULL ORDER BY categoria'
    );

    // ✅ RESPOSTA DE SUCESSO
    // =======================
    // Transformar o resultado numa lista simples (só os nomes, sem o resto)
    res.json({
      success: true,
      count: categorias.length,                           // Quantas categorias há
      data: categorias.map(row => row.categoria)          // Lista dos nomes
    });
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar categorias'
    });
  }
});


// ═══════════════════════════════════════════════════════════════════════
// ROTA 3: OBTER DETALHES DE UM LIVRO ESPECÍFICO
// ═══════════════════════════════════════════════════════════════════════
// 
// Enderço: GET /api/livros/:id
// 
// O que faz:
// Mostra todas as informações completas de um livro em particular.
// Por exemplo: GET /api/livros/5 mostra o livro número 5
// 
// Informações retornadas:
// - ID, Título, Autor, ISBN, Categoria, Descrição
// - Data de publicação, Total de cópias, Cópias disponíveis
// 
// SEGURANÇA: PÚBLICO - qualquer pessoa consegue aceder
// 
router.get('/:id', async (req, res) => {
  try {
    // 📊 BUSCAR O LIVRO
    // =================
    const [livros] = await pool.query(
      'SELECT * FROM livros WHERE id_livro = ?',
      [req.params.id]
    );

    // Se não encontrou o livro:
    if (livros.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Livro não encontrado'
      });
    }

    // ✅ RESPOSTA DE SUCESSO
    // =======================
    res.json({
      success: true,
      data: livros[0]
    });
  } catch (error) {
    console.error('Erro ao obter livro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter detalhes do livro'
    });
  }
});


// ═══════════════════════════════════════════════════════════════════════
// ROTA 4: CRIAR UM NOVO LIVRO
// ═══════════════════════════════════════════════════════════════════════
// 
// Enderço: POST /api/livros
// 
// O que faz:
// O bibliotecário adiciona um novo livro ao catálogo da biblioteca.
// 
// Dados necessários:
// - titulo: Nome do livro (OBRIGATÓRIO)
// - autor: Quem escreveu (OBRIGATÓRIO)
// - isbn: Número de identificação único do livro (OBRIGATÓRIO)
// - total_copias: Quantas cópias a biblioteca tem (OBRIGATÓRIO)
// - categoria: Tipo de livro (OPCIONAL)
// - descricao: Resumo do livro (OPCIONAL)
// - data_publicacao: Quando foi publicado (OPCIONAL)
// 
// Validações (Verificações):
// 1. Verifica se todos os campos obrigatórios foram preenchidos
// 2. Verifica se total_copias é um número positivo
// 3. Verifica se o ISBN já não existe na base de dados
// 
// SEGURANÇA: Apenas bibliotecários
// 
router.post('/', auth, checkRole(['bibliotecario']), [
  // Validação do título: não pode estar vazio
  body('titulo').trim().notEmpty().withMessage('Título é obrigatório'),
  // Validação do autor: não pode estar vazio
  body('autor').trim().notEmpty().withMessage('Autor é obrigatório'),
  // Validação do ISBN: não pode estar vazio
  body('isbn').trim().notEmpty().withMessage('ISBN é obrigatório'),
  // Validação do total de cópias: deve ser um número >= 1
  body('total_copias').isInt({ min: 1 }).withMessage('Total de cópias deve ser um número positivo')
], async (req, res) => {
  try {
    // 🔍 VERIFICAR VALIDAÇÕES
    // ======================
    // O express-validator faz as verificações e retorna os erros
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Se há erros, devolver lista de erros
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 📥 EXTRAIR DADOS DO PEDIDO
    // ==========================
    const { titulo, autor, isbn, categoria, descricao, data_publicacao, total_copias } = req.body;

    // ✅ PASSO 1: VERIFICAR SE ISBN JÁ EXISTE
    // ======================================
    // ISBN deve ser único (cada livro tem um ISBN diferente)
    const [existingBook] = await pool.query(
      'SELECT id_livro FROM livros WHERE isbn = ?',
      [isbn]
    );

    if (existingBook.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um livro com este ISBN'
      });
    }

    // ✅ PASSO 2: CRIAR O LIVRO NA BASE DE DADOS
    // ========================================
    // Inserir um novo livro com todos os dados
    // Nota: copias_disponiveis começa igual a total_copias
    // (todas as cópias estão disponíveis no início)
    const [result] = await pool.query(
      `INSERT INTO livros (titulo, autor, isbn, categoria, descricao, data_publicacao, total_copias, copias_disponiveis) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, autor, isbn, categoria || null, descricao || null, data_publicacao || null, total_copias, total_copias]
    );

    // ✅ RESPOSTA DE SUCESSO
    // =======================
    res.status(201).json({
      success: true,
      message: 'Livro criado com sucesso',
      data: {
        id: result.insertId,
        titulo,
        autor,
        isbn,
        categoria,
        descricao,
        data_publicacao,
        total_copias,
        copias_disponiveis: total_copias
      }
    });
  } catch (error) {
    console.error('Erro ao criar livro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar livro'
    });
  }
});


// ═══════════════════════════════════════════════════════════════════════
// ROTA 5: ATUALIZAR INFORMAÇÕES DE UM LIVRO
// ═══════════════════════════════════════════════════════════════════════
// 
// Enderço: PUT /api/livros/:id
// 
// O que faz:
// O bibliotecário altera informações de um livro existente.
// Por exemplo: corrigir o título, atualizar o ISBN, etc.
// 
// Dados que podem ser atualizados:
// - titulo, autor, isbn, categoria, descricao, data_publicacao
// - total_copias: Se alterar isto, ajusta automaticamente as disponíveis
// 
// Todos os campos são OPCIONAIS (só atualiza os que enviar)
// 
// Validações:
// 1. Verifica se o livro existe
// 2. Verifica se o ISBN alterado não entra em conflito com outro livro
// 3. Ajusta as cópias disponíveis se alterou o total
// 
// SEGURANÇA: Apenas bibliotecários
// 
router.put('/:id', auth, checkRole(['bibliotecario']), [
  // Validação do título (se enviado, não pode estar vazio)
  body('titulo').optional().trim().notEmpty().withMessage('Título não pode ser vazio'),
  // Validação do autor (se enviado, não pode estar vazio)
  body('autor').optional().trim().notEmpty().withMessage('Autor não pode ser vazio'),
  // Validação do ISBN (se enviado, não pode estar vazio)
  body('isbn').optional().trim().notEmpty().withMessage('ISBN não pode ser vazio')
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
    const { titulo, autor, isbn, categoria, descricao, data_publicacao, total_copias } = req.body;

    // ✅ PASSO 1: VERIFICAR SE O LIVRO EXISTE
    // ======================================
    const [existingBook] = await pool.query(
      'SELECT * FROM livros WHERE id_livro = ?',
      [req.params.id]
    );

    if (existingBook.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Livro não encontrado'
      });
    }

    const livro = existingBook[0];

    // ✅ PASSO 2: AJUSTAR CÓPIAS DISPONÍVEIS SE NECESSÁRIO
    // ==================================================
    // Se o bibliotecário alterou o total de cópias, precisamos ajustar
    // as cópias disponíveis proporcionalmente
    // Exemplo: tinha 10 cópias, 3 disponíveis, alterou para 8 total
    //          então agora há 1 disponível (3 - 2 = 1)
    let copias_disponiveis = livro.copias_disponiveis;
    if (total_copias !== undefined) {
      // Calcular diferença entre novo total e anterior
      const diferenca = total_copias - livro.total_copias;
      // Adicionar essa diferença às disponíveis (mas nunca ir abaixo de 0)
      copias_disponiveis = Math.max(0, livro.copias_disponiveis + diferenca);
    }

    // ✅ PASSO 3: VERIFICAR ISBN DUPLICADO (SE ALTERADO)
    // =================================================
    // Se o utilizador quer alterar o ISBN:
    if (isbn && isbn !== livro.isbn) {
      // Verificar se já existe outro livro com este novo ISBN
      const [duplicateISBN] = await pool.query(
        'SELECT id_livro FROM livros WHERE isbn = ? AND id_livro != ?',
        [isbn, req.params.id]
      );

      if (duplicateISBN.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Já existe outro livro com este ISBN'
        });
      }
    }

    // ✅ PASSO 4: ATUALIZAR O LIVRO NA BASE DE DADOS
    // ============================================
    // COALESCE significa: usar o valor novo, ou se for vazio, manter o antigo
    // Por exemplo: se não enviou título, mantém o título antigo
    await pool.query(
      `UPDATE livros 
       SET titulo = COALESCE(?, titulo),
           autor = COALESCE(?, autor),
           isbn = COALESCE(?, isbn),
           categoria = COALESCE(?, categoria),
           descricao = COALESCE(?, descricao),
           data_publicacao = COALESCE(?, data_publicacao),
           total_copias = COALESCE(?, total_copias),
           copias_disponiveis = ?
       WHERE id_livro = ?`,
      [titulo, autor, isbn, categoria, descricao, data_publicacao, total_copias, copias_disponiveis, req.params.id]
    );

    // ✅ PASSO 5: BUSCAR E RETORNAR O LIVRO ATUALIZADO
    // ==============================================
    const [updatedBook] = await pool.query(
      'SELECT * FROM livros WHERE id_livro = ?',
      [req.params.id]
    );

    // ✅ RESPOSTA DE SUCESSO
    // =======================
    res.json({
      success: true,
      message: 'Livro atualizado com sucesso',
      data: updatedBook[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar livro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar livro'
    });
  }
});


// ═══════════════════════════════════════════════════════════════════════
// ROTA 6: ELIMINAR UM LIVRO
// ═══════════════════════════════════════════════════════════════════════
// 
// Enderço: DELETE /api/livros/:id
// 
// O que faz:
// Remove um livro do catálogo da biblioteca.
// Mas com proteções para garantir que não há dados que ficam "órfãos".
// 
// Protecções (Validações):
// 1. Verifica se o livro existe
// 2. Verifica se há empréstimos ATIVOS deste livro
//    (Não pode apagar se alguém tem o livro emprestado)
// 3. Verifica se há reservas PENDENTES deste livro
//    (Não pode apagar se alguém o reservou e está à espera)
// 
// IMPORTANTE: Só consegue apagar um livro se não há
// ninguém a usá-lo neste momento!
// 
// SEGURANÇA: Apenas bibliotecários
// 
router.delete('/:id', auth, checkRole(['bibliotecario']), async (req, res) => {
  try {
    // ✅ PASSO 1: VERIFICAR SE O LIVRO EXISTE
    // ======================================
    const [livros] = await pool.query(
      'SELECT id_livro FROM livros WHERE id_livro = ?',
      [req.params.id]
    );

    if (livros.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Livro não encontrado'
      });
    }

    // ✅ PASSO 2: VERIFICAR SE EXISTEM EMPRÉSTIMOS ATIVOS
    // =================================================
    // Pergunta: "Há alguém que tem este livro emprestado neste momento?"
    const [emprestimosAtivos] = await pool.query(
      'SELECT id_emprestimo FROM emprestimos WHERE id_livro = ? AND estado = ?',
      [req.params.id, 'ativo']
    );

    if (emprestimosAtivos.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível eliminar livro com empréstimos ativos'
      });
    }

    // ✅ PASSO 3: VERIFICAR SE EXISTEM RESERVAS PENDENTES
    // =================================================
    // Pergunta: "Há alguém que está na fila de espera para este livro?"
    const [reservasPendentes] = await pool.query(
      'SELECT id_reserva FROM reservas WHERE id_livro = ? AND estado = ?',
      [req.params.id, 'pendente']
    );

    if (reservasPendentes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível eliminar livro com reservas pendentes'
      });
    }

    // ✅ PASSO 4: APAGAR O LIVRO
    // =========================
    // Agora é seguro apagar: não há ninguém a usá-lo
    await pool.query('DELETE FROM livros WHERE id_livro = ?', [req.params.id]);

    // ✅ RESPOSTA DE SUCESSO
    // =======================
    res.json({
      success: true,
      message: 'Livro eliminado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao eliminar livro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao eliminar livro'
    });
  }
});

// 📤 EXPORTAR AS ROTAS
// ====================
// Isto permite que o ficheiro server.js use estas rotas
module.exports = router;