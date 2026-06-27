export default function PlayerCard({ name, isHost, finished }) {
  return (
    <div className="flex items-center justify-between rounded-xl border-2 border-surface-border bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        {isHost && <span title="المضيف">👑</span>}
        <span className="font-semibold text-brand-900">{name}</span>
      </div>
      {finished && <span className="text-sm text-brand-600">✓ انتهى</span>}
    </div>
  );
}
