'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Megaphone, Pin, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import * as Dialog from '@radix-ui/react-dialog';
import { Badge } from '@/components/ui/Badge';
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
    queueMicrotask(() => {
      void fetchAll();
    });
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
          <h1 className="text-2xl font-bold text-text-primary mb-1">공지사항 관리</h1>
          <p className="text-sm text-text-secondary">공지를 작성하고 발행 상태를 관리하세요</p>
        </div>
        <button
          onClick={() => router.push('/admin/announcements/new')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gum-pink rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Plus className="w-4 h-4" /> 새 공지 작성
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gum-pink/10 flex items-center justify-center mb-6">
            <Megaphone className="w-8 h-8 text-gum-pink" />
          </div>
          <p className="text-lg font-semibold text-text-primary mb-2">공지사항이 없어요!</p>
          <p className="text-sm text-text-secondary mb-8">첫 번째 공지를 작성해볼까요?</p>
          <button
            onClick={() => router.push('/admin/announcements/new')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gum-pink rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus className="w-4 h-4" /> 작성 시작
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg-subtle">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">제목</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-24">상태</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-20">고정</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-36">작성일</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-28">액션</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((a) => (
                <tr key={a.id} className="border-t border-border hover:bg-bg-subtle/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-text-primary truncate block max-w-xs">{a.title}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {a.isPublished ? (
                      <Badge className="bg-gum-green/15 text-gum-green border-gum-green">발행됨</Badge>
                    ) : (
                      <Badge>미발행</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {a.isPinned && (
                      <Badge className="bg-gum-yellow/15 text-gum-yellow border-gum-yellow">
                        <Pin className="w-3 h-3 mr-1" />고정
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-text-muted font-mono">
                      {format(new Date(a.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => router.push(`/admin/announcements/${a.id}`)}
                        className="p-1.5 text-text-secondary hover:text-gum-pink transition-colors cursor-pointer rounded-lg hover:bg-gum-pink/10"
                        title="편집"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTogglePublish(a.id, a.isPublished)}
                        className="p-1.5 text-text-secondary hover:text-gum-blue transition-colors cursor-pointer rounded-lg hover:bg-gum-blue/10"
                        title={a.isPublished ? '숨기기' : '발행하기'}
                      >
                        {a.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(a.id)}
                        className="p-1.5 text-text-muted hover:text-gum-coral transition-colors cursor-pointer rounded-lg hover:bg-gum-coral/10"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      <Dialog.Root open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-3rem)] max-w-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="w-full p-8 bg-bg-card rounded-2xl shadow-lg border border-border">
                <Dialog.Title className="text-lg font-bold text-gum-coral mb-2">공지를 삭제할까요?</Dialog.Title>
                <Dialog.Description className="text-sm text-text-secondary mb-6">이 작업은 되돌릴 수 없어요!</Dialog.Description>
                <div className="flex gap-3">
                  <button className="flex-1 px-4 py-2.5 text-sm font-semibold text-text-secondary bg-bg-subtle rounded-lg hover:bg-border transition-colors cursor-pointer" onClick={() => setDeleteTarget(null)}>취소</button>
                  <button className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gum-coral rounded-lg hover:opacity-90 transition-opacity cursor-pointer" onClick={handleDeleteConfirm}>삭제하기</button>
                </div>
              </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
