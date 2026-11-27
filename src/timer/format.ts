/** 185000 → "3:05". Arrondi au supérieur : on affiche 0:01 jusqu'à la toute fin. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
