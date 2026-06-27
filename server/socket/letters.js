export const LETTERS = 'أبتثجحخدذرزسشصضطظعغفقكلمنهوي'.split('');

export const DEFAULT_CATEGORIES = [
  'الاسم',
  'الحيوان',
  'النبات',
  'الجماد',
  'الدولة',
  'المدينة',
  'المهنة',
];

export function pickRandomLetter(usedLetters = []) {
  const available = LETTERS.filter((l) => !usedLetters.includes(l));
  const pool = available.length > 0 ? available : LETTERS;
  return pool[Math.floor(Math.random() * pool.length)];
}
