const router                 = require('express').Router();
const conversationController = require('../controllers/conversationController');

// GET  /api/conversations?page=1&length=10&filters={}
router.get('/', conversationController.getAll);

// POST /api/conversations  { businessId, userId, conversationType? }
router.post('/', conversationController.createConversation);

// PATCH /api/conversations/:conversationId/event  { event: "seen"|"delivered", agentInfo }
router.patch('/:conversationId/event', conversationController.markEvent);

// PATCH /api/conversations/:conversationId/close  { reason, agentInfo }
router.patch('/:conversationId/close', conversationController.closeConversation);

// PATCH /api/conversations/:conversationId/transfer  { targetUserId, targetUserInfo, reason, agentInfo }
router.patch('/:conversationId/transfer', conversationController.transferConversation);

// PATCH /api/conversations/:conversationId  { tradeAccountId, tradeAccountNumber }
router.patch('/:conversationId', conversationController.linkTradeAccount);

module.exports = router;
