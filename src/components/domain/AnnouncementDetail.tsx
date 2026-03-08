'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Pin, X, Share2 } from 'lucide-react';
import Markdown from 'react-markdown';
import * as Dialog from '@radix-ui/react-dialog';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useIsAdmin } from '@/contexts/AdminContext';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import type { AnnouncementWithReadStatus } from '@/types';

interface AnnouncementDetailProps {
  announcement: AnnouncementWithReadStatus;
  open: boolean;
  onClose: () => void;
  markAsRead: (id: string) => Promise<void>;
  /** true면 모달 대신 인라인으로 렌더링 (미리보기용) */
  inline?: boolean;
}

function AnnouncementContent({ announcement, onClose, showClose, isAdmin }: {
  announcement: AnnouncementWithReadStatus;
  onClose: () => void;
  showClose: boolean;
  isAdmin: boolean;
}) {
  const addToast = useUIStore((s) => s.addToast);

  const handleShare = async () => {
    const url = `${window.location.origin}/announcements/${announcement.id}`;
    await navigator.clipboard.writeText(url);
    addToast({ type: 'success', message: '링크가 복사되었습니다!' });
  };

  return (
    <div className="flex flex-col max-h-[80vh]">
      {/* Accent bar — 사용자 페이지에서만 표시 */}
      {!isAdmin && (
        <div className={`h-2 shrink-0 accent-bar ${announcement.isPinned ? 'bg-gum-yellow' : 'bg-gum-blue'}`} />
      )}

      {/* Header */}
      <div className={cn(
        'shrink-0 px-6 pt-6 pb-4',
        isAdmin ? 'border-b border-border' : 'border-b-2 border-gum-black/10',
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 mb-2">
            {announcement.isPinned && (
              <Badge className="bg-gum-yellow/15 text-gum-yellow border-gum-yellow">
                <Pin className="w-3 h-3 mr-1" />고정
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" onClick={handleShare} className="text-text-secondary !p-2">
              <Share2 className="w-4 h-4" />
            </Button>
            {showClose && (
              <Button variant="ghost" onClick={onClose} className="text-text-secondary !p-2">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <h3 className={cn(
          'text-2xl mb-1',
          isAdmin ? 'font-bold text-text-primary' : 'font-display text-gum-black',
        )}>
          {announcement.title}
        </h3>
        <p className="text-xs text-text-muted">
          {format(new Date(announcement.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
        </p>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className={cn(
          'prose prose-sm max-w-none',
          isAdmin
            ? [
                'font-body',
                'prose-headings:font-semibold prose-headings:text-text-primary',
                'prose-h1:text-xl prose-h2:text-lg prose-h3:text-base',
                'prose-p:text-text-primary prose-p:leading-relaxed',
                'prose-a:text-gum-pink prose-a:underline prose-a:font-medium',
                'prose-strong:text-text-primary',
                'prose-code:bg-bg-subtle prose-code:px-1.5 prose-code:py-0.5 prose-code:border prose-code:border-border prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none',
                'prose-blockquote:border-l-4 prose-blockquote:border-gum-pink prose-blockquote:pl-4 prose-blockquote:text-text-secondary prose-blockquote:not-italic',
                'prose-ul:list-disc prose-ul:pl-5',
                'prose-ol:list-decimal prose-ol:pl-5',
                'prose-li:text-text-primary prose-li:mb-1',
                'prose-hr:border-border',
                'prose-img:rounded-lg prose-img:border prose-img:border-border',
              ].join(' ')
            : [
                'font-body',
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
                'prose-hr:border-gum-black/20',
                'prose-img:border-3 prose-img:border-gum-black prose-img:shadow-brutal-sm',
              ].join(' '),
        )}>
          <Markdown>{announcement.content}</Markdown>
        </div>
      </div>
    </div>
  );
}

export function AnnouncementDetail({ announcement, open, onClose, markAsRead, inline }: AnnouncementDetailProps) {
  const isAdmin = useIsAdmin();

  // 모달 마운트 시 읽음 처리
  useEffect(() => {
    if (open && !announcement.isRead) {
      markAsRead(announcement.id);
    }
  }, [open, announcement.id, announcement.isRead, markAsRead]);

  // 인라인 모드: 모달 없이 내용만 렌더링 (미리보기용)
  if (inline) {
    return (
      <div className={cn(
        'p-0 overflow-hidden',
        isAdmin ? 'rounded-2xl border border-border bg-bg-card' : 'brutal-card',
      )}>
        <AnnouncementContent announcement={announcement} onClose={onClose} showClose={false} isAdmin={isAdmin} />
      </div>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-gum-black/40 z-[60]" />
        <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[calc(100vw-3rem)] max-w-lg">
          <Dialog.Title className="sr-only">{announcement.title}</Dialog.Title>
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <GlassCard className="w-full p-0 overflow-hidden max-h-[80vh]">
                <AnnouncementContent announcement={announcement} onClose={onClose} showClose={true} isAdmin={isAdmin} />
              </GlassCard>
            </motion.div>
          </AnimatePresence>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
