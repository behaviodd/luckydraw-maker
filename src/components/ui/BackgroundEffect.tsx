'use client';

import { useThemeStore } from '@/stores/themeStore';
import { StarField } from './StarField';
import { CandyParticles } from './CandyParticles';

export function BackgroundEffect() {
  const currentTheme = useThemeStore((s) => s.currentTheme);

  if (currentTheme === 'cotton-candy') return <CandyParticles />;
  if (currentTheme === 'retro-pc') return null;
  return <StarField />;
}
