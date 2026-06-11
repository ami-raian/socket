const userService         = require('../services/userService');
const conversationService = require('../services/conversationService');
const messageService      = require('../services/messageService');

module.exports = (io, onlineUsers) => {
  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    // ── AGENT JOINS ─────────────────────────────────────────────
    socket.on('user:join', async (userId) => {
      onlineUsers.set(socket.id, userId);
      await userService.setOnline(userId, socket.id);
      io.emit('user:online', userId);
    });

    // ── JOIN / LEAVE CONVERSATION ROOM ───────────────────────────
    socket.on('conversation:join', (conversationId) => {
      socket.join(conversationId);
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(conversationId);
    });

    // ── SEND MESSAGE (reply in existing conversation) ────────────
    socket.on('message:send', async (data) => {
      try {
        const message = await messageService.create(data);
        io.to(data.conversationId).emit('message:receive', message);
      } catch {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ── BROADCAST NEW CONVERSATION (after REST POST /api/messages) ─
    socket.on('conversation:new', (conversation) => {
      socket.broadcast.emit('conversation:new', conversation);
    });

    // ── MARK SEEN ────────────────────────────────────────────────
    socket.on('conversation:seen', async ({ conversationId, agentInfo }) => {
      try {
        const { seenAt } = await conversationService.markSeen(conversationId, agentInfo);
        await messageService.markConversationSeen(conversationId);
        io.to(conversationId).emit('conversation:seen', {
          conversationId, isSeen: true, seenBy: agentInfo, seenAt,
        });
      } catch {
        socket.emit('error', { message: 'Failed to mark as seen' });
      }
    });

    // ── MARK DELIVERED ───────────────────────────────────────────
    socket.on('conversation:delivered', async ({ conversationId }) => {
      try {
        const deliveredAt = await messageService.markConversationDelivered(conversationId);
        io.to(conversationId).emit('conversation:delivered', { conversationId, deliveredAt });
      } catch {
        socket.emit('error', { message: 'Failed to mark as delivered' });
      }
    });

    // ── CLOSE CONVERSATION ───────────────────────────────────────
    socket.on('conversation:close', async ({ conversationId, reason, agentInfo }) => {
      try {
        const { closedAt } = await conversationService.close(conversationId, { reason, agentInfo });
        io.emit('conversation:closed', { conversationId, status: 'CLOSED', reason, closedBy: agentInfo, closedAt });
      } catch {
        socket.emit('error', { message: 'Failed to close conversation' });
      }
    });

    // ── TRANSFER CONVERSATION ────────────────────────────────────
    socket.on('conversation:transfer', async ({ conversationId, targetUserId, targetUserInfo, reason, agentInfo }) => {
      try {
        const { previousAgent, transferredAt } = await conversationService.transfer(conversationId, {
          targetUserInfo, agentInfo, reason,
        });

        // notify the new agent privately
        const entry = [...onlineUsers.entries()].find(([, uid]) => uid === targetUserId);
        if (entry) {
          io.to(entry[0]).emit('conversation:transferred_to_you', {
            conversationId, transferredBy: agentInfo, reason,
          });
        }

        io.to(conversationId).emit('conversation:transferred', {
          conversationId, status: 'OPEN', lastAction: 'TRANSFERRED',
          previousAgent, transferredTo: targetUserInfo, transferredBy: agentInfo,
          reason, transferredAt,
        });
      } catch {
        socket.emit('error', { message: 'Failed to transfer conversation' });
      }
    });

    // ── TYPING INDICATORS ────────────────────────────────────────
    socket.on('typing:start', ({ conversationId, userId, name }) => {
      socket.to(conversationId).emit('typing:start', { userId, name });
    });

    socket.on('typing:stop', ({ conversationId, userId }) => {
      socket.to(conversationId).emit('typing:stop', { userId });
    });

    // ── DISCONNECT ───────────────────────────────────────────────
    socket.on('disconnect', async () => {
      const userId = onlineUsers.get(socket.id);
      if (userId) {
        onlineUsers.delete(socket.id);
        await userService.setOffline(userId);
        io.emit('user:offline', userId);
      }
      console.log(`[socket] disconnected: ${socket.id}`);
    });
  });
};
