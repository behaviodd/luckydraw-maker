'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Pencil, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useLuckyDraw } from '@/hooks/useLuckyDraws';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useUIStore } from '@/stores/uiStore';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/lib/utils';

export default function VaultDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { draw, loading } = useLuckyDraw(id, true);
  const addToast = useUIStore((s) => s.addToast);
  const isCottonCandy = useThemeStore((s) => s.currentTheme) === 'cotton-candy';

  const handleShare = async () => {
    const url = `${window.location.origin}/play/${id}`;
    await navigator.clipboard.writeText(url);
    addToast({ type: 'success', message: '링크가 복사되었습니다!' });
  };

  if (loading || !draw) {
    return <div className="min-h-screen flex items-center justify-center relative z-10"><LoadingSpinner size="lg" /></div>;
  }

  const items = draw.items ?? [];
  const totalRemaining = items.reduce((sum, item) => sum + item.remaining, 0);
  const isWeighted = draw.probabilityMode === 'weighted';
  const COLORS = ['bg-gum-pink', 'bg-gum-yellow', 'bg-gum-green', 'bg-gum-blue', 'bg-gum-purple', 'bg-gum-orange'];

  return (
    <div className="relative z-10 max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => router.push('/vault')}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="font-display text-2xl text-gum-black">{draw.name}</h1>
          <p className="text-sm text-text-secondary">
            {format(new Date(draw.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })} · {isWeighted ? '차등확률' : '균등확률'} · {items.length}개 아이템
          </p>
        </div>
      </div>

      <GlassCard className="mb-6">
        <h2 className={cn("font-display text-lg mb-4", isCottonCandy ? "text-text-primary" : "text-gum-pink")}>아이템 목록</h2>
        <div className="flex flex-col gap-3">
          {items.sort((a, b) => a.sortOrder - b.sortOrder).map((item, index) => {
            const availableItems = items.filter((i) => i.remaining > 0);
            const probability = item.remaining <= 0 ? 0
              : isWeighted ? (item.remaining / totalRemaining) * 100
              : (1 / availableItems.length) * 100;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-4 p-3 bg-bg-subtle",
                  isCottonCandy
                    ? "border border-[rgba(100,200,176,0.15)] rounded-2xl"
                    : "border-2 border-gum-black shadow-brutal-sm"
                )}>
                <div className={cn(`w-2 h-10 ${COLORS[index % COLORS.length]}`, isCottonCandy && "rounded-full")} />
                {item.imageUrl ? (
                  <div className={cn(
                    "w-10 h-10 overflow-hidden",
                    isCottonCandy
                      ? "border border-[rgba(100,200,176,0.2)] rounded-xl"
                      : "border-2 border-gum-black shadow-brutal-sm"
                  )}>
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={cn(
                    "w-10 h-10 bg-bg-card flex items-center justify-center",
                    isCottonCandy
                      ? "border border-[rgba(100,200,176,0.2)] rounded-xl"
                      : "border-2 border-gum-black shadow-brutal-sm"
                  )}>
                    <span className={cn("text-sm font-display", isCottonCandy ? "text-text-primary" : "text-gum-pink")}>{item.name.charAt(0)}</span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm text-gum-black font-bold">{item.name}</p>
                  <p className="text-xs text-text-muted font-mono">수량: {item.remaining} / {item.quantity}</p>
                </div>
                <div className="flex items-center gap-3">
                  {isWeighted && (
                    <div className={cn(
                      "w-24 h-3 bg-bg-card overflow-hidden",
                      isCottonCandy
                        ? "border border-[rgba(100,200,176,0.3)] rounded-full"
                        : "border-2 border-gum-black"
                    )}>
                      <motion.div className={cn("h-full", isCottonCandy ? "bg-accent-primary rounded-full" : "bg-gum-pink")} initial={{ width: 0 }}
                        animate={{ width: `${probability}%` }} transition={{ delay: index * 0.05 + 0.3, duration: 0.5 }} />
                    </div>
                  )}
                  <Badge variant={isWeighted ? 'rose' : 'lavender'} className="font-mono text-xs">{probability.toFixed(1)}%</Badge>
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>

      <div className="flex justify-center gap-3">
        <Button variant="draw" onClick={() => window.open(`/draw/${draw.id}`, '_blank')}><Play className="w-5 h-5" /> 시작</Button>
        <Button variant="secondary" onClick={() => router.push(`/edit/${draw.id}`)}><Pencil className="w-5 h-5" /> 수정</Button>
        <Button variant="secondary" onClick={handleShare}><Share2 className="w-5 h-5" /> 공유</Button>
      </div>
    </div>
  );
}
