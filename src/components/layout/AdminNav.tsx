'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Megaphone, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export function AdminNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from('feedbacks')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
      .then(({ count }: { count: number | null }) => setUnreadCount(count ?? 0));
  }, [supabase]);

  const tabs = [
    {
      label: '공지사항 관리',
      href: '/admin',
      icon: Megaphone,
      isActive: pathname === '/admin' || pathname.startsWith('/admin/announcements'),
    },
    {
      label: '사용자 피드백',
      href: '/admin/feedbacks',
      icon: MessageSquare,
      isActive: pathname.startsWith('/admin/feedbacks'),
      badge: unreadCount,
    },
  ];

  return (
    <nav className="flex gap-1 px-6 py-2 bg-bg-card/50 border-b-3 border-gum-black">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all border-2',
              tab.isActive
                ? 'bg-gum-pink text-white border-gum-black shadow-brutal-sm'
                : 'text-text-secondary border-transparent hover:text-gum-black hover:bg-bg-subtle',
            )}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[10px] font-bold text-white bg-gum-coral border-2 border-gum-black rounded-full">
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
