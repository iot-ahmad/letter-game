import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerGameHandlers } from './socket/game.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'بكره على حرف — السيرفر يعمل' });
});

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : []),
];

app.use(
  cors({
    origin: allowedOrigins,
  })
);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
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
