import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useGame } from '../context/GameContext';

const ALL_CATEGORIES = [
  'الاسم',
  'الحيوان',
  'النبات',
  'الجماد',
  'الدولة',
  'المدينة',
  'المهنة',
];

const ROUND_OPTIONS = [3, 5, 10];
const DURATION_OPTIONS = [30, 60, 90];

export default function CreateRoom() {
  const navigate = useNavigate();
  const { createRoom, error, clearError } = useGame();
  const [name, setName] = useState('');
  const [rounds, setRounds] = useState(5);
  const [roundDuration, setRoundDuration] = useState(60);
  const [categories, setCategories] = useState([...ALL_CATEGORIES]);
  const [loading, setLoading] = useState(false);

  const toggleCategory = (cat) => {
    setCategories((prev) => {
      if (prev.includes(cat)) {
        if (prev.length <= 1) return prev;
        return prev.filter((c) => c !== cat);
      }
      return [...prev, cat];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await createRoom({
        playerName: name.trim(),
        rounds,
        roundDuration,
        categories,
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
        <h2 className="text-xl font-bold text-brand-900">إنشاء غرفة</h2>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-600">اسم اللاعب</label>
          <input
            className="input-field"
            placeholder="أحمد"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-600">عدد الجولات</label>
          <div className="flex gap-2">
            {ROUND_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRounds(n)}
                className={`flex-1 rounded-xl border-2 py-2 font-bold transition ${
                  rounds === n
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-surface-border text-gray-600'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-600">مدة الجولة</label>
          <div className="flex gap-2">
            {DURATION_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRoundDuration(n)}
                className={`flex-1 rounded-xl border-2 py-2 font-bold transition ${
                  roundDuration === n
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-surface-border text-gray-600'
                }`}
              >
                {n} ث
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-600">الفئات</label>
          <div className="space-y-2">
            {ALL_CATEGORIES.map((cat) => (
              <label
                key={cat}
                className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-surface-border px-4 py-2"
              >
                <input
                  type="checkbox"
                  checked={categories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="h-5 w-5 accent-brand-600"
                />
                <span className="font-medium">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-center text-sm text-red-500">{error}</p>}

        <button type="submit" className="btn-primary" disabled={loading || !name.trim()}>
          {loading ? 'جاري الإنشاء...' : 'إنشاء'}
        </button>
      </form>
    </Layout>
  );
}
