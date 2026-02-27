import type { DrawItem, ProbabilityMode } from '@/types';

export function drawItem(
  items: DrawItem[],
  mode: ProbabilityMode
): DrawItem {
  if (mode === 'equal') {
    const idx = Math.floor(Math.random() * items.length);
    return items[idx];
  }

  // weighted: 수량 가중치
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  let random = Math.random() * totalQty;
  for (const item of items) {
    random -= item.quantity;
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}
