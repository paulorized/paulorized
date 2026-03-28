export function getTier(helpfulCount: number): { label: string; emoji: string; color: string } {
  if (helpfulCount >= 50) return { label: 'Legend',      emoji: '🌳', color: 'text-yellow-400' };
  if (helpfulCount >= 20) return { label: 'Connoisseur', emoji: '🍃', color: 'text-emerald-400' };
  if (helpfulCount >= 5)  return { label: 'Grower',      emoji: '🌱', color: 'text-lime-400' };
  return                          { label: 'Seedling',   emoji: '🌿', color: 'text-zinc-400' };
}
