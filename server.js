require('dotenv').config();
const express      = require('express');
const http         = require('http');
const { Server }   = require('socket.io');
const cors         = require('cors');
const path         = require('path');

const { connect }  = require('./config/db');
const socketInit   = require('./socket/index');
const errorHandler = require('./middleware/errorHandler');

const app    = express();
const server = http.createServer(app);

// ── Socket.IO ───────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL ?? 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

const io = new Server(server, {
  cors: {
    origin:      allowedOrigins,
    methods:     ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// shared online-users map (socketId → userId)
const onlineUsers = new Map();

// make io & onlineUsers accessible in controllers via req.app.get()
app.set('io', io);
app.set('onlineUsers', onlineUsers);

// ── Middleware ──────────────────────────────────────────────────
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── REST Routes ─────────────────────────────────────────────────
app.use('/api/conversations', require('./routes/conversationRoutes'));
app.use('/api/messages',      require('./routes/messageRoutes'));
app.use('/api/users',         require('./routes/userRoutes'));

// health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── Error Handler ───────────────────────────────────────────────
app.use(errorHandler);

// ── Socket Events ───────────────────────────────────────────────
socketInit(io, onlineUsers);

// ── Start ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
connect().then(() => {
  server.listen(PORT, () => console.log(`[server] running on port ${PORT}`));
});
