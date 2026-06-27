import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Timer from '../components/Timer';
import InputCard from '../components/InputCard';
import { useGame } from '../context/GameContext';
import { getSocket } from '../socket';

export default function Game() {
  const navigate = useNavigate();
  const { room, playerId, timeLeft } = useGame();
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!room) {
      navigate('/');
      return;
    }
    if (room.status === 'lobby') navigate('/lobby');
    if (room.status === 'reviewing') navigate('/review');
    if (room.status === 'roundResults' || room.status === 'finished') navigate('/results');
  }, [room, navigate]);

  useEffect(() => {
    setAnswers({});
    setFinished(false);
    setSubmitting(false);
  }, [room?.currentRound, room?.letter]);

  const updateAnswer = useCallback(
    (category, value) => {
      if (finished || room?.status !== 'playing') return;
      setAnswers((prev) => {
        const next = { ...prev, [category]: value };
        getSocket().emit('update-answers', { answers: { [category]: value } });
        return next;
      });
    },
    [finished, room?.status]
  );

  const handleFinish = () => {
    if (submitting || finished) return;
    setSubmitting(true);
    getSocket().emit('player-finished', (res) => {
      if (res?.success) setFinished(true);
      setSubmitting(false);
    });
  };

  useEffect(() => {
    const me = room?.players?.find((p) => p.id === playerId);
    if (me?.finished) setFinished(true);
  }, [room?.players, playerId]);

  useEffect(() => {
    if (timeLeft === 0 && room?.status === 'playing') {
      setFinished(true);
    }
  }, [timeLeft, room?.status]);

  if (!room || room.status !== 'playing') return null;

  const locked = finished || timeLeft === 0;

  return (
    <Layout showLogo={false}>
      <div className="space-y-5">
        <div className="card text-center">
          <p className="text-sm text-gray-500">
            الجولة {room.currentRound} من {room.rounds}
          </p>
          <div className="my-4 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-brand-500 bg-brand-50 text-6xl font-black text-brand-600 mx-auto">
            {room.letter}
          </div>
          <Timer timeLeft={timeLeft} total={room.roundDuration} />
        </div>

        <div className="space-y-2">
          {room.categories.map((cat) => (
            <InputCard
              key={cat}
              label={cat}
              value={answers[cat] || ''}
              onChange={(v) => updateAnswer(cat, v)}
              disabled={locked}
            />
          ))}
        </div>

        {!locked ? (
          <button className="btn-primary" onClick={handleFinish} disabled={submitting}>
            {submitting ? 'جاري الإرسال...' : 'انتهيت'}
          </button>
        ) : (
          <div className="card text-center text-gray-500">
            <p className="font-semibold">
              {timeLeft === 0 ? 'انتهى الوقت!' : 'في انتظار بقية اللاعبين...'}
            </p>
            <p className="mt-1 text-sm">
              {room.finishedCount}/{room.totalPlayers} انتهوا
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
