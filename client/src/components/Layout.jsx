import { Link } from 'react-router-dom';

export default function Layout({ children, showLogo = true }) {
  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-8">
      {showLogo && (
        <header className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-2xl font-black text-brand-600">بكره على حرف</h1>
            <p className="text-sm text-gray-500">لعبة جماعية سريعة</p>
          </Link>
        </header>
      )}
      {children}
    </div>
  );
}
