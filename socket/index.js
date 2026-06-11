const Message = require('../models/Message');
const User    = require('../models/User');

module.exports = (io) => {
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    socket.on('user:join', async (userId) => {
      onlineUsers.set(socket.id, userId);
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        socketId: socket.id,
      });
      io.emit('user:online', userId);
    });

    socket.on('room:join', (roomId) => {
      socket.join(roomId);
      console.log(`${socket.id} joined room: ${roomId}`);
    });

    socket.on('message:send', async (data) => {
      try {
        const { senderId, room, text } = data;
        const message   = await Message.create({ sender: senderId, room, text });
        const populated = await message.populate('sender', 'username avatar');
        io.to(room).emit('message:receive', populated);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('message:private', async (data) => {
      try {
        const { senderId, receiverId, text } = data;
        const message   = await Message.create({ sender: senderId, receiver: receiverId, text });
        const populated = await message.populate('sender', 'username avatar');

        const receiverEntry = [...onlineUsers.entries()]
          .find(([, uid]) => uid === receiverId);

        if (receiverEntry) {
          io.to(receiverEntry[0]).emit('message:receive', populated);
        }
        socket.emit('message:receive', populated);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send private message' });
      }
    });

    socket.on('typing:start', (data) => {
      socket.to(data.room).emit('typing:start', { userId: data.userId });
    });

    socket.on('typing:stop', (data) => {
      socket.to(data.room).emit('typing:stop', { userId: data.userId });
    });

    socket.on('message:seen', async (messageId) => {
      await Message.findByIdAndUpdate(messageId, {
        seen: true,
        seenAt: new Date(),
      });
      socket.broadcast.emit('message:seen', { messageId });
    });

    socket.on('disconnect', async () => {
      const userId = onlineUsers.get(socket.id);
      if (userId) {
        onlineUsers.delete(socket.id);
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
          socketId: null,
        });
        io.emit('user:offline', userId);
      }
    });
  });
};
