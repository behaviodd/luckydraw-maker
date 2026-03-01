import { create } from 'zustand';

interface AdminFeedbackState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decrementUnread: () => void;
}

export const useAdminFeedbackStore = create<AdminFeedbackState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  decrementUnread: () => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
}));
