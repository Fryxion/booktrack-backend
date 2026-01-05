/**
 * ========================================================================
 * GESTÃO DE RESERVAS - BOOKTRACK API
 * ========================================================================
 * 
 * Este ficheiro trata de todas as operações relacionadas com RESERVAS DE LIVROS.
 * Uma reserva é quando um utilizador marca que quer emprestar um livro que 
 * está atualmente indisponível (já está emprestado a outro utilizador).
 * 
 * Funcionalidades:
 * - Ver a lista de reservas
 * - Ver detalhes de uma reserva específica
 * - Criar uma nova reserva
 * - Cancelar uma reserva
 * - Processar uma reserva (converter em empréstimo quando o livro fica disponível)
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

const { criarNotificacao } = require('../middleware/notificacoesController');


// ═══════════════════════════════════════════════════════════════════════
// ROTA 1: VER LISTA DE RESERVAS
// ═══════════════════════════════════════════════════════════════════════
// 
// Enderço: GET /api/reservas
// 
// O que faz:
// Lista todas as reservas. Mas com uma regra de segurança:
// - Se fores um utilizador comum: vês apenas TAS PRÓPRIAS reservas
// - Se fores bibliotecário: vês TODAS as reservas
// 
// Informações retornadas:
// - ID da reserva, livro, utilizador, datas, estado (pendente/confirmada/etc)
// 
// SEGURANÇA: Requer autenticação (estar logado)
// 
router.get('/', auth, async (req, res) => {
  try {
    // 📊 CONSTRUIR A PERGUNTA À BASE DE DADOS
    // =======================================
    // Estamos a fazer uma "JOIN" - isto significa combinar dados de várias tabelas:
    // - reservas: tabela principal das reservas
    // - livros: para obter info do livro (título, autor, ISBN)
    // - utilizadores: para obter info do utilizador (nome, email)
    let query = `
      SELECT r.*, 
             l.titulo, l.autor, l.isbn,
             u.nome as nome_utilizador, u.email
      FROM reservas r
      JOIN livros l ON r.id_livro = l.id_livro
      JOIN utilizadores u ON r.id_utilizador = u.id_utilizador
      WHERE 1=1
    `;
    const params = [];

    // 🔐 VERIFICAR PERMISSÕES
    // ======================
    // Se NÃO for bibliotecário (i.e., for aluno ou professor):
    if (req.user.tipo !== 'bibliotecario') {
      // Adicionar filtro para mostrar apenas as suas próprias reservas
      query += ' AND r.id_utilizador = ?';
      params.push(req.user.id);
    }
    // Se FOR bibliotecário, mostra TODAS as reservas (sem filtro)

    // Ordenar do mais recente para o mais antigo
    query += ' ORDER BY r.data_reserva DESC';

    // Executar a pergunta à base de dados
    const [reservas] = await pool.query(query, params);

    // ✅ RESPOSTA DE SUCESSO
    // =======================
    res.json({
      success: true,
      count: reservas.length,         // Quantas reservas encontrou
      data: reservas                  // Lista completa das reservas
    });
  } catch (error) {
    console.error('Erro ao listar reservas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar reservas'
    });
  }
});


// ═══════════════════════════════════════════════════════════════════════
// ROTA 2: VER DETALHES DE UMA RESERVA ESPECÍFICA
// ═══════════════════════════════════════════════════════════════════════
// 
// Enderço: GET /api/reservas/:id
// 
// O que faz:
// Mostra todos os detalhes de uma reserva em particular.
// Por exemplo: GET /api/reservas/5 mostra a reserva número 5
// 
// SEGURANÇA: 
// - Utilizadores normais só conseguem ver as suas próprias reservas
// - Bibliotecários conseguem ver qualquer reserva
// 
router.get('/:id', auth, async (req, res) => {
  try {
    // 📊 BUSCAR A RESERVA
    // ===================
    // Fazer uma pergunta à base de dados: "Dá-me a reserva com este ID"
    const [reservas] = await pool.query(
      `SELECT r.*, 
              l.titulo, l.autor, l.isbn, l.categoria,
              u.nome as nome_utilizador, u.email
       FROM reservas r
       JOIN livros l ON r.id_livro = l.id_livro
       JOIN utilizadores u ON r.id_utilizador = u.id_utilizador
       WHERE r.id_reserva = ?`,
      [req.params.id]
    );

    // Se não encontrou nenhuma reserva com este ID:
    if (reservas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada'
      });
    }

    const reserva = reservas[0];

    // 🔐 VERIFICAR PERMISSÕES
    // =======================
    // Só deixar ver se:
    // - For o próprio utilizador da reserva, OU
    // - For bibliotecário (pode ver tudo)
    if (req.user.tipo !== 'bibliotecario' && reserva.id_utilizador !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    // ✅ RESPOSTA DE SUCESSO
    // =======================
    res.json({
      success: true,
      data: reserva
    });
  } catch (error) {
    console.error('Erro ao obter reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter detalhes da reserva'
    });
  }
});


// ═══════════════════════════════════════════════════════════════════════
// ROTA 3: CRIAR UMA NOVA RESERVA
// ═══════════════════════════════════════════════════════════════════════
// 
// Enderço: POST /api/reservas
// 
// O que faz:
// Um utilizador marca que quer um livro que não está disponível neste momento.
// O sistema coloca-o numa fila de espera e quando o livro ficar disponível,
// a sua reserva será convertida num empréstimo.
// 
// Dados necessários:
// - id_livro: O número do livro que quer reservar
// 
// Verificações (Validações):
// 1. Verifica se o livro existe
// 2. Verifica se já tem uma reserva ativa deste livro
// 3. Verifica se já tem este livro emprestado
// 4. Verifica se há cópias disponíveis
// 
// SEGURANÇA: Requer autenticação
// 
router.post('/', auth, async (req, res) => {
  try {
    // 📥 EXTRAIR DADOS DO PEDIDO
    // ==========================
    const { id_livro } = req.body;

    // Validação básica: verificar se enviou o ID do livro
    if (!id_livro) {
      return res.status(400).json({
        success: false,
        message: 'ID do livro é obrigatório'
      });
    }

    // ✅ PASSO 1: VERIFICAR SE O LIVRO EXISTE
    // ======================================
    const [livros] = await pool.query(
      'SELECT * FROM livros WHERE id_livro = ?',
      [id_livro]
    );

    if (livros.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Livro não encontrado'
      });
    }

    const livro = livros[0];

    // ✅ PASSO 2: VERIFICAR SE JÁ TEM UMA RESERVA ATIVA DESTE LIVRO
    // ============================================================
    // Pergunta: "Este utilizador já tem uma reserva (pendente ou confirmada) deste livro?"
    const [reservaExistente] = await pool.query(
      'SELECT id_reserva FROM reservas WHERE id_utilizador = ? AND id_livro = ? AND estado IN (?, ?)',
      [req.user.id, id_livro, 'pendente', 'confirmada']
    );

    if (reservaExistente.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Já tem uma reserva ativa deste livro'
      });
    }

    // ✅ PASSO 3: VERIFICAR SE JÁ TEM ESTE LIVRO EMPRESTADO
    // ====================================================
    // Pergunta: "Este utilizador já tem uma cópia emprestada deste livro?"
    const [emprestimoAtivo] = await pool.query(
      'SELECT id_emprestimo FROM emprestimos WHERE id_utilizador = ? AND id_livro = ? AND estado = ?',
      [req.user.id, id_livro, 'ativo']
    );

    if (emprestimoAtivo.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Já tem este livro emprestado'
      });
    }

    // ✅ PASSO 4: CALCULAR DATA DE EXPIRAÇÃO
    // ====================================
    // A reserva expira em 7 dias se não for processada
    const dataExpiracao = new Date();
    dataExpiracao.setDate(dataExpiracao.getDate() + 7);

    // ✅ PASSO 5: CALCULAR POSIÇÃO NA FILA
    // ==================================
    // Se há 3 reservas pendentes, a sua será a 4ª na fila
    const [reservasExistentes] = await pool.query(
      'SELECT COUNT(*) as total FROM reservas WHERE id_livro = ? AND estado = ?',
      [id_livro, 'pendente']
    );
    const posicaoFila = reservasExistentes[0].total + 1;

    // ✅ PASSO 6: CRIAR A RESERVA NA BASE DE DADOS
    // ==========================================
    const [result] = await pool.query(
      `INSERT INTO reservas (id_utilizador, id_livro, data_expiracao, estado, posicao_fila)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, id_livro, dataExpiracao, 'pendente', posicaoFila]
    );

    // ✅ PASSO 7: ATUALIZAR O NÚMERO DE CÓPIAS DISPONÍVEIS
    // ===================================================
    // Reduzir em 1 o número de cópias (reserva "ocupa" uma cópia)
    const [result_update_copias] = await pool.query(
      `UPDATE livros set copias_disponiveis = copias_disponiveis - 1 WHERE id_livro = ?
      and copias_disponiveis > 0`,
      [id_livro]
    );

    // Se não conseguiu atualizar (porque não havia cópias):
    if (result_update_copias.affectedRows === 0) {
      // Reverter: apagar a reserva que foi criada
      await pool.query(
        'DELETE FROM reservas WHERE id_reserva = ?',
        [result.insertId]
      );

      return res.status(400).json({
        success: false,
        message: 'Não há cópias disponíveis para reserva'
      });
    }

    // ✅ RESPOSTA DE SUCESSO
    // =======================
    res.status(201).json({
      success: true,
      message: 'Reserva criada com sucesso',
      data: {
        id_reserva: result.insertId,
        id_utilizador: req.user.id,
        id_livro,
        data_expiracao: dataExpiracao,
        estado: 'pendente',
        posicao_fila: posicaoFila
      }
    });
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar reserva'
    });
  }
});
// ═══════════════════════════════════════════════════════════════════════      

// @route   PUT /api/reservas/:id/cancelar
// @desc    Cancelar reserva
// @access  Private
router.put('/:id/cancelar', auth, async (req, res) => {
  try {
    // Verificar se reserva existe
    const [reservas] = await pool.query(
      'SELECT * FROM reservas WHERE id_reserva = ?',
      [req.params.id]
    );

    if (reservas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada'
      });
    }

    const reserva = reservas[0];

    // Verificar permissões (apenas o próprio utilizador ou bibliotecário pode cancelar)
    if (req.user.tipo !== 'bibliotecario' && reserva.id_utilizador !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    // Verificar se reserva já foi cancelada ou está expirada
    if (reserva.estado === 'cancelada' || reserva.estado === 'expirada') {
      return res.status(400).json({
        success: false,
        message: 'Esta reserva já foi cancelada ou expirou'
      });
    }

    // Cancelar reserva
    await pool.query(
      'UPDATE reservas SET estado = ? WHERE id_reserva = ?',
      ['cancelada', req.params.id]
    );

    await pool.query(
      'UPDATE livros SET copias_disponiveis = copias_disponiveis + 1 WHERE id_livro = ?',
      [reserva.id_livro]
    );


    await criarNotificacao(req.user.id, `❌ Reserva cancelada...`, 'cancelamento');
    res.json({
      success: true,
      message: 'Reserva cancelada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao cancelar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao cancelar reserva'
    });
  }
});

// POST /api/reservas/:id/processar - Processar reserva (converter em empréstimo)
router.post('/:id/processar', auth, checkRole(['bibliotecario']), async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. Buscar dados da reserva
    const [reserva] = await connection.query(
      `SELECT r.*, l.id_livro , l.titulo as livro
       FROM reservas r 
       JOIN livros l ON r.id_livro = l.id_livro 
       WHERE r.id_reserva = ?`,
      [id]
    );
    
    if (reserva.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada'
      });
    }
    
    const { id_utilizador, id_livro, livro } = reserva[0];
    
    // 2. Criar empréstimo (14 dias de prazo)
    const dataEmprestimo = new Date();
    const dataDevolucaoPrevista = new Date();
    dataDevolucaoPrevista.setDate(dataDevolucaoPrevista.getDate() + 14);
    
    await connection.query(
      `INSERT INTO emprestimos (id_utilizador, id_livro, data_emprestimo, data_devolucao_prevista) 
       VALUES (?, ?, ?, ?)`,
      [id_utilizador, id_livro, dataEmprestimo, dataDevolucaoPrevista]
    );
    
    // 4. Eliminar a reserva (já foi processada)
    await connection.query(
      `DELETE FROM reservas WHERE id_reserva = ?`,
      [id]
    );
    
    await connection.commit();
    
    await criarNotificacao(req.user.id, `✅ Reserva confirmada! "${livro}"...`, 'reserva');

    res.json({
      success: true,
      message: 'Reserva processada e empréstimo criado com sucesso'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao processar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar reserva'
    });
  } finally {
    connection.release();
  }
});


module.exports = router;