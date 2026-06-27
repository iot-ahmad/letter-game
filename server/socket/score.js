import { normalizeAnswer } from './utils.js';

export const POINTS = {
  correct: 10,
  duplicate: 5,
  wrong: 0,
  empty: 0,
};

export function detectDuplicates(answersByPlayer, category) {
  const groups = new Map();

  for (const [playerId, answers] of Object.entries(answersByPlayer)) {
    const raw = (answers[category] || '').trim();
    if (!raw) continue;

    const key = normalizeAnswer(raw);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ playerId, raw });
  }

  const duplicatePlayerIds = new Set();
  for (const entries of groups.values()) {
    if (entries.length > 1) {
      entries.forEach((e) => duplicatePlayerIds.add(e.playerId));
    }
  }

  return duplicatePlayerIds;
}

export function computeRoundScores(room) {
  const { categories, answers, reviews, players } = room;
  const roundScores = {};
  players.forEach((p) => {
    roundScores[p.id] = 0;
  });

  for (const category of categories) {
    const duplicateIds = detectDuplicates(answers, category);

    for (const player of players) {
      const raw = (answers[player.id]?.[category] || '').trim();
      if (!raw) continue;

      const isDuplicate = duplicateIds.has(player.id);
      const votes = getVotesForAnswer(room, player.id, category);
      const isCorrect = resolveCorrectness(votes, players.length);

      let points = POINTS.wrong;
      if (isCorrect) {
        points = isDuplicate ? POINTS.duplicate : POINTS.correct;
      }

      roundScores[player.id] += points;
    }
  }

  return roundScores;
}

function getVotesForAnswer(room, targetPlayerId, category) {
  const key = `${targetPlayerId}:${category}`;
  const votes = { correct: 0, wrong: 0 };

  for (const [reviewerId, reviewMap] of Object.entries(room.reviews)) {
    if (reviewerId === targetPlayerId) continue;
    const vote = reviewMap[key];
    if (vote === 'correct') votes.correct++;
    if (vote === 'wrong') votes.wrong++;
  }

  return votes;
}

function resolveCorrectness(votes, playerCount) {
  const voters = playerCount - 1;
  if (voters <= 0) return true;
  if (votes.wrong > votes.correct) return false;
  if (votes.correct > 0) return true;
  return true;
}

export function applyRoundScores(room, roundScores) {
  room.players.forEach((player) => {
    player.score += roundScores[player.id] || 0;
  });
}

export function getSortedPlayers(players) {
  return [...players].sort((a, b) => b.score - a.score);
}
