'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, Palette, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { createClient } from '@/lib/supabase/client';
import { useThemeStore } from '@/stores/themeStore';
import type { ThemeId } from '@/stores/themeStore';
import { Button } from '@/components/ui/Button';
import { ThemeSelector } from '@/components/layout/ThemeSelector';

function AdminMenuItem({ onNavigate }: { onNavigate: () => void }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from('feedbacks')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
      .then(({ count }: { count: number | null }) => setUnreadCount(count ?? 0));
  }, [supabase]);

  return (
    <>
      <div className="border-t-2 border-gum-black/10" />
      <button
        onClick={onNavigate}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gum-black hover:bg-bg-subtle transition-colors"
      >
        <ShieldCheck className="w-4 h-4" />
        관리자 페이지
        {unreadCount > 0 && (
          <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[10px] font-bold text-white bg-gum-coral border-2 border-gum-black rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      <div className="border-t-2 border-gum-black/10" />
    </>
  );
}

export function HamburgerMenu() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { setTheme } = useThemeStore();
  const [open, setOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleThemeSelect = (id: ThemeId) => {
    setTheme(id);
    setThemeOpen(false);
    setOpen(false);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        onClick={() => { setOpen((v) => !v); setThemeOpen(false); }}
        className="text-text-secondary"
      >
        <Menu className="w-5 h-5" />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 bg-bg-card border-3 border-gum-black shadow-brutal z-50 overflow-hidden ctx-menu"
          >
            {/* User info */}
            <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-gum-black/10">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full border-2 border-gum-black shadow-brutal-sm shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full border-2 border-gum-black bg-gum-pink/20 flex items-center justify-center shrink-0">
                  <span className="font-display text-gum-pink text-sm">
                    {(user.user_metadata?.full_name ?? user.email ?? '?').charAt(0)}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <p className="font-display text-sm text-gum-black truncate">
                  {user.user_metadata?.full_name ?? '사용자'}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Theme change */}
            <button
              onClick={() => setThemeOpen((v) => !v)}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gum-black hover:bg-bg-subtle transition-colors"
            >
              <Palette className="w-4 h-4" />
              테마 변경
              <span className={`ml-auto text-xs transition-transform ${themeOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {/* Theme selector submenu */}
            <ThemeSelector open={themeOpen} onSelect={handleThemeSelect} />

            {/* Admin page (관리자만 표시) */}
            {!isAdminLoading && isAdmin && (
              <AdminMenuItem onNavigate={() => { setOpen(false); router.push('/admin'); }} />
            )}

            {/* Logout */}
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gum-coral hover:bg-gum-coral/10 transition-colors border-t-2 border-gum-black/10"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
