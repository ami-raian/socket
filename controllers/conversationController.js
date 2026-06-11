const conversationService = require('../services/conversationService');
const messageService      = require('../services/messageService');

const getAll = async (req, res, next) => {
  try {
    const { page, length, filters } = req.query;
    const result = await conversationService.getAll({ page, length, filters });
    res.json({ success: true, message: 'Conversations fetched successfully', ...result });
  } catch (err) { next(err); }
};

const markEvent = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { event, agentInfo } = req.body;

    if (event === 'seen') {
      const { seenAt } = await conversationService.markSeen(conversationId, agentInfo);
      await messageService.markConversationSeen(conversationId);
      return res.json({
        success: true,
        message: 'Conversation marked as seen successfully',
        data: { conversationId, isSeen: true, seenBy: agentInfo, seenAt },
      });
    }

    if (event === 'delivered') {
      const { deliveredAt } = await conversationService.markDelivered(conversationId);
      await messageService.markConversationDelivered(conversationId);
      return res.json({
        success: true,
        message: 'Conversation marked as delivered successfully',
        data: { conversationId, deliveredAt },
      });
    }

    res.status(400).json({ success: false, message: 'Invalid event type. Use "seen" or "delivered".' });
  } catch (err) { next(err); }
};

const closeConversation = async (req, res, next) => {
  try {
    const { conversationId }  = req.params;
    const { reason, agentInfo } = req.body;
    const { conversation, closedAt } = await conversationService.close(conversationId, { reason, agentInfo });

    // broadcast via socket if io is attached
    req.app.get('io')?.emit('conversation:closed', {
      conversationId,
      status: 'CLOSED',
      reason,
      closedBy: agentInfo,
      closedAt,
    });

    res.json({
      success: true,
      message: 'Conversation closed successfully',
      data: { conversationId, status: 'CLOSED', reason, closedBy: agentInfo, closedAt },
    });
  } catch (err) { next(err); }
};

const transferConversation = async (req, res, next) => {
  try {
    const { conversationId }                           = req.params;
    const { targetUserId, targetUserInfo, reason, agentInfo } = req.body;

    const { previousAgent, transferredAt } = await conversationService.transfer(conversationId, {
      targetUserInfo,
      agentInfo,
      reason,
    });

    // notify target agent via socket
    const io          = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers'); // Map<socketId, userId>
    if (io && onlineUsers) {
      const entry = [...onlineUsers.entries()].find(([, uid]) => uid === targetUserId);
      if (entry) {
        io.to(entry[0]).emit('conversation:transferred_to_you', {
          conversationId,
          transferredBy: agentInfo,
          reason,
        });
      }
    }

    res.json({
      success: true,
      message: 'Conversation transferred successfully',
      data: {
        conversationId,
        status:        'OPEN',
        lastAction:    'TRANSFERRED',
        previousAgent,
        transferredTo: targetUserInfo,
        transferredBy: agentInfo,
        reason,
        transferredAt,
      },
    });
  } catch (err) { next(err); }
};

const linkTradeAccount = async (req, res, next) => {
  try {
    const { conversationId }             = req.params;
    const { tradeAccountId, tradeAccountNumber } = req.body;
    await conversationService.linkTradeAccount(conversationId, { tradeAccountId, tradeAccountNumber });
    res.json({
      success: true,
      message: 'Conversation updated successfully',
      data: { tradeAccountId, tradeAccountNumber },
    });
  } catch (err) { next(err); }
};

module.exports = { getAll, markEvent, closeConversation, transferConversation, linkTradeAccount };
