import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function Home() {
  return (
    <Layout>
      <div className="card space-y-4 text-center">
        <div className="py-6">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-brand-500 bg-brand-50 text-5xl font-black text-brand-600">
            ح
          </div>
          <p className="text-gray-600">
            ادخل اسمك، أنشئ غرفة أو انضم لأصدقائك، والعب!
          </p>
        </div>

        <Link to="/create" className="btn-primary block text-center no-underline">
          إنشاء غرفة
        </Link>
        <Link to="/join" className="btn-secondary block text-center no-underline">
          الانضمام لغرفة
        </Link>
      </div>
    </Layout>
  );
}
