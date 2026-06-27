export default function Timer({ timeLeft, total = 60 }) {
  const urgent = timeLeft <= 10 && timeLeft > 0;
  const pct = total > 0 ? (timeLeft / total) * 100 : 0;

  return (
    <div className="text-center">
      <div
        className={`mb-2 text-5xl font-black tabular-nums transition-colors ${
          urgent ? 'text-red-500' : 'text-brand-600'
        }`}
      >
        {timeLeft}
      </div>
      <div className="mx-auto h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-border">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            urgent ? 'bg-red-500' : 'bg-brand-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-sm text-gray-500">ثانية</p>
    </div>
  );
}
