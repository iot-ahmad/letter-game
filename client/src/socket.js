import { io } from 'socket.io-client';

const rawSocketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
const SOCKET_URL =
  rawSocketUrl.startsWith('http://') || rawSocketUrl.startsWith('https://')
    ? rawSocketUrl
    : `https://${rawSocketUrl}`;

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
