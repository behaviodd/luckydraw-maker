import type { DrawItem, ProbabilityMode } from '@/types';

export function drawItem(
  items: DrawItem[],
  mode: ProbabilityMode
): DrawItem | null {
  const available = items.filter((item) => item.remaining > 0);
  if (available.length === 0) return null;

  if (mode === 'equal') {
    const idx = Math.floor(Math.random() * available.length);
    return available[idx];
  }

  // weighted: remaining 가중치
  const totalRemaining = available.reduce((sum, item) => sum + item.remaining, 0);
  let random = Math.random() * totalRemaining;
  for (const item of available) {
    random -= item.remaining;
    if (random <= 0) return item;
  }
  return available[available.length - 1];
}
