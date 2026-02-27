'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Share2 } from 'lucide-react';
import { useLuckyDraw } from '@/hooks/useLuckyDraws';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useUIStore } from '@/stores/uiStore';

export default function DrawInfoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { draw, loading } = useLuckyDraw(id);
  const addToast = useUIStore((s) => s.addToast);

  const handleShare = async () => {
    const url = `${window.location.origin}/play/${id}`;
    await navigator.clipboard.writeText(url);
    addToast({ type: 'success', message: '링크가 복사되었습니다!' });
  };

  if (loading || !draw) {
    return <div className="min-h-screen flex items-center justify-center relative z-10"><LoadingSpinner size="lg" /></div>;
  }

  const items = draw.items ?? [];
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const isWeighted = draw.probabilityMode === 'weighted';
  const COLORS = ['bg-gum-pink', 'bg-gum-yellow', 'bg-gum-green', 'bg-gum-blue', 'bg-gum-purple', 'bg-gum-orange'];

  return (
    <div className="relative z-10 max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => router.push('/vault')}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="font-display text-2xl text-gum-black">{draw.name}</h1>
          <p className="text-sm text-text-secondary">{isWeighted ? '차등확률' : '균등확률'} · 총 {items.length}개 아이템</p>
        </div>
      </div>

      <GlassCard className="mb-6">
        <h2 className="font-display text-lg text-gum-pink mb-4">아이템 목록</h2>
        <div className="flex flex-col gap-3">
          {items.sort((a, b) => a.sortOrder - b.sortOrder).map((item, index) => {
            const probability = isWeighted ? (item.quantity / totalQuantity) * 100 : (1 / items.length) * 100;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-3 bg-bg-subtle border-2 border-gum-black shadow-brutal-sm">
                <div className={`w-2 h-10 ${COLORS[index % COLORS.length]}`} />
                {item.imageUrl ? (
                  <div className="w-10 h-10 border-2 border-gum-black overflow-hidden shadow-brutal-sm">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 border-2 border-gum-black bg-bg-card flex items-center justify-center shadow-brutal-sm">
                    <span className="text-sm font-display text-gum-pink">{item.name.charAt(0)}</span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm text-gum-black font-bold">{item.name}</p>
                  <p className="text-xs text-text-muted font-mono">수량: {item.quantity}</p>
                </div>
                <div className="flex items-center gap-3">
                  {isWeighted && (
                    <div className="w-24 h-3 bg-bg-card border-2 border-gum-black overflow-hidden">
                      <motion.div className="h-full bg-gum-pink" initial={{ width: 0 }}
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
        <Button variant="draw" onClick={() => router.push(`/draw/${draw.id}`)}><Play className="w-5 h-5" /> 드로우 시작!</Button>
        <Button variant="secondary" onClick={handleShare}><Share2 className="w-5 h-5" /> 공유</Button>
      </div>
    </div>
  );
}
