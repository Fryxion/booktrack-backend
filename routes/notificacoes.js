const express = require('express');
const router = express.Router();
const notificacoesController = require('../middleware/notificacoesController');
const { auth, checkRole } = require('../middleware/auth');

/**
 * @route   GET /api/notificacoes
 * @desc    Obter todas as notificações do utilizador
 * @access  Privado
 */
router.get('/', auth, notificacoesController.getNotificacoes);

/**
 * @route   GET /api/notificacoes/nao-lidas
 * @desc    Obter notificações não lidas e contagem
 * @access  Privado
 */
router.get('/nao-lidas', auth, notificacoesController.getNotificacoesNaoLidas);

/**
 * @route   PATCH /api/notificacoes/:id/marcar-lida
 * @desc    Marcar uma notificação como lida
 * @access  Privado
 */
router.patch('/:id/marcar-lida', auth, notificacoesController.marcarComoLida);

/**
 * @route   PATCH /api/notificacoes/marcar-todas-lidas
 * @desc    Marcar todas as notificações como lidas
 * @access  Privado
 */
router.patch('/marcar-todas-lidas', auth, notificacoesController.marcarTodasComoLidas);

/**
 * @route   DELETE /api/notificacoes/:id
 * @desc    Eliminar uma notificação
 * @access  Privado
 */
router.delete('/:id', auth, notificacoesController.deleteNotificacao);

module.exports = router;