import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerGameHandlers } from './socket/game.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

function parseOrigins(value) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) =>
      entry.startsWith('http://') || entry.startsWith('https://')
        ? entry
        : `https://${entry}`
    );
}

function isAllowedOrigin(origin) {
  if (!origin) return true;

  const allowed = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...(process.env.CLIENT_URL ? parseOrigins(process.env.CLIENT_URL) : []),
  ];

  if (allowed.includes(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    if (process.env.NODE_ENV !== 'production') return false;

    const allowedProductionHosts = ['.onrender.com', '.web.app', '.firebaseapp.com'];
    return allowedProductionHosts.some((suffix) => hostname.endsWith(suffix));
  } catch {
    return false;
  }
}

const corsOptions = {
  origin: (origin, callback) => {
    callback(null, isAllowedOrigin(origin));
  },
};

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    name: 'letter-game-server',
    message: 'السيرفر يعمل — العميل يتصل عبر Socket.io',
    health: '/api/health',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'بكره على حرف — السيرفر يعمل' });
});

app.use(cors(corsOptions));

const io = new Server(httpServer, {
  cors: {
    ...corsOptions,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`متصل: ${socket.id}`);
  registerGameHandlers(io, socket);
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`السيرفر يعمل على المنفذ ${PORT}`);
});
