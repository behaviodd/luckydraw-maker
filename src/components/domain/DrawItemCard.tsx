'use client';

import { GripVertical, Minus, Plus, Trash2 } from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Button } from '@/components/ui/Button';
import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { LuckyDrawFormInput } from '@/types';

interface DrawItemCardProps {
  index: number;
  register: UseFormRegister<LuckyDrawFormInput>;
  setValue: UseFormSetValue<LuckyDrawFormInput>;
  watch: UseFormWatch<LuckyDrawFormInput>;
  onRemove: () => void;
  probability?: number;
  showProbability: boolean;
  error?: string;
}

export function DrawItemCard({
  index, register, setValue, watch, onRemove, probability, showProbability, error,
}: DrawItemCardProps) {
  const quantity = watch(`items.${index}.quantity`);
  const imageUrl = watch(`items.${index}.imageUrl`);

  return (
    <div className="brutal-card p-4 flex items-center gap-4">
      <div className="cursor-grab text-text-muted hover:text-gum-black transition-colors">
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

      <Button variant="ghost" onClick={onRemove} className="text-text-muted hover:text-gum-coral !p-2">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
