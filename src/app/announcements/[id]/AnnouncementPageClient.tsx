'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ArrowLeft, Pin, Share2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/lib/utils';
import type { Announcement } from '@/types';

export default function AnnouncementPageClient({ announcement }: { announcement: Announcement }) {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);
  const isCottonCandy = useThemeStore((s) => s.currentTheme) === 'cotton-candy';

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    addToast({ type: 'success', message: '링크가 복사되었습니다!' });
  };

  return (
    <div className="relative z-10 max-w-2xl mx-auto px-6 py-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-display text-lg text-gum-black flex-1">공지사항</h1>
        <Button variant="ghost" onClick={handleShare}>
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      {/* 본문 카드 */}
      <GlassCard className="p-0 overflow-hidden">
        {/* Accent bar */}
        <div className={cn('h-2', announcement.isPinned ? 'bg-gum-yellow' : 'bg-gum-blue')} />

        <div className="px-6 pt-6 pb-4 border-b-2 border-gum-black/10">
          <div className="flex items-center gap-2 mb-2">
            {announcement.isPinned && (
              <Badge className="bg-gum-yellow/15 text-gum-yellow border-gum-yellow">
                <Pin className="w-3 h-3 mr-1" />고정
              </Badge>
            )}
          </div>
          <h2 className="font-display text-2xl text-gum-black mb-1">{announcement.title}</h2>
          <p className="text-xs text-text-muted">
            {format(new Date(announcement.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
          </p>
        </div>

        <div className="px-6 py-6">
          <div className={cn(
            'prose prose-sm max-w-none font-body',
            'prose-headings:font-body prose-headings:font-bold prose-headings:text-gum-black',
            'prose-h1:text-xl prose-h2:text-lg prose-h3:text-base',
            'prose-p:text-text-primary prose-p:leading-relaxed',
            'prose-a:text-gum-pink prose-a:underline prose-a:font-bold',
            'prose-strong:text-gum-black',
            'prose-code:bg-bg-subtle prose-code:px-1.5 prose-code:py-0.5 prose-code:border prose-code:border-gum-black/10 prose-code:font-mono prose-code:text-sm prose-code:before:content-none prose-code:after:content-none',
            'prose-blockquote:border-l-4 prose-blockquote:border-gum-pink prose-blockquote:pl-4 prose-blockquote:text-text-secondary prose-blockquote:not-italic',
            'prose-ul:list-disc prose-ul:pl-5',
            'prose-ol:list-decimal prose-ol:pl-5',
            'prose-li:text-text-primary prose-li:mb-1',
            isCottonCandy
              ? 'prose-img:rounded-lg prose-img:border prose-img:border-[rgba(100,200,176,0.2)]'
              : 'prose-img:border-3 prose-img:border-gum-black prose-img:shadow-brutal-sm',
          )}>
            <Markdown>{announcement.content}</Markdown>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
