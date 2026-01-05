const db = require('../config/database');

/**
 * Controller para gestão de notificações
 */

/**
 * Obter todas as notificações do utilizador autenticado
 * GET /api/notificacoes
 */
exports.getNotificacoes = async (req, res) => {
  try {
    const [notificacoes] = await db.query(
      `SELECT id_notificacao, mensagem, tipo, data_envio, lida
       FROM notificacoes
       WHERE id_utilizador = ?
       ORDER BY data_envio DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(notificacoes);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter notificações' });
  }
};

/**
 * Obter notificações não lidas
 * GET /api/notificacoes/nao-lidas
 */
exports.getNotificacoesNaoLidas = async (req, res) => {
  try {
    const utilizadorId = req.user.id;

    const [notificacoes] = await db.query(
      `SELECT 
        id_notificacao,
        mensagem,
        tipo,
        data_envio,
        lida
      FROM notificacoes
      WHERE id_utilizador = ? AND lida = 0
      ORDER BY data_envio DESC`,
      [utilizadorId]
    );

    res.json({
      count: notificacoes.length,
      notificacoes
    });
  } catch (error) {
    console.error('Erro ao obter notificações não lidas:', error);
    res.status(500).json({ 
      message: 'Erro ao obter notificações não lidas',
      error: error.message 
    });
  }
};

/**
 * Marcar notificação como lida
 * PATCH /api/notificacoes/:id/marcar-lida
 */
exports.marcarComoLida = async (req, res) => {
  try {
    const { id } = req.params;
    const utilizadorId = req.user.id;

    // Verificar se a notificação pertence ao utilizador
    const [notificacao] = await db.query(
      'SELECT * FROM notificacoes WHERE id_notificacao = ? AND id_utilizador = ?',
      [id, utilizadorId]
    );

    if (notificacao.length === 0) {
      return res.status(404).json({ message: 'Notificação não encontrada' });
    }

    // Marcar como lida
    await db.query(
      'UPDATE notificacoes SET lida = 1 WHERE id_notificacao = ?',
      [id]
    );

    res.json({ 
      message: 'Notificação marcada como lida',
      id_notificacao: id
    });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({ 
      message: 'Erro ao marcar notificação como lida',
      error: error.message 
    });
  }
};

/**
 * Marcar todas as notificações como lidas
 * PATCH /api/notificacoes/marcar-todas-lidas
 */
exports.marcarTodasComoLidas = async (req, res) => {
  try {
    const utilizadorId = req.user.id;

    await db.query(
      'UPDATE notificacoes SET lida = 1 WHERE id_utilizador = ? AND lida = 0',
      [utilizadorId]
    );

    res.json({ message: 'Todas as notificações marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error);
    res.status(500).json({ 
      message: 'Erro ao marcar todas como lidas',
      error: error.message 
    });
  }
};

/**
 * Eliminar notificação
 * DELETE /api/notificacoes/:id
 */
exports.deleteNotificacao = async (req, res) => {
  try {
    const { id } = req.params;
    const utilizadorId = req.user.id;

    // Verificar se a notificação pertence ao utilizador
    const [notificacao] = await db.query(
      'SELECT * FROM notificacoes WHERE id_notificacao = ? AND id_utilizador = ?',
      [id, utilizadorId]
    );

    if (notificacao.length === 0) {
      return res.status(404).json({ message: 'Notificação não encontrada' });
    }

    await db.query(
      'DELETE FROM notificacoes WHERE id_notificacao = ?',
      [id]
    );

    res.json({ 
      message: 'Notificação eliminada',
      id_notificacao: id
    });
  } catch (error) {
    console.error('Erro ao eliminar notificação:', error);
    res.status(500).json({ 
      message: 'Erro ao eliminar notificação',
      error: error.message 
    });
  }
};

/**
 * Função auxiliar para criar notificação
 * (Usada por outros controllers)
 */
exports.criarNotificacao = async (idUtilizador, mensagem, tipo = 'info') => {
  try {
    await db.query(
      `INSERT INTO notificacoes (id_utilizador, mensagem, tipo, data_envio, lida)
       VALUES (?, ?, ?, NOW(), 0)`,
      [idUtilizador, mensagem, tipo]
    );
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
  }
};

module.exports = exports;