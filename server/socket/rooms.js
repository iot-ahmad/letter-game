import { generateRoomCode, generatePlayerId, sanitizePlayerName, normalizeAnswer } from './utils.js';
import { DEFAULT_CATEGORIES, pickRandomLetter } from './letters.js';
import { clearRoundTimer } from './timer.js';

const rooms = new Map();
const socketToRoom = new Map();

export function getRoom(code) {
  return rooms.get(code?.toUpperCase());
}

export function getRoomBySocket(socketId) {
  const code = socketToRoom.get(socketId);
  return code ? rooms.get(code) : null;
}

export function createRoom(socket, { playerName, rounds, roundDuration, categories }) {
  const code = generateRoomCode(new Set(rooms.keys()));
  const player = {
    id: generatePlayerId(),
    name: sanitizePlayerName(playerName),
    score: 0,
    socketId: socket.id,
    isHost: true,
    finished: false,
  };

  const room = {
    code,
    hostId: player.id,
    players: [player],
    rounds: rounds || 5,
    roundDuration: roundDuration || 60,
    categories: categories?.length ? categories : [...DEFAULT_CATEGORIES],
    status: 'lobby',
    currentRound: 0,
    letter: null,
    usedLetters: [],
    answers: {},
    reviews: {},
    finishedPlayers: new Set(),
    timerEndsAt: null,
    timeLeft: roundDuration || 60,
    createdAt: Date.now(),
  };

  rooms.set(code, room);
  socketToRoom.set(socket.id, code);
  socket.join(code);

  return { room, player };
}

export function joinRoom(socket, { roomCode, playerName }) {
  const code = roomCode?.toUpperCase();
  const room = rooms.get(code);

  if (!room) return { error: 'الغرفة غير موجودة' };
  if (room.status !== 'lobby') return { error: 'اللعبة بدأت بالفعل' };
  if (room.players.length >= 8) return { error: 'الغرفة ممتلئة (8 لاعبين كحد أقصى)' };

  const existing = room.players.find((p) => p.name === sanitizePlayerName(playerName));
  if (existing) return { error: 'الاسم مستخدم في هذه الغرفة' };

  const player = {
    id: generatePlayerId(),
    name: sanitizePlayerName(playerName),
    score: 0,
    socketId: socket.id,
    isHost: false,
    finished: false,
  };

  room.players.push(player);
  socketToRoom.set(socket.id, code);
  socket.join(code);

  return { room, player };
}

export function startGame(room) {
  if (room.status !== 'lobby') return null;

  room.status = 'playing';
  room.currentRound = 1;
  room.letter = pickRandomLetter(room.usedLetters);
  room.usedLetters.push(room.letter);
  room.answers = {};
  room.reviews = {};
  room.finishedPlayers = new Set();
  room.players.forEach((p) => {
    p.finished = false;
    room.answers[p.id] = {};
  });

  return room;
}

export function prepareNextRound(room) {
  if (room.currentRound >= room.rounds) {
    room.status = 'finished';
    return room;
  }

  room.currentRound += 1;
  room.status = 'playing';
  room.letter = pickRandomLetter(room.usedLetters);
  room.usedLetters.push(room.letter);
  room.answers = {};
  room.reviews = {};
  room.finishedPlayers = new Set();
  room.players.forEach((p) => {
    p.finished = false;
    room.answers[p.id] = {};
  });

  return room;
}

export function removePlayer(socketId) {
  const code = socketToRoom.get(socketId);
  if (!code) return null;

  const room = rooms.get(code);
  if (!room) {
    socketToRoom.delete(socketId);
    return null;
  }

  const playerIndex = room.players.findIndex((p) => p.socketId === socketId);
  if (playerIndex === -1) {
    socketToRoom.delete(socketId);
    return null;
  }

  const removed = room.players.splice(playerIndex, 1)[0];
  socketToRoom.delete(socketId);

  if (room.players.length === 0) {
    clearRoundTimer(code);
    rooms.delete(code);
    return { room: null, removed, deleted: true, code };
  }

  if (removed.id === room.hostId) {
    room.hostId = room.players[0].id;
    room.players[0].isHost = true;
    room.players.slice(1).forEach((p) => {
      p.isHost = false;
    });
  }

  return { room, removed, deleted: false, code };
}

export function serializeRoom(room, viewerId = null) {
  if (!room) return null;

  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    rounds: room.rounds,
    roundDuration: room.roundDuration,
    categories: room.categories,
    currentRound: room.currentRound,
    letter: room.status === 'lobby' ? null : room.letter,
    timeLeft: room.timeLeft,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isHost: p.id === room.hostId,
      finished: p.finished,
    })),
    viewerId,
    finishedCount: room.finishedPlayers.size,
    totalPlayers: room.players.length,
  };
}

export function serializeReviewData(room) {
  const duplicateMap = {};

  for (const category of room.categories) {
    const groups = new Map();
    for (const player of room.players) {
      const raw = (room.answers[player.id]?.[category] || '').trim();
      if (!raw) continue;
      const key = normalizeAnswer(raw);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(player.id);
    }

    for (const ids of groups.values()) {
      if (ids.length > 1) {
        ids.forEach((id) => {
          if (!duplicateMap[id]) duplicateMap[id] = {};
          duplicateMap[id][category] = true;
        });
      }
    }
  }

  return {
    categories: room.categories,
    players: room.players.map((p) => ({ id: p.id, name: p.name })),
    answers: room.answers,
    duplicateMap,
    reviews: room.reviews,
  };
}

export function serializeRoundResults(room, roundScores) {
  return {
    round: room.currentRound,
    letter: room.letter,
    roundScores,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      roundScore: roundScores[p.id] || 0,
    })),
    isLastRound: room.currentRound >= room.rounds,
  };
}

export function resetRoomForReplay(room) {
  room.status = 'lobby';
  room.currentRound = 0;
  room.letter = null;
  room.usedLetters = [];
  room.answers = {};
  room.reviews = {};
  room.finishedPlayers = new Set();
  room.players.forEach((p) => {
    p.score = 0;
    p.finished = false;
  });
  clearRoundTimer(room.code);
}
