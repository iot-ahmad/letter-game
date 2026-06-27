const MEDALS = ['🥇', '🥈', '🥉'];

export default function ScoreBoard({ players, showRoundScore = false }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-2">
      {sorted.map((player, i) => (
        <div
          key={player.id}
          className="flex items-center justify-between rounded-xl border-2 border-surface-border bg-white px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <span className="w-8 text-center text-xl">
              {i < 3 ? MEDALS[i] : <span className="text-sm text-gray-400">{i + 1}</span>}
            </span>
            <span className="font-bold text-brand-900">{player.name}</span>
          </div>
          <div className="text-left">
            <span className="text-lg font-black text-brand-600">{player.score}</span>
            {showRoundScore && player.roundScore != null && (
              <span className="mr-2 text-sm text-gray-500">(+{player.roundScore})</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
