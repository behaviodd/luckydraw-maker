'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Megaphone, MessageSquare, Users, Gift } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAdminFeedbackStore } from '@/stores/adminFeedbackStore';
import { cn } from '@/lib/utils';

export function AdminNav() {
  const pathname = usePathname();
  const unreadCount = useAdminFeedbackStore((s) => s.unreadCount);
  const setUnreadCount = useAdminFeedbackStore((s) => s.setUnreadCount);
  const supabase = createClient();

  // 초기 마운트 시 DB에서 unread count 조회
  useEffect(() => {
    supabase
      .from('feedbacks')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
      .then(({ count }: { count: number | null }) => setUnreadCount(count ?? 0));
  }, [supabase, setUnreadCount]);

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
    {
      label: '회원 관리',
      href: '/admin/users',
      icon: Users,
      isActive: pathname.startsWith('/admin/users'),
    },
    {
      label: '럭키드로우 관리',
      href: '/admin/draws',
      icon: Gift,
      isActive: pathname.startsWith('/admin/draws'),
    },
  ];

  return (
    <aside className="w-56 shrink-0 bg-bg-card border-r border-border py-4 px-3 flex flex-col gap-1">
      <p className="px-3 mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">메뉴</p>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-all rounded-lg',
              tab.isActive
                ? 'bg-gum-pink text-white'
                : 'text-text-secondary hover:text-gum-black hover:bg-bg-subtle',
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{tab.label}</span>
            {tab.badge != null && tab.badge > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[10px] font-bold text-white bg-gum-coral rounded-full">
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </aside>
  );
}
