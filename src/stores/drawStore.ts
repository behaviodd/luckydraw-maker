import { create } from 'zustand';
import type { LuckyDraw, DrawResult } from '@/types';

interface DrawStore {
  activeDraw: LuckyDraw | null;
  setActiveDraw: (draw: LuckyDraw | null) => void;
  lastResult: DrawResult | null;
  setLastResult: (result: DrawResult | null) => void;
  isDrawing: boolean;
  setIsDrawing: (v: boolean) => void;
}

export const useDrawStore = create<DrawStore>((set) => ({
  activeDraw: null,
  setActiveDraw: (draw) => set({ activeDraw: draw }),
  lastResult: null,
  setLastResult: (result) => set({ lastResult: result }),
  isDrawing: false,
  setIsDrawing: (v) => set({ isDrawing: v }),
}));
