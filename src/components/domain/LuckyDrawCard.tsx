'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Play, Pencil, Trash2, Sparkles, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import type { LuckyDraw } from '@/types';

interface LuckyDrawCardProps {
  draw: LuckyDraw;
  index: number;
  onDelete: (id: string) => void;
}

const ACCENT_COLORS = ['bg-gum-pink', 'bg-gum-yellow', 'bg-gum-green', 'bg-gum-blue', 'bg-gum-purple', 'bg-gum-orange'];

export function LuckyDrawCard({ draw, index, onDelete }: LuckyDrawCardProps) {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);
  const itemCount = draw.items?.length ?? 0;
  const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length];

  const handleShare = async () => {
    const url = `${window.location.origin}/play/${draw.id}`;
    await navigator.clipboard.writeText(url);
    addToast({ type: 'success', message: '링크가 복사되었습니다!' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <GlassCard className="group hover:shadow-brutal-lg hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 overflow-hidden">
        <div className={`h-2 -mx-6 -mt-6 mb-4 ${accentColor}`} />
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="font-display text-xl text-gum-black leading-snug mb-1">{draw.name}</h3>
            <p className="text-xs text-text-muted font-mono">
              {format(new Date(draw.createdAt), 'yyyy.MM.dd', { locale: ko })}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="lavender">
              <Sparkles className="w-3 h-3 mr-1" />{itemCount}개 아이템
            </Badge>
            <Badge variant={draw.probabilityMode === 'equal' ? 'sky' : 'rose'}>
              {draw.probabilityMode === 'equal' ? '균등확률' : '차등확률'}
            </Badge>
          </div>
          <div className="flex gap-2 pt-3 border-t-2 border-gum-black/10">
            <Button variant="primary" className="flex-1 text-sm py-2" onClick={() => router.push(`/draw/${draw.id}`)}>
              <Play className="w-3 h-3" /> 시작
            </Button>
            <Button variant="secondary" className="py-2 px-3" onClick={() => router.push(`/edit/${draw.id}`)}>
              <Pencil className="w-3 h-3" />
            </Button>
            <Button variant="secondary" className="py-2 px-3" onClick={handleShare}>
              <Share2 className="w-3 h-3" />
            </Button>
            <Button variant="danger" className="py-2 px-3" onClick={() => onDelete(draw.id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
