'use client';

import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Minus, Plus, Trash2 } from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Button } from '@/components/ui/Button';
import type { UseFormRegister, UseFormSetValue, UseFormWatch, FieldArrayWithId } from 'react-hook-form';
import type { LuckyDrawFormInput } from '@/types';

interface DrawItemCardProps {
  index: number;
  field: FieldArrayWithId<LuckyDrawFormInput, 'items', 'id'>;
  register: UseFormRegister<LuckyDrawFormInput>;
  setValue: UseFormSetValue<LuckyDrawFormInput>;
  watch: UseFormWatch<LuckyDrawFormInput>;
  onRemove: () => void;
  probability?: number;
  showProbability: boolean;
  isEditing?: boolean;
  error?: string;
}

export function DrawItemCard({
  index, field, register, setValue, watch, onRemove, probability, showProbability, isEditing, error,
}: DrawItemCardProps) {
  const dragControls = useDragControls();
  const quantity = watch(`items.${index}.quantity`);
  const remaining = watch(`items.${index}.remaining`);
  const imageUrl = watch(`items.${index}.imageUrl`);

  return (
    <Reorder.Item value={field} dragListener={false} dragControls={dragControls} as="div" className="brutal-card p-4 flex items-center gap-4">
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="cursor-grab active:cursor-grabbing text-text-muted hover:text-gum-black transition-colors touch-none select-none"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <ImageUpload
        value={imageUrl}
        onChange={(file) => {
          setValue(`items.${index}.imageFile`, file);
          if (file) {
            setValue(`items.${index}.imageUrl`, URL.createObjectURL(file));
          } else {
            setValue(`items.${index}.imageUrl`, null);
          }
        }}
      />

      <div className="flex-1">
        <input {...register(`items.${index}.name`)} placeholder="아이템 이름" className="w-full text-sm" />
        {error && <p className="text-xs text-gum-coral mt-1">{error}</p>}
        {showProbability && probability !== undefined && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-3 bg-bg-subtle border-2 border-gum-black overflow-hidden">
              <div className="h-full bg-gum-pink transition-all" style={{ width: `${Math.min(probability, 100)}%` }} />
            </div>
            <span className="text-xs text-gum-pink font-mono font-bold min-w-[44px] text-right">
              {probability.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <button type="button"
            onClick={() => { if (quantity > 1) setValue(`items.${index}.quantity`, quantity - 1); }}
            className="w-8 h-8 bg-bg-card border-2 border-gum-black flex items-center justify-center text-text-secondary hover:bg-gum-pink hover:text-white transition-colors shadow-brutal-sm">
            <Minus className="w-3 h-3" />
          </button>
          <input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })}
            className="w-14 text-center text-sm font-mono !py-1 !px-2" min={1} max={9999} />
          <button type="button"
            onClick={() => setValue(`items.${index}.quantity`, quantity + 1)}
            className="w-8 h-8 bg-bg-card border-2 border-gum-black flex items-center justify-center text-text-secondary hover:bg-gum-pink hover:text-white transition-colors shadow-brutal-sm">
            <Plus className="w-3 h-3" />
          </button>
        </div>
        {isEditing && remaining !== undefined && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-text-muted font-bold whitespace-nowrap">남은</span>
            <button type="button"
              onClick={() => { if (remaining > 0) setValue(`items.${index}.remaining`, remaining - 1); }}
              className="w-6 h-6 bg-bg-card border-2 border-gum-black/50 flex items-center justify-center text-text-secondary hover:bg-gum-green hover:text-white transition-colors text-[10px]">
              <Minus className="w-2.5 h-2.5" />
            </button>
            <input type="number" {...register(`items.${index}.remaining`, { valueAsNumber: true })}
              className="w-12 text-center text-xs font-mono !py-0.5 !px-1 border-gum-black/50" min={0} max={quantity} />
            <button type="button"
              onClick={() => { if (remaining < quantity) setValue(`items.${index}.remaining`, remaining + 1); }}
              className="w-6 h-6 bg-bg-card border-2 border-gum-black/50 flex items-center justify-center text-text-secondary hover:bg-gum-green hover:text-white transition-colors text-[10px]">
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
      </div>

      <Button type="button" variant="ghost" onClick={onRemove} className="text-text-muted hover:text-gum-coral !p-2">
        <Trash2 className="w-4 h-4" />
      </Button>
    </Reorder.Item>
  );
}
