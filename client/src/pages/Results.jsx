import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ScoreBoard from '../components/ScoreBoard';
import { useGame } from '../context/GameContext';
import { getSocket } from '../socket';

export default function Results() {
  const navigate = useNavigate();
  const {
    room,
    roundResults,
    gameFinished,
    isHost,
    leaveRoom,
    setGameFinished,
    setRoundResults,
  } = useGame();

  useEffect(() => {
    if (!room) {
      navigate('/');
      return;
    }
    if (room.status === 'lobby') navigate('/lobby');
    if (room.status === 'playing') navigate('/game');
    if (room.status === 'reviewing') navigate('/review');
  }, [room, navigate]);

  if (!room) return null;

  const isGameOver = room.status === 'finished' || gameFinished;
  const players = isGameOver
    ? gameFinished?.players || room.players
    : roundResults?.players || room.players;

  const winner = isGameOver
    ? gameFinished?.winner || players[0]
    : null;

  const handleNextRound = () => {
    getSocket().emit('next-round', (res) => {
      if (res?.success) {
        setRoundResults(null);
        navigate('/game');
      }
    });
  };

  const handleReplay = () => {
    getSocket().emit('replay-game', (res) => {
      if (res?.success) {
        setGameFinished(null);
        setRoundResults(null);
        navigate('/lobby');
      }
    });
  };

  const handleHome = async () => {
    await leaveRoom();
    navigate('/');
  };

  return (
    <Layout showLogo={false}>
      <div className="space-y-5">
        {isGameOver ? (
          <div className="card text-center">
            <p className="text-4xl">🏆</p>
            <h2 className="mt-2 text-2xl font-black text-brand-900">الفائز</h2>
            <p className="mt-2 text-3xl font-black text-brand-600">{winner?.name}</p>
            <p className="text-gray-500">{winner?.score} نقطة</p>
          </div>
        ) : (
          <div className="card text-center">
            <h2 className="text-xl font-bold text-brand-900">نتائج الجولة {roundResults?.round}</h2>
            <p className="mt-1 text-sm text-gray-500">
              الحرف: <span className="font-black text-brand-600">{roundResults?.letter}</span>
            </p>
          </div>
        )}

        <ScoreBoard players={players} showRoundScore={!isGameOver} />

        {isGameOver ? (
          <div className="space-y-2">
            {isHost && (
              <button className="btn-primary" onClick={handleReplay}>
                إعادة اللعب
              </button>
            )}
            <button className="btn-secondary" onClick={handleHome}>
              العودة للرئيسية
            </button>
          </div>
        ) : (
          isHost && (
            <button className="btn-primary" onClick={handleNextRound}>
              الجولة التالية
            </button>
          )
        )}

        {!isGameOver && !isHost && (
          <p className="text-center text-sm text-gray-500">في انتظار المضيف للمتابعة...</p>
        )}
      </div>
    </Layout>
  );
}
