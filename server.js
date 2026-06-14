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

// ── CORS ────────────────────────────────────────────────────────
// Explicit allowlist (comma-separated) plus any localhost port in dev, so
// multiple panels (e.g. :3000 and :3001) can connect without reconfiguring.
const allowedOrigins = (process.env.CLIENT_URL ?? 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOrigin = (origin, callback) => {
  // allow non-browser requests (curl, server-to-server) with no Origin header
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  // allow any localhost / 127.0.0.1 origin (any port) during local dev
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return callback(null, true);
  }
  return callback(new Error(`Origin not allowed by CORS: ${origin}`));
};

// ── Socket.IO ───────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:      corsOrigin,
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
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── REST Routes ─────────────────────────────────────────────────
app.use('/api/conversations', require('./routes/conversationRoutes'));
app.use('/api/messages',      require('./routes/messageRoutes'));
app.use('/api/users',         require('./routes/userRoutes'));
app.use('/api/businesses',    require('./routes/businessRoutes'));

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
