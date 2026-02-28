'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Star } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { LuckyDrawCard } from '@/components/domain/LuckyDrawCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLuckyDraws } from '@/hooks/useLuckyDraws';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/stores/uiStore';

export default function VaultPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { draws, loading, deleteDraw, fetchDraws } = useLuckyDraws(user?.id);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const supabase = createClient();
  const addToast = useUIStore((s) => s.addToast);

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await deleteDraw(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const duplicateDraw = async (id: string) => {
    const { data: original, error: fetchError } = await supabase
      .from('lucky_draws')
      .select('*, draw_items(*)')
      .eq('id', id)
      .single();

    if (fetchError || !original) {
      addToast({ type: 'error', message: '복사에 실패했어요' });
      return;
    }

    const { data: newDraw, error: insertError } = await supabase
      .from('lucky_draws')
      .insert({
        user_id: original.user_id,
        name: `${original.name} (복사)`,
        draw_button_label: original.draw_button_label,
        probability_mode: original.probability_mode,
        is_active: original.is_active,
      })
      .select()
      .single();

    if (insertError || !newDraw) {
      addToast({ type: 'error', message: '복사에 실패했어요' });
      return;
    }

    const items = original.draw_items as Record<string, unknown>[];
    if (items && items.length > 0) {
      const newItems = items.map((item) => ({
        draw_id: newDraw.id,
        name: item.name,
        quantity: item.quantity,
        remaining: item.quantity,
        image_url: item.image_url,
        sort_order: item.sort_order,
      }));

      const { error: itemsError } = await supabase.from('draw_items').insert(newItems);
      if (itemsError) {
        addToast({ type: 'error', message: '아이템 복사에 실패했어요' });
        return;
      }
    }

    await fetchDraws();
    addToast({ type: 'success', message: '럭키드로우가 복사되었어요!' });
  };

  return (
    <div className="relative z-10 min-h-screen bg-bg-warm">
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-gum-black mb-1">내 보관함</h1>
            <p className="text-sm text-text-secondary">나만의 럭키드로우를 만들고 운영해보세요 ✨</p>
          </div>
          <Button variant="primary" onClick={() => router.push('/create')}>
            <Plus className="w-4 h-4" /> 새로 만들기
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : draws.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-20">
            <motion.div animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }} className="mb-6">
              <div className="w-20 h-20 border-3 border-gum-black bg-gum-yellow/20 shadow-brutal flex items-center justify-center">
                <Star className="w-10 h-10 text-gum-yellow" />
              </div>
            </motion.div>
            <p className="font-display text-xl text-gum-black mb-2">아직 럭드가 없어요!</p>
            <p className="text-sm text-text-secondary mb-8">첫 번째 럭키드로우를 만들어볼까요?</p>
            <Button variant="primary" onClick={() => router.push('/create')}><Plus className="w-4 h-4" /> 만들기 시작</Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {draws.map((draw, index) => (
              <LuckyDrawCard key={draw.id} draw={draw} index={index} onDelete={() => setDeleteTarget(draw.id)} onDuplicate={duplicateDraw} />
            ))}
          </div>
        )}
      </main>

      <Dialog.Root open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-gum-black/40 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-3rem)] max-w-sm">
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <GlassCard className="w-full p-8">
                  <Dialog.Title className="font-display text-xl text-gum-coral mb-2">정말 삭제할까요?</Dialog.Title>
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
    </div>
  );
}
