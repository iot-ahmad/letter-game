export default function InputCard({ label, value, onChange, disabled }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border-2 border-surface-border bg-white px-4 py-3">
      <span className="w-24 shrink-0 text-sm font-bold text-brand-700">{label}</span>
      <input
        type="text"
        className="flex-1 bg-transparent text-brand-900 outline-none placeholder:text-gray-400 disabled:opacity-50"
        placeholder="..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoComplete="off"
      />
    </div>
  );
}
