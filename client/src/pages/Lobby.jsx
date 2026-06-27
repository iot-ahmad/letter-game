import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PlayerCard from '../components/PlayerCard';
import { useGame } from '../context/GameContext';

export default function Lobby() {
  const navigate = useNavigate();
  const { room, isHost, startGame, leaveRoom, error } = useGame();

  useEffect(() => {
    if (!room) {
      navigate('/');
      return;
    }
    if (room.status === 'playing') navigate('/game');
    if (room.status === 'reviewing') navigate('/review');
    if (room.status === 'roundResults') navigate('/results');
    if (room.status === 'finished') navigate('/results');
  }, [room, navigate]);

  if (!room) return null;

  const handleStart = async () => {
    try {
      await startGame();
      navigate('/game');
    } catch {
      /* shown in error */
    }
  };

  const handleLeave = async () => {
    await leaveRoom();
    navigate('/');
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(room.code);
  };

  return (
    <Layout showLogo={false}>
      <div className="card space-y-5">
        <div className="text-center">
          <p className="text-sm text-gray-500">غرفة الانتظار</p>
          <button
            onClick={copyCode}
            className="mt-1 font-mono text-3xl font-black tracking-widest text-brand-600"
            title="نسخ الكود"
          >
            {room.code}
          </button>
          <p className="mt-1 text-xs text-gray-400">اضغط لنسخ الكود</p>
        </div>

        <div className="space-y-2">
          {room.players.map((p) => (
            <PlayerCard
              key={p.id}
              name={p.name}
              isHost={p.isHost}
              finished={false}
            />
          ))}
        </div>

        <p className="text-center text-sm text-gray-500">
          عدد اللاعبين: {room.players.length}
        </p>

        {error && <p className="text-center text-sm text-red-500">{error}</p>}

        {isHost ? (
          <button
            className="btn-primary"
            onClick={handleStart}
            disabled={room.players.length < 2}
          >
            بدء اللعبة
          </button>
        ) : (
          <p className="text-center text-sm text-gray-500">في انتظار المضيف لبدء اللعبة...</p>
        )}

        <button className="btn-secondary" onClick={handleLeave}>
          مغادرة الغرفة
        </button>
      </div>
    </Layout>
  );
}
