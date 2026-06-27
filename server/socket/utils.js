const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(existingCodes) {
  let code;
  do {
    code = Array.from({ length: 6 }, () =>
      CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
    ).join('');
  } while (existingCodes.has(code));
  return code;
}

export function generatePlayerId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeAnswer(value) {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

export function sanitizePlayerName(name) {
  return (name || '').trim().slice(0, 20);
}
