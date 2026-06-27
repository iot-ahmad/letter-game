import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useGame } from '../context/GameContext';

export default function JoinRoom() {
  const navigate = useNavigate();
  const { joinRoom, error, clearError } = useGame();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (!name.trim() || !roomCode.trim()) return;

    setLoading(true);
    try {
      await joinRoom({
        playerName: name.trim(),
        roomCode: roomCode.trim().toUpperCase(),
      });
      navigate('/lobby');
    } catch {
      /* error in context */
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <form onSubmit={handleSubmit} className="card space-y-5">
        <h2 className="text-xl font-bold text-brand-900">الانضمام لغرفة</h2>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-600">اسم اللاعب</label>
          <input
            className="input-field"
            placeholder="علي"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-600">كود الغرفة</label>
          <input
            className="input-field text-center font-mono text-lg tracking-widest uppercase"
            placeholder="XK8P2A"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
            required
          />
        </div>

        {error && <p className="text-center text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !name.trim() || roomCode.trim().length < 6}
        >
          {loading ? 'جاري الانضمام...' : 'انضم'}
        </button>
      </form>
    </Layout>
  );
}
