'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LogOut, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { Button } from '@/components/ui/Button';
import { AnnouncementPanel } from '@/components/domain/AnnouncementPanel';

export function Header() {
  const { user, signOut } = useAuth();
  const { announcements, unreadCount, markAsRead } = useAnnouncements();
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <>
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b-3 border-gum-black bg-bg-card">
        <Link href="/vault" className="flex items-center gap-1">
          <span className="font-display text-gum-pink text-xl">럭드</span>
          <span className="font-display text-gum-black text-xl">메이커</span>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setPanelOpen(true)} className="relative text-text-secondary">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-gum-coral border-2 border-gum-black rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
            <div className="flex items-center gap-3">
              {user.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full border-2 border-gum-black shadow-brutal-sm"
                />
              )}
              <span className="text-sm text-text-secondary font-medium hidden sm:inline">
                {user.user_metadata?.full_name ?? user.email}
              </span>
            </div>
            <Button variant="ghost" onClick={signOut} className="text-text-secondary">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </header>

      <AnnouncementPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        announcements={announcements}
        markAsRead={markAsRead}
      />
    </>
  );
}
