'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

const feedbackSchema = z.object({
  subject: z.string().min(1, '제목을 입력해주세요').max(100),
  message: z.string().min(10, '내용을 10자 이상 입력해주세요').max(2000),
  category: z.enum(['bug', 'feature', 'general', 'other']),
});

type FeedbackFormInput = z.infer<typeof feedbackSchema>;

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

const categories = [
  { value: 'bug', label: '버그 신고' },
  { value: 'feature', label: '기능 제안' },
  { value: 'general', label: '일반 문의' },
  { value: 'other', label: '기타' },
] as const;

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const { user } = useAuth();
  const addToast = useUIStore((s) => s.addToast);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const {
    register, handleSubmit, reset, watch,
    formState: { errors },
  } = useForm<FeedbackFormInput>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      subject: '',
      message: '',
      category: 'general',
    },
  });

  const messageLength = watch('message')?.length ?? 0;

  const onSubmit = async (data: FeedbackFormInput) => {
    setSending(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.status === 429) {
        addToast({ type: 'error', message: '잠시 후 다시 시도해주세요.' });
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? '전송에 실패했습니다.');
      }

      setSent(true);
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : '전송에 실패했습니다.' });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    onClose();
    // 닫힌 후 상태 리셋
    setTimeout(() => {
      setSent(false);
      reset({ subject: '', message: '', category: 'general' });
    }, 200);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-gum-black/40 z-50 modal-overlay" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-3rem)] max-w-lg max-h-[80vh] overflow-hidden">
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <GlassCard className="w-full p-0 overflow-hidden">
                  <div className="h-2 accent-bar bg-gum-green" />
                  <div className="flex flex-col items-center gap-4 p-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                    >
                      <div className="w-20 h-20 border-3 border-gum-black bg-gum-green/20 shadow-brutal flex items-center justify-center empty-icon">
                        <CheckCircle className="w-10 h-10 text-gum-green" />
                      </div>
                    </motion.div>
                    <p className="font-display text-xl text-gum-black">전송 완료!</p>
                    <p className="text-sm text-text-secondary text-center">소중한 피드백 감사합니다.<br />빠르게 검토 후 답변드릴게요!</p>
                    <Button variant="secondary" onClick={handleClose}>닫기</Button>
                  </div>
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <GlassCard className="w-full p-0 overflow-hidden">
                  <div className="h-2 accent-bar bg-gum-pink" />
                  <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto max-h-[calc(80vh-4rem)]">
                    <Dialog.Title className="font-display text-2xl text-gum-black mb-1">피드백 보내기</Dialog.Title>
                    <Dialog.Description className="text-sm text-text-secondary mb-6">
                      의견이나 버그를 알려주세요! 더 나은 서비스를 만드는 데 큰 힘이 됩니다.
                    </Dialog.Description>

                    <div className="flex flex-col gap-4">
                      {/* 카테고리 */}
                      <div>
                        <label className="text-sm text-text-secondary mb-1 block font-bold">카테고리</label>
                        <div className="grid grid-cols-2 gap-2">
                          {categories.map((cat) => (
                            <label key={cat.value} className="cursor-pointer">
                              <input type="radio" value={cat.value} {...register('category')} className="sr-only peer" />
                              <div className={cn(
                                'p-3 border-3 text-center text-sm font-bold transition-all',
                                'peer-checked:border-gum-black peer-checked:bg-gum-pink/15 peer-checked:shadow-brutal-pink peer-checked:text-gum-pink',
                                'border-gum-black/20 bg-bg-card hover:border-gum-black shadow-brutal-sm text-gum-black',
                              )}>
                                {cat.label}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* 제목 */}
                      <div>
                        <label className="text-sm text-text-secondary mb-1 block font-bold">제목</label>
                        <input {...register('subject')} placeholder="피드백 제목" maxLength={100} className="w-full" />
                        {errors.subject && <p className="text-xs text-gum-coral mt-1">{errors.subject.message}</p>}
                      </div>

                      {/* 내용 */}
                      <div>
                        <label className="text-sm text-text-secondary mb-1 block font-bold">내용</label>
                        <textarea
                          {...register('message')}
                          placeholder="자세히 적어주시면 더 빠르게 도움드릴 수 있어요 (최소 10자)"
                          maxLength={2000}
                          rows={5}
                          className="w-full resize-none"
                        />
                        <div className="flex justify-between mt-1">
                          {errors.message ? (
                            <p className="text-xs text-gum-coral">{errors.message.message}</p>
                          ) : <span />}
                          <span className="text-xs text-text-muted font-mono">{messageLength}/2000</span>
                        </div>
                      </div>

                      {/* 답장 이메일 (서버에서 인증 이메일 사용, 수정 불가) */}
                      <div>
                        <label className="text-sm text-text-secondary mb-1 block font-bold">답장 받을 이메일</label>
                        <div className="w-full px-3 py-2 text-sm text-text-secondary bg-bg-subtle border border-border rounded-lg opacity-60">
                          {user?.email ?? '(로그인 이메일)'}
                        </div>
                      </div>
                    </div>

                    {/* 버튼 */}
                    <div className="flex gap-3 mt-6">
                      <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>취소</Button>
                      <Button type="submit" variant="primary" className="flex-1" isLoading={sending}>
                        <Send className="w-4 h-4" /> 전송하기
                      </Button>
                    </div>
                  </form>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
