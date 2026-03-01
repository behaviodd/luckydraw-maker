'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save, Send, Eye, Pin } from 'lucide-react';
import * as Switch from '@radix-ui/react-switch';
import { GlassCard } from '@/components/ui/GlassCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AnnouncementDetail } from '@/components/domain/AnnouncementDetail';
import { createClient } from '@/lib/supabase/client';
import {
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
} from '@/lib/announcements';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import type { AnnouncementWithReadStatus } from '@/types';

import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

export default function AnnouncementEditorClient({ id }: { id: string }) {
  const isNew = id === 'new';
  const router = useRouter();
  const supabase = createClient();
  const addToast = useUIStore((s) => s.addToast);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');

  const fetchExisting = useCallback(async () => {
    try {
      const data = await getAnnouncement(supabase, id);
      setTitle(data.title);
      setContent(data.content);
      setIsPinned(data.isPinned);
      setIsPublished(data.isPublished);
    } catch {
      addToast({ type: 'error', message: '공지를 불러오지 못했어요' });
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  }, [supabase, id, addToast, router]);

  useEffect(() => {
    if (!isNew) fetchExisting();
  }, [isNew, fetchExisting]);

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) {
      addToast({ type: 'error', message: '제목을 입력해주세요' });
      return;
    }
    if (!content.trim()) {
      addToast({ type: 'error', message: '내용을 입력해주세요' });
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        await createAnnouncement(supabase, {
          title: title.trim(),
          content: content.trim(),
          isPinned,
          isPublished: publish,
        });
      } else {
        await updateAnnouncement(supabase, id, {
          title: title.trim(),
          content: content.trim(),
          isPinned,
          isPublished: publish,
        });
      }

      addToast({
        type: 'success',
        message: publish
          ? (isNew ? '공지가 발행되었어요!' : '공지가 수정 & 발행되었어요!')
          : (isNew ? '임시 저장되었어요!' : '수정 사항이 저장되었어요!'),
      });
      router.push('/admin');
    } catch {
      addToast({ type: 'error', message: '저장에 실패했어요' });
    } finally {
      setSaving(false);
    }
  };

  const previewAnnouncement: AnnouncementWithReadStatus = {
    id: 'preview',
    title: title || '(제목 없음)',
    content: content || '(내용 없음)',
    isPinned,
    isPublished,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorId: '',
    isRead: true,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/admin')}
          className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-subtle rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary">
          {isNew ? '새 공지 작성' : '공지 수정'}
        </h1>
      </div>

      <div className="flex flex-col gap-6">
        <GlassCard>
          <h2 className="text-lg font-semibold text-text-primary mb-4">기본 설정</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-text-secondary mb-1 block font-medium">제목</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="공지 제목을 입력해주세요"
                maxLength={100}
                className="w-full"
              />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <Switch.Root
                  checked={isPinned}
                  onCheckedChange={setIsPinned}
                  className={cn(
                    'w-11 h-6 rounded-full border border-border transition-colors relative',
                    isPinned ? 'bg-gum-pink' : 'bg-bg-subtle',
                  )}
                >
                  <Switch.Thumb className={cn(
                    'block w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                    isPinned ? 'translate-x-[22px]' : 'translate-x-[2px]',
                  )} />
                </Switch.Root>
                <span className="text-sm font-medium text-text-secondary flex items-center gap-1">
                  <Pin className="w-3.5 h-3.5" /> 고정 공지
                </span>
              </label>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-0 overflow-hidden">
          <div className="flex border-b border-border">
            <button
              onClick={() => setTab('edit')}
              className={cn(
                'flex-1 py-3 text-sm font-medium text-center transition-colors cursor-pointer',
                tab === 'edit' ? 'text-gum-pink border-b-2 border-gum-pink bg-bg-card' : 'text-text-secondary hover:bg-bg-subtle',
              )}
            >
              작성
            </button>
            <button
              onClick={() => setTab('preview')}
              className={cn(
                'flex-1 py-3 text-sm font-medium text-center transition-colors cursor-pointer',
                tab === 'preview' ? 'text-gum-pink border-b-2 border-gum-pink bg-bg-card' : 'text-text-secondary hover:bg-bg-subtle',
              )}
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" /> 미리보기
            </button>
          </div>

          <AnimatePresence mode="wait">
            {tab === 'edit' ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6"
                data-color-mode="light"
              >
                <MDEditor
                  value={content}
                  onChange={(val) => setContent(val ?? '')}
                  height={400}
                  preview="edit"
                  style={{
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6"
              >
                <AnnouncementDetail
                  announcement={previewAnnouncement}
                  open={false}
                  onClose={() => {}}
                  markAsRead={async () => {}}
                  inline
                />
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        <div className="flex gap-3 sticky bottom-6 z-20">
          <button
            type="button"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-text-secondary bg-bg-subtle rounded-lg hover:bg-border transition-colors cursor-pointer"
            onClick={() => router.push('/admin')}
          >
            취소
          </button>
          <button
            type="button"
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-text-secondary bg-bg-card border border-border rounded-lg hover:bg-bg-subtle transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleSave(false)}
          >
            {saving ? (
              <span className="inline-block w-4 h-4 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Save className="w-4 h-4" /> 임시저장</>
            )}
          </button>
          <button
            type="button"
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gum-pink rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleSave(true)}
          >
            {saving ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Send className="w-4 h-4" /> 저장 & 발행</>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
