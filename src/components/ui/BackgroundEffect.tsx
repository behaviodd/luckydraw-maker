'use client';

import { useThemeStore } from '@/stores/themeStore';
import { StarField } from './StarField';

export function BackgroundEffect() {
  const currentTheme = useThemeStore((s) => s.currentTheme);

  if (currentTheme === 'retro-pc') return null;
  return <StarField />;
}
