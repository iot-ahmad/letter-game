import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { connectSocket, getSocket } from '../socket';

const GameContext = createContext(null);

const STORAGE_KEY = 'letter_game_session';

function loadSession() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveSession(data) {
  try {
    if (data) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function GameProvider({ children }) {
  const [playerId, setPlayerId] = useState(() => loadSession()?.playerId || null);
  const [room, setRoom] = useState(() => loadSession()?.room || null);
  const [reviewData, setReviewData] = useState(null);
  const [roundResults, setRoundResults] = useState(null);
  const [gameFinished, setGameFinished] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [error, setError] = useState('');

  useEffect(() => {
    if (playerId && room) saveSession({ playerId, room });
    else saveSession(null);
  }, [playerId, room]);

  useEffect(() => {
    const socket = connectSocket();

    socket.on('room-update', (updatedRoom) => {
      setRoom((prev) => ({ ...prev, ...updatedRoom, viewerId: playerId }));
      if (updatedRoom.timeLeft != null) setTimeLeft(updatedRoom.timeLeft);
    });

    socket.on('timer-tick', ({ timeLeft: t }) => setTimeLeft(t));

    socket.on('round-started', ({ roundDuration }) => {
      setTimeLeft(roundDuration);
      setReviewData(null);
      setRoundResults(null);
    });

    socket.on('round-ended', () => {
      setTimeLeft(0);
    });

    socket.on('review-start', (data) => {
      setReviewData(data);
    });

    socket.on('round-results', (data) => {
      setRoundResults(data);
      setReviewData(null);
    });

    socket.on('game-finished', (data) => {
      setGameFinished(data);
      setRoundResults(null);
      setReviewData(null);
    });

    socket.on('player-left', () => {
      /* room-update handles state */
    });

    return () => {
      socket.off('room-update');
      socket.off('timer-tick');
      socket.off('round-started');
      socket.off('round-ended');
      socket.off('review-start');
      socket.off('round-results');
      socket.off('game-finished');
      socket.off('player-left');
    };
  }, [playerId]);

  const createRoom = useCallback((settings) => {
    return new Promise((resolve, reject) => {
      const socket = connectSocket();
      socket.emit('create-room', settings, (res) => {
        if (!res?.success) {
          setError(res?.error || 'فشل إنشاء الغرفة');
          reject(new Error(res?.error));
          return;
        }
        setPlayerId(res.playerId);
        setRoom(res.room);
        setError('');
        resolve(res);
      });
    });
  }, []);

  const joinRoom = useCallback(({ playerName, roomCode }) => {
    return new Promise((resolve, reject) => {
      const socket = connectSocket();
      socket.emit('join-room', { playerName, roomCode }, (res) => {
        if (!res?.success) {
          setError(res?.error || 'فشل الانضمام');
          reject(new Error(res?.error));
          return;
        }
        setPlayerId(res.playerId);
        setRoom(res.room);
        setError('');
        resolve(res);
      });
    });
  }, []);

  const startGame = useCallback(() => {
    return new Promise((resolve, reject) => {
      getSocket().emit('start-game', (res) => {
        if (!res?.success) {
          setError(res?.error || 'فشل بدء اللعبة');
          reject(new Error(res?.error));
          return;
        }
        setError('');
        resolve(res);
      });
    });
  }, []);

  const leaveRoom = useCallback(() => {
    return new Promise((resolve) => {
      getSocket().emit('leave-room', () => {
        setPlayerId(null);
        setRoom(null);
        setReviewData(null);
        setRoundResults(null);
        setGameFinished(null);
        saveSession(null);
        resolve();
      });
    });
  }, []);

  const clearError = useCallback(() => setError(''), []);

  const isHost = room?.hostId === playerId;

  return (
    <GameContext.Provider
      value={{
        playerId,
        room,
        reviewData,
        roundResults,
        gameFinished,
        timeLeft,
        error,
        isHost,
        createRoom,
        joinRoom,
        startGame,
        leaveRoom,
        clearError,
        setGameFinished,
        setRoundResults,
        setReviewData,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
