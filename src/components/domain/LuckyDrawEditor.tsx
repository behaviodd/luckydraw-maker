'use client';

import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Sparkles, Scale } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { compressAndUpload, BucketNotFoundError } from '@/lib/imageUtils';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { DrawItemCard } from './DrawItemCard';
import type { LuckyDraw, LuckyDrawFormInput, ProbabilityMode } from '@/types';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const drawItemSchema = z.object({
  name: z.string().min(1, '아이템 이름을 입력해주세요').max(30),
  quantity: z.number().int().min(1, '최소 1개 이상').max(9999),
  imageFile: z.any().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
});

const luckyDrawSchema = z.object({
  name: z.string().min(1, '럭드 이름을 입력해주세요').max(30),
  drawButtonLabel: z.string().min(1).max(15).default('두근두근 뽑기!'),
  probabilityMode: z.enum(['equal', 'weighted']),
  items: z.array(drawItemSchema).min(2, '아이템을 2개 이상 추가해주세요'),
});

interface LuckyDrawEditorProps {
  existingDraw?: LuckyDraw | null;
}

export function LuckyDrawEditor({ existingDraw }: LuckyDrawEditorProps) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const addToast = useUIStore((s) => s.addToast);
  const [saving, setSaving] = useState(false);

  const {
    register, control, handleSubmit, watch, setValue,
    formState: { errors },
  } = useForm<LuckyDrawFormInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(luckyDrawSchema) as any,
    defaultValues: existingDraw
      ? {
          name: existingDraw.name, drawButtonLabel: existingDraw.drawButtonLabel,
          probabilityMode: existingDraw.probabilityMode,
          items: existingDraw.items?.map((item) => ({
            name: item.name, quantity: item.quantity, imageUrl: item.imageUrl, imageFile: null,
          })) ?? [],
        }
      : {
          name: '', drawButtonLabel: '두근두근 뽑기!',
          probabilityMode: 'equal' as ProbabilityMode,
          items: [
            { name: '', quantity: 1, imageFile: null, imageUrl: null },
            { name: '', quantity: 1, imageFile: null, imageUrl: null },
          ],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');
  const probabilityMode = watch('probabilityMode');
  const totalQuantity = watchedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const onSubmit = async (data: LuckyDrawFormInput) => {
    if (!user) return;
    setSaving(true);
    try {
      // 프로필이 없으면 FK 제약 위반으로 저장 실패 → 안전하게 upsert
      await supabase.from('profiles').upsert({
        id: user.id,
        display_name: user.user_metadata?.full_name ?? user.email,
        avatar_url: user.user_metadata?.avatar_url ?? null,
      });

      let imageUploadFailed = false;
      const imageUrls: (string | null)[] = [];
      for (const item of data.items) {
        if (item.imageFile) {
          try {
            imageUrls.push(await compressAndUpload(item.imageFile, user.id, supabase));
          } catch (uploadErr) {
            if (uploadErr instanceof BucketNotFoundError) {
              throw uploadErr; // 버킷 미생성 → 전체 중단 & 안내 메시지
            }
            console.error('[ImageUpload] 업로드 실패:', uploadErr);
            imageUrls.push(null); // 개별 이미지 실패 → null로 대체
            imageUploadFailed = true;
          }
        } else {
          imageUrls.push(item.imageUrl ?? null);
        }
      }
      if (existingDraw) {
        const { error: drawError } = await supabase.from('lucky_draws').update({
          name: data.name, draw_button_label: data.drawButtonLabel,
          probability_mode: data.probabilityMode, updated_at: new Date().toISOString(),
        }).eq('id', existingDraw.id);
        if (drawError) throw drawError;
        await supabase.from('draw_items').delete().eq('draw_id', existingDraw.id);
        const { error: itemsError } = await supabase.from('draw_items').insert(
          data.items.map((item, idx) => ({
            draw_id: existingDraw.id, name: item.name, quantity: item.quantity,
            image_url: imageUrls[idx], sort_order: idx,
          }))
        );
        if (itemsError) throw itemsError;
      } else {
        const { data: drawData, error: drawError } = await supabase.from('lucky_draws').insert({
          user_id: user.id, name: data.name, draw_button_label: data.drawButtonLabel,
          probability_mode: data.probabilityMode,
        }).select().single();
        if (drawError) throw drawError;
        const { error: itemsError } = await supabase.from('draw_items').insert(
          data.items.map((item, idx) => ({
            draw_id: drawData.id, name: item.name, quantity: item.quantity,
            image_url: imageUrls[idx], sort_order: idx,
          }))
        );
        if (itemsError) throw itemsError;
      }
      if (imageUploadFailed) {
        addToast({ type: 'info', message: '일부 이미지 업로드에 실패했지만 저장되었습니다.' });
      } else {
        addToast({ type: 'success', message: existingDraw ? '수정 완료!' : '럭키드로우 생성 완료!' });
      }
      router.push('/vault');
    } catch (err) {
      console.error('[LuckyDrawEditor] 저장 실패:', err);
      const message = err instanceof BucketNotFoundError
        ? err.message
        : '저장 실패! 다시 시도해주세요.';
      addToast({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative z-10 max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => router.push('/vault')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-display text-2xl text-gum-black">
          {existingDraw ? '럭드 수정' : '새 럭드 만들기'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <GlassCard>
          <h2 className="font-display text-lg text-gum-pink mb-4">기본 설정</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-text-secondary mb-1 block font-bold">럭드 이름</label>
              <input {...register('name')} placeholder="예: 겨울 럭드 이벤트" maxLength={30} className="w-full" />
              {errors.name && <p className="text-xs text-gum-coral mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block font-bold">뽑기 버튼 텍스트</label>
              <input {...register('drawButtonLabel')} placeholder="두근두근 뽑기!" maxLength={15} className="w-full" />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-2 block font-bold">확률 모드</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('probabilityMode', 'equal')}
                  className={cn(
                    'p-4 border-3 text-left transition-all',
                    probabilityMode === 'equal'
                      ? 'border-gum-black bg-gum-yellow/20 shadow-brutal-yellow'
                      : 'border-gum-black/20 bg-bg-card hover:border-gum-black shadow-brutal-sm'
                  )}
                >
                  <Sparkles className="w-5 h-5 text-gum-yellow mb-2" />
                  <p className="text-sm font-bold text-gum-black">균등확률</p>
                  <p className="text-xs text-text-secondary mt-1">모든 아이템 동일 확률!</p>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('probabilityMode', 'weighted')}
                  className={cn(
                    'p-4 border-3 text-left transition-all',
                    probabilityMode === 'weighted'
                      ? 'border-gum-black bg-gum-pink/15 shadow-brutal-pink'
                      : 'border-gum-black/20 bg-bg-card hover:border-gum-black shadow-brutal-sm'
                  )}
                >
                  <Scale className="w-5 h-5 text-gum-pink mb-2" />
                  <p className="text-sm font-bold text-gum-black">차등확률</p>
                  <p className="text-xs text-text-secondary mt-1">수량 비례 확률!</p>
                </button>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-gum-pink">아이템</h2>
            {probabilityMode === 'weighted' && totalQuantity > 0 && (
              <span className="text-xs text-text-secondary font-mono bg-bg-subtle px-3 py-1 border-2 border-gum-black/10">
                총 {totalQuantity}개
              </span>
            )}
          </div>
          {errors.items?.root && <p className="text-sm text-gum-coral mb-3">{errors.items.root.message}</p>}
          <div className="flex flex-col gap-3">
            {fields.map((field, index) => {
              const itemQty = watchedItems[index]?.quantity || 0;
              const probability = totalQuantity > 0 ? (itemQty / totalQuantity) * 100 : 0;
              return (
                <DrawItemCard key={field.id} index={index}
                  register={register} setValue={setValue} watch={watch}
                  onRemove={() => remove(index)} probability={probability}
                  showProbability={probabilityMode === 'weighted'}
                  error={errors.items?.[index]?.name?.message}
                />
              );
            })}
          </div>
          <Button type="button" variant="secondary" className="w-full mt-4"
            onClick={() => append({ name: '', quantity: 1, imageFile: null, imageUrl: null })}>
            <Plus className="w-4 h-4" /> 아이템 추가
          </Button>
        </GlassCard>

        <div className="flex gap-3 sticky bottom-6">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => router.push('/vault')}>취소</Button>
          <Button type="submit" variant="primary" className="flex-1" isLoading={saving}>저장하기</Button>
        </div>
      </form>
    </div>
  );
}
