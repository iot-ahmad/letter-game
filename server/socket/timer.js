const roomTimers = new Map();

export function startRoundTimer(room, io, onTimeUp) {
  clearRoundTimer(room.code);

  room.timerEndsAt = Date.now() + room.roundDuration * 1000;
  room.timeLeft = room.roundDuration;

  const interval = setInterval(() => {
    const remaining = Math.max(0, Math.ceil((room.timerEndsAt - Date.now()) / 1000));
    room.timeLeft = remaining;

    io.to(room.code).emit('timer-tick', { timeLeft: remaining });

    if (remaining <= 0) {
      clearRoundTimer(room.code);
      onTimeUp(room);
    }
  }, 250);

  roomTimers.set(room.code, interval);
}

export function clearRoundTimer(roomCode) {
  const interval = roomTimers.get(roomCode);
  if (interval) {
    clearInterval(interval);
    roomTimers.delete(roomCode);
  }
}

export function getTimeLeft(room) {
  if (!room.timerEndsAt) return room.roundDuration;
  return Math.max(0, Math.ceil((room.timerEndsAt - Date.now()) / 1000));
}
