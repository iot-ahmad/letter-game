import {
  getRoomBySocket,
  createRoom,
  joinRoom,
  removePlayer,
  serializeRoom,
  serializeReviewData,
  serializeRoundResults,
  startGame,
  prepareNextRound,
  resetRoomForReplay,
} from './rooms.js';
import { startRoundTimer, clearRoundTimer } from './timer.js';
import { computeRoundScores, applyRoundScores } from './score.js';

function emitRoomUpdate(io, room, viewerId = null) {
  io.to(room.code).emit('room-update', serializeRoom(room, viewerId));
}

function beginPlayingRound(io, room) {
  startRoundTimer(room, io, () => endPlayingPhase(io, room));
  emitRoomUpdate(io, room);
  io.to(room.code).emit('round-started', {
    round: room.currentRound,
    letter: room.letter,
    roundDuration: room.roundDuration,
    categories: room.categories,
  });
}

function endPlayingPhase(io, room) {
  if (room.status !== 'playing') return;

  clearRoundTimer(room.code);
  room.status = 'reviewing';
  room.players.forEach((p) => {
    p.finished = true;
  });

  io.to(room.code).emit('round-ended');
  io.to(room.code).emit('review-start', serializeReviewData(room));
  emitRoomUpdate(io, room);
}

function checkAllFinished(room) {
  return room.finishedPlayers.size >= room.players.length;
}

function checkAllReviewed(room) {
  const votesPerReviewer = (room.players.length - 1) * room.categories.length;

  for (const player of room.players) {
    const reviewMap = room.reviews[player.id] || {};
    let count = 0;
    for (const other of room.players) {
      if (other.id === player.id) continue;
      for (const cat of room.categories) {
        const answer = (room.answers[other.id]?.[cat] || '').trim();
        if (!answer) continue;
        if (reviewMap[`${other.id}:${cat}`]) count++;
      }
    }
    if (count < votesPerReviewer) return false;
  }

  return room.players.length > 0;
}

function finishReviewPhase(io, room) {
  if (room.status !== 'reviewing') return;

  const roundScores = computeRoundScores(room);
  applyRoundScores(room, roundScores);

  if (room.currentRound >= room.rounds) {
    room.status = 'finished';
    io.to(room.code).emit('game-finished', {
      players: room.players
        .map((p) => ({ id: p.id, name: p.name, score: p.score }))
        .sort((a, b) => b.score - a.score),
      winner: room.players.reduce((best, p) => (p.score > best.score ? p : best)),
    });
  } else {
    room.status = 'roundResults';
    io.to(room.code).emit('round-results', serializeRoundResults(room, roundScores));
  }

  emitRoomUpdate(io, room);
}

export function registerGameHandlers(io, socket) {
  socket.on('create-room', (data, callback) => {
    const { room, player } = createRoom(socket, data);
    callback?.({ success: true, room: serializeRoom(room, player.id), playerId: player.id });
    emitRoomUpdate(io, room);
  });

  socket.on('join-room', (data, callback) => {
    const result = joinRoom(socket, data);
    if (result.error) {
      callback?.({ success: false, error: result.error });
      return;
    }
    const { room, player } = result;
    callback?.({ success: true, room: serializeRoom(room, player.id), playerId: player.id });
    emitRoomUpdate(io, room);
  });

  socket.on('start-game', (callback) => {
    const room = getRoomBySocket(socket.id);
    if (!room) return callback?.({ success: false, error: 'غير متصل بغرفة' });

    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player || player.id !== room.hostId) {
      return callback?.({ success: false, error: 'فقط المضيف يمكنه بدء اللعبة' });
    }
    if (room.players.length < 2) {
      return callback?.({ success: false, error: 'يجب وجود لاعبين على الأقل' });
    }

    startGame(room);
    callback?.({ success: true });
    beginPlayingRound(io, room);
  });

  socket.on('update-answers', ({ answers }) => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.status !== 'playing') return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player || player.finished) return;

    room.answers[player.id] = { ...room.answers[player.id], ...answers };
  });

  socket.on('player-finished', (callback) => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.status !== 'playing') return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player || player.finished) return;

    player.finished = true;
    room.finishedPlayers.add(player.id);

    io.to(room.code).emit('player-finished', {
      playerId: player.id,
      finishedCount: room.finishedPlayers.size,
      totalPlayers: room.players.length,
    });

    callback?.({ success: true });

    if (checkAllFinished(room)) {
      endPlayingPhase(io, room);
    } else {
      emitRoomUpdate(io, room);
    }
  });

  socket.on('submit-review', ({ reviews }, callback) => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.status !== 'reviewing') return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;

    room.reviews[player.id] = { ...room.reviews[player.id], ...reviews };

    io.to(room.code).emit('review-progress', {
      reviewerId: player.id,
      reviews: room.reviews[player.id],
    });

    callback?.({ success: true });

    if (checkAllReviewed(room)) {
      finishReviewPhase(io, room);
    }
  });

  socket.on('next-round', (callback) => {
    const room = getRoomBySocket(socket.id);
    if (!room) return callback?.({ success: false, error: 'غير متصل بغرفة' });

    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player || player.id !== room.hostId) {
      return callback?.({ success: false, error: 'فقط المضيف يمكنه المتابعة' });
    }
    if (room.status !== 'roundResults') {
      return callback?.({ success: false, error: 'ليست مرحلة النتائج' });
    }

    prepareNextRound(room);
    callback?.({ success: true });
    beginPlayingRound(io, room);
  });

  socket.on('replay-game', (callback) => {
    const room = getRoomBySocket(socket.id);
    if (!room) return callback?.({ success: false, error: 'غير متصل بغرفة' });

    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player || player.id !== room.hostId) {
      return callback?.({ success: false, error: 'فقط المضيف يمكنه إعادة اللعب' });
    }

    resetRoomForReplay(room);
    callback?.({ success: true });
    emitRoomUpdate(io, room);
  });

  socket.on('leave-room', (callback) => {
    const result = removePlayer(socket.id);
    if (!result) return callback?.({ success: true });

    socket.leave(result.code);

    if (result.deleted) {
      callback?.({ success: true, deleted: true });
      return;
    }

    io.to(result.code).emit('player-left', {
      playerId: result.removed.id,
      playerName: result.removed.name,
    });
    emitRoomUpdate(io, result.room);
    callback?.({ success: true });
  });

  socket.on('disconnect', () => {
    const result = removePlayer(socket.id);
    if (!result || result.deleted) return;

    io.to(result.code).emit('player-left', {
      playerId: result.removed.id,
      playerName: result.removed.name,
    });
    emitRoomUpdate(io, result.room);
  });
}
