import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useGame } from '../context/GameContext';
import { getSocket } from '../socket';

export default function Review() {
  const navigate = useNavigate();
  const { room, reviewData, playerId } = useGame();
  const [votes, setVotes] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!room) {
      navigate('/');
      return;
    }
    if (room.status === 'playing') navigate('/game');
    if (room.status === 'roundResults' || room.status === 'finished') navigate('/results');
    if (room.status === 'lobby') navigate('/lobby');
  }, [room, navigate]);

  useEffect(() => {
    setVotes({});
    setSubmitted(false);
  }, [reviewData]);

  if (!room || !reviewData) return null;

  const toggleVote = (targetPlayerId, category) => {
    if (submitted || targetPlayerId === playerId) return;

    const key = `${targetPlayerId}:${category}`;
    setVotes((prev) => {
      const current = prev[key];
      if (current === 'correct') return { ...prev, [key]: 'wrong' };
      if (current === 'wrong') {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: 'correct' };
    });
  };

  const handleSubmit = () => {
    getSocket().emit('submit-review', { reviews: votes }, (res) => {
      if (res?.success) setSubmitted(true);
    });
  };

  const others = reviewData.players.filter((p) => p.id !== playerId);
  const allVoted =
    others.every((player) =>
      reviewData.categories.every((cat) => {
        const answer = (reviewData.answers[player.id]?.[cat] || '').trim();
        if (!answer) return true;
        return votes[`${player.id}:${cat}`];
      })
    );

  return (
    <Layout showLogo={false}>
      <div className="space-y-5">
        <div className="card text-center">
          <h2 className="text-xl font-bold text-brand-900">مراجعة الإجابات</h2>
          <p className="mt-1 text-sm text-gray-500">
            الحرف: <span className="font-black text-brand-600">{room.letter}</span>
          </p>
          <p className="mt-2 text-xs text-gray-400">
            اضغط على الإجابة: ✅ صحيح → ❌ خطأ → بدون تصويت
          </p>
        </div>

        {reviewData.categories.map((category) => (
          <div key={category} className="card">
            <h3 className="mb-3 font-bold text-brand-700">{category}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border text-gray-500">
                    <th className="pb-2 text-right font-semibold">اللاعب</th>
                    <th className="pb-2 text-right font-semibold">الإجابة</th>
                    <th className="pb-2 text-center font-semibold">تصويتك</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewData.players.map((player) => {
                    const answer = (reviewData.answers[player.id]?.[category] || '').trim();
                    const isMe = player.id === playerId;
                    const isDup = reviewData.duplicateMap[player.id]?.[category];
                    const voteKey = `${player.id}:${category}`;
                    const vote = votes[voteKey];

                    return (
                      <tr key={player.id} className="border-b border-surface-border/50">
                        <td className="py-2 font-medium">{player.name}</td>
                        <td className="py-2 text-gray-600">
                          {answer || '—'}
                          {isDup && answer && (
                            <span className="mr-1 text-xs text-amber-600">🔁 مكرر</span>
                          )}
                        </td>
                        <td className="py-2 text-center">
                          {isMe || !answer ? (
                            <span className="text-gray-300">—</span>
                          ) : (
                            <button
                              onClick={() => toggleVote(player.id, category)}
                              disabled={submitted}
                              className={`rounded-lg px-3 py-1 text-lg transition ${
                                vote === 'correct'
                                  ? 'bg-green-100'
                                  : vote === 'wrong'
                                    ? 'bg-red-100'
                                    : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                            >
                              {vote === 'correct' ? '✅' : vote === 'wrong' ? '❌' : '—'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {!submitted ? (
          <button className="btn-primary" onClick={handleSubmit} disabled={!allVoted}>
            تأكيد المراجعة
          </button>
        ) : (
          <div className="card text-center text-gray-500">
            <p className="font-semibold">تم إرسال مراجعتك</p>
            <p className="mt-1 text-sm">في انتظار بقية اللاعبين...</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
