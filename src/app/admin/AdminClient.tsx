'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Megaphone, Pin, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { createClient } from '@/lib/supabase/client';
import { deleteAnnouncement, togglePublish } from '@/lib/announcements';
import { useUIStore } from '@/stores/uiStore';
import type { Announcement } from '@/types';

function mapAnnouncement(row: Record<string, unknown>): Announcement {
  return {
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    isPinned: row.is_pinned as boolean,
    isPublished: row.is_published as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    authorId: row.author_id as string,
  };
}

export default function AdminClient() {
  const router = useRouter();
  const supabase = createClient();
  const addToast = useUIStore((s) => s.addToast);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      addToast({ type: 'error', message: '공지 목록을 불러오지 못했어요' });
    } else {
      setAnnouncements((data ?? []).map(mapAnnouncement));
    }
    setLoading(false);
  }, [supabase, addToast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleTogglePublish = async (id: string, current: boolean) => {
    try {
      await togglePublish(supabase, id, !current);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isPublished: !current } : a)),
      );
      addToast({ type: 'success', message: current ? '공지가 숨김 처리되었어요' : '공지가 발행되었어요' });
    } catch {
      addToast({ type: 'error', message: '상태 변경에 실패했어요' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAnnouncement(supabase, deleteTarget);
      setAnnouncements((prev) => prev.filter((a) => a.id !== deleteTarget));
      addToast({ type: 'success', message: '공지가 삭제되었어요' });
    } catch {
      addToast({ type: 'error', message: '삭제에 실패했어요' });
    }
    setDeleteTarget(null);
  };

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-gum-black mb-1">공지사항 관리</h1>
          <p className="text-sm text-text-secondary">공지를 작성하고 발행 상태를 관리하세요</p>
        </div>
        <Button variant="primary" onClick={() => router.push('/admin/announcements/new')}>
          <Plus className="w-4 h-4" /> 새 공지 작성
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : announcements.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-20">
          <motion.div animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }} className="mb-6">
            <div className="w-20 h-20 border-3 border-gum-black bg-gum-purple/20 shadow-brutal flex items-center justify-center empty-icon">
              <Megaphone className="w-10 h-10 text-gum-purple" />
            </div>
          </motion.div>
          <p className="font-display text-xl text-gum-black mb-2">공지사항이 없어요!</p>
          <p className="text-sm text-text-secondary mb-8">첫 번째 공지를 작성해볼까요?</p>
          <Button variant="primary" onClick={() => router.push('/admin/announcements/new')}>
            <Plus className="w-4 h-4" /> 작성 시작
          </Button>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-4">
          {announcements.map((a, index) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.3 }}
            >
              <GlassCard className="hover:shadow-brutal-lg hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200">
                <div className="overflow-hidden -mx-6 -mt-6 mb-4 accent-bar">
                  <div className={`h-2 ${a.isPinned ? 'bg-gum-yellow' : a.isPublished ? 'bg-gum-green' : 'bg-gum-black/20'}`} />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-display text-lg text-gum-black leading-snug truncate">{a.title}</h3>
                      {a.isPinned && (
                        <Badge className="bg-gum-yellow/15 text-gum-yellow border-gum-yellow">
                          <Pin className="w-3 h-3 mr-1" />고정
                        </Badge>
                      )}
                      {a.isPublished ? (
                        <Badge className="bg-gum-green/15 text-gum-green border-gum-green">발행됨</Badge>
                      ) : (
                        <Badge>미발행</Badge>
                      )}
                    </div>
                    <p className="text-xs text-text-muted font-mono">
                      {format(new Date(a.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      className="text-text-secondary !p-2"
                      onClick={() => router.push(`/admin/announcements/${a.id}`)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-text-secondary !p-2"
                      onClick={() => handleTogglePublish(a.id, a.isPublished)}
                    >
                      {a.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-text-muted hover:text-gum-coral !p-2"
                      onClick={() => setDeleteTarget(a.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog.Root open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-gum-black/40 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-3rem)] max-w-sm">
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <GlassCard className="w-full p-8">
                  <Dialog.Title className="font-display text-xl text-gum-coral mb-2">공지를 삭제할까요?</Dialog.Title>
                  <Dialog.Description className="text-sm text-text-secondary mb-6">이 작업은 되돌릴 수 없어요!</Dialog.Description>
                  <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => setDeleteTarget(null)}>취소</Button>
                    <Button variant="danger" className="flex-1" onClick={handleDeleteConfirm}>삭제하기</Button>
                  </div>
                </GlassCard>
              </motion.div>
            </AnimatePresence>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
