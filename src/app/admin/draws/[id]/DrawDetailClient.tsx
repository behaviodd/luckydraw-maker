'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Gift, Power, PowerOff, Trash2, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import * as Dialog from '@radix-ui/react-dialog';
import { useAdminDrawDetail } from '@/hooks/useAdminDrawDetail';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/stores/uiStore';
import { Badge } from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';

export default function DrawDetailClient({ drawId }: { drawId: string }) {
  const router = useRouter();
  const { detail, loading } = useAdminDrawDetail(drawId);
  const supabase = createClient();
  const addToast = useUIStore((s) => s.addToast);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const activeState = isActive ?? detail?.draw.isActive ?? false;

  const handleToggleActive = useCallback(async () => {
    const next = !activeState;
    setIsActive(next);
    const { error } = await supabase.rpc('admin_toggle_draw_active', {
      p_draw_id: drawId,
      p_is_active: next,
    });
    if (error) {
      setIsActive(!next);
      addToast({ type: 'error', message: '상태 변경에 실패했어요' });
    } else {
      addToast({ type: 'success', message: next ? '활성화되었어요' : '비활성화되었어요' });
    }
  }, [activeState, drawId, supabase, addToast]);

  const handleDelete = useCallback(async () => {
    const { error } = await supabase.rpc('admin_delete_draw', { p_draw_id: drawId });
    if (error) {
      addToast({ type: 'error', message: '삭제에 실패했어요' });
    } else {
      addToast({ type: 'success', message: '럭키드로우가 삭제되었어요' });
      router.push('/admin/draws');
    }
    setDeleteOpen(false);
  }, [drawId, supabase, addToast, router]);

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col items-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gum-pink/10 flex items-center justify-center mb-6">
            <Gift className="w-8 h-8 text-gum-pink" />
          </div>
          <p className="text-lg font-semibold text-text-primary mb-2">럭키드로우를 찾을 수 없어요</p>
          <button
            onClick={() => router.push('/admin/draws')}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gum-pink rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> 목록으로 돌아가기
          </button>
        </div>
      </main>
    );
  }

  const { draw, items, owner } = detail;

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.push('/admin/draws')}
          className="p-2 text-text-secondary hover:text-gum-pink transition-colors cursor-pointer rounded-lg hover:bg-gum-pink/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">럭키드로우 상세</h1>
          <p className="text-sm text-text-secondary">{draw.name}</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Owner Info Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0, duration: 0.3 }}>
          <GlassCard>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">소유자 정보</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gum-pink/10 flex items-center justify-center shrink-0 overflow-hidden">
                {owner.avatarUrl ? (
                  <img src={owner.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-gum-pink">
                    {(owner.displayName ?? owner.email)[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-text-primary">{owner.displayName ?? '이름 없음'}</p>
                <p className="text-xs text-text-muted">{owner.email}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Draw Info Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.3 }}>
          <GlassCard>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">럭키드로우 정보</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-muted mb-1">이름</p>
                <p className="text-sm font-semibold text-text-primary">{draw.name}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">버튼 라벨</p>
                <p className="text-sm font-semibold text-text-primary">{draw.drawButtonLabel}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">확률 모드</p>
                <Badge className="bg-gum-blue/15 text-gum-blue border-gum-blue">
                  {draw.probabilityMode === 'equal' ? '균등' : '가중치'}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">상태</p>
                <div className="flex items-center gap-2">
                  {activeState ? (
                    <Badge className="bg-gum-green/15 text-gum-green border-gum-green">활성</Badge>
                  ) : (
                    <Badge>비활성</Badge>
                  )}
                  <button
                    onClick={handleToggleActive}
                    className={cn(
                      'p-1.5 transition-colors cursor-pointer rounded-lg',
                      activeState
                        ? 'text-gum-green hover:text-gum-coral hover:bg-gum-coral/10'
                        : 'text-text-muted hover:text-gum-green hover:bg-gum-green/10',
                    )}
                    title={activeState ? '비활성화' : '활성화'}
                  >
                    {activeState ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">생성일</p>
                <p className="text-xs font-mono text-text-secondary">
                  {format(new Date(draw.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">수정일</p>
                <p className="text-xs font-mono text-text-secondary">
                  {format(new Date(draw.updatedAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Items Table Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.3 }}>
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">아이템 목록</p>
              <span className="text-xs text-text-muted font-mono">{items.length}개</span>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center py-8">
                <Package className="w-8 h-8 text-text-muted mb-2" />
                <p className="text-sm text-text-secondary">아이템이 없어요</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-bg-subtle">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider w-12"></th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">이름</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-24">잔여</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider w-40">진행률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const pct = item.quantity > 0 ? (item.remaining / item.quantity) * 100 : 0;
                      return (
                        <tr key={item.id} className="border-t border-border hover:bg-bg-subtle/50 transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="w-8 h-8 rounded-lg bg-bg-card border border-border flex items-center justify-center shrink-0 overflow-hidden">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <Gift className="w-3.5 h-3.5 text-text-muted" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="font-medium text-text-primary">{item.name}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="text-xs font-mono text-text-secondary">{item.remaining}/{item.quantity}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="h-1.5 bg-border rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  pct > 50 ? 'bg-gum-green' : pct > 20 ? 'bg-gum-yellow' : 'bg-gum-coral',
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.3 }}>
          <GlassCard className="border-gum-coral/30">
            <p className="text-xs font-semibold text-gum-coral uppercase tracking-wider mb-3">위험 영역</p>
            <p className="text-sm text-text-secondary mb-4">
              럭키드로우를 삭제하면 모든 아이템 데이터가 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.
            </p>
            <button
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gum-coral rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> 럭키드로우 삭제
            </button>
          </GlassCard>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-3rem)] max-w-sm">
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <div className="w-full p-8 bg-bg-card rounded-2xl shadow-lg border border-border">
                  <Dialog.Title className="text-lg font-bold text-gum-coral mb-2">럭키드로우를 삭제할까요?</Dialog.Title>
                  <Dialog.Description className="text-sm text-text-secondary mb-6">
                    <strong>{draw.name}</strong>와 모든 아이템이 영구 삭제됩니다. 이 작업은 되돌릴 수 없어요!
                  </Dialog.Description>
                  <div className="flex gap-3">
                    <button className="flex-1 px-4 py-2.5 text-sm font-semibold text-text-secondary bg-bg-subtle rounded-lg hover:bg-border transition-colors cursor-pointer" onClick={() => setDeleteOpen(false)}>취소</button>
                    <button className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gum-coral rounded-lg hover:opacity-90 transition-opacity cursor-pointer" onClick={handleDelete}>삭제하기</button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
