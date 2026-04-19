export function getTier(helpfulCount: number): { label: string; emoji: string; icon: string; color: string } {
  if (helpfulCount >= 50) return { label: 'Legend',      emoji: '🌳', icon: 'legend',      color: 'text-yellow-400' };
  if (helpfulCount >= 20) return { label: 'Connoisseur', emoji: '🍃', icon: 'connoisseur', color: 'text-emerald-400' };
  if (helpfulCount >= 5)  return { label: 'Grower',      emoji: '🌱', icon: 'grower',      color: 'text-lime-400' };
  return                          { label: 'Seedling',   emoji: '🌿', icon: 'seedling',    color: 'text-zinc-400' };
}
