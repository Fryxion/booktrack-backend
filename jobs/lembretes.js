// ====================================================================
// CRON JOB - Lembretes de Devolução
// ====================================================================

const cron = require('node-cron');
const db = require('../config/database');
const { criarNotificacao } = require('../middleware/notificacoesController');

// Executar todos os dias às 10h
cron.schedule('0 10 * * *', async () => {
  console.log('🔔 A verificar empréstimos para lembrete...');
  
  try {
    // Buscar empréstimos que expiram em 3 dias
    const [emprestimos] = await db.query(`
      SELECT e.id_emprestimo, e.id_utilizador, l.titulo, e.data_devolucao_prevista,
             DATEDIFF(e.data_devolucao_prevista, NOW()) as dias_restantes
      FROM emprestimos e
      JOIN livros l ON e.id_livro = l.id_livro
      WHERE e.estado = 'ativo'
      AND DATEDIFF(e.data_devolucao_prevista, NOW()) = 3
    `);

    for (const emp of emprestimos) {
      await criarNotificacao(
        emp.id_utilizador,
        `⏰ Lembrete: Devolve "${emp.titulo}" em 3 dias!`,
        'lembrete'
      );
    }

    console.log(`✅ ${emprestimos.length} lembretes enviados`);
  } catch (error) {
    console.error('❌ Erro ao enviar lembretes:', error);
  }
});

console.log('✅ Cron job de lembretes iniciado');