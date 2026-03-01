import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'dark-glass' | 'retro-pc' | 'cotton-candy';

export interface ThemeOption {
  id: ThemeId;
  label: string;
  description: string;
  preview: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'dark-glass',
    label: '기본',
    description: '네오브루탈 감성 테마',
    preview: '#0D1B3E',
  },
  {
    id: 'retro-pc',
    label: 'PC통신',
    description: '하이텔 BBS 스타일',
    preview: '#000080',
  },
  {
    id: 'cotton-candy',
    label: '코튼캔디 소녀',
    description: '몽글몽글 파스텔 감성',
    preview: '#FF6FA8',
  },
];

interface ThemeStore {
  currentTheme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      currentTheme: 'dark-glass',
      setTheme: (theme) => {
        set({ currentTheme: theme });
        document.documentElement.setAttribute('data-theme', theme);
      },
    }),
    { name: 'luckydraw-theme' }
  )
);
