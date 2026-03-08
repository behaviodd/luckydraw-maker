'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pencil, Share2, Pause, PlayCircle, Package, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useLuckyDraw } from '@/hooks/useLuckyDraws';
import { useDrawResults } from '@/hooks/useDrawResults';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/stores/uiStore';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/lib/utils';

// 재고 수준 판단
function getStockLevel(remaining: number, quantity: number) {
  if (remaining <= 0) return 'exhausted' as const;
  const ratio = remaining / quantity;
  if (ratio < 0.2) return 'danger' as const;
  if (ratio < 0.5) return 'warning' as const;
  return 'normal' as const;
}

// 재고 수준별 색상 (프로그레스 바)
const STOCK_BAR_COLORS = {
  normal: 'bg-gum-green',
  warning: 'bg-gum-yellow',
  danger: 'bg-gum-coral',
  exhausted: 'bg-text-muted',
} as const;

// 재고 수준별 텍스트 색상
const STOCK_TEXT_COLORS = {
  normal: 'text-gum-green',
  warning: 'text-gum-yellow',
  danger: 'text-gum-coral',
  exhausted: 'text-text-muted',
} as const;

export default function VaultDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { draw, setDraw, loading } = useLuckyDraw(id, true, true); // enableRealtime
  const addToast = useUIStore((s) => s.addToast);
  const isCottonCandy = useThemeStore((s) => s.currentTheme) === 'cotton-candy';
  const supabase = createClient();
  const [toggling, setToggling] = useState(false);
  const [activeTab, setActiveTab] = useState<'stock' | 'results'>('stock');

  const handleShare = async () => {
    const url = `${window.location.origin}/play/${id}`;
    await navigator.clipboard.writeText(url);
    addToast({ type: 'success', message: '링크가 복사되었습니다!' });
  };

  const handleToggleActive = async () => {
    if (!draw || toggling) return;
    setToggling(true);
    const newActive = !draw.isActive;
    const { error } = await supabase
      .from('lucky_draws')
      .update({ is_active: newActive, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      addToast({ type: 'error', message: '상태 변경에 실패했습니다.' });
    } else {
      setDraw((prev) => prev ? { ...prev, isActive: newActive } : prev);
      addToast({ type: 'success', message: newActive ? '이벤트를 재개했습니다.' : '이벤트를 일시정지했습니다.' });
    }
    setToggling(false);
  };

  if (loading || !draw) {
    return <div className="min-h-screen flex items-center justify-center relative z-10"><LoadingSpinner size="lg" /></div>;
  }

  const items = (draw.items ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
  const totalRemaining = items.reduce((sum, item) => sum + item.remaining, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const activeItemCount = items.filter((item) => item.remaining > 0).length;

  return (
    <div className="relative z-10 max-w-3xl mx-auto px-6 py-8">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.push('/vault')}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl text-gum-black truncate">{draw.name}</h1>
          <p className="text-sm text-text-secondary">
            {format(new Date(draw.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
          </p>
        </div>
      </div>

      {/* ═══ 상단 요약 바 ═══ */}
      <div className={cn(
        "grid grid-cols-3 gap-3 mb-6",
      )}>
        {/* 총 남은 경품 */}
        <GlassCard className="!p-4 text-center">
          <p className="text-xs text-text-secondary mb-1">총 남은 경품</p>
          <p className="font-display text-2xl text-gum-black">
            {totalRemaining}
            <span className="text-sm text-text-muted font-body"> / {totalQuantity}</span>
          </p>
        </GlassCard>

        {/* 활성 경품 종류 */}
        <GlassCard className="!p-4 text-center">
          <p className="text-xs text-text-secondary mb-1">활성 경품</p>
          <p className="font-display text-2xl text-gum-black">
            {activeItemCount}
            <span className="text-sm text-text-muted font-body">종</span>
          </p>
        </GlassCard>

        {/* 이벤트 상태 */}
        <GlassCard className="!p-4 text-center">
          <p className="text-xs text-text-secondary mb-1">이벤트 상태</p>
          <div className="flex items-center justify-center gap-2">
            <span className={cn(
              "w-2.5 h-2.5 rounded-full inline-block",
              draw.isActive ? "bg-gum-green animate-pulse" : "bg-text-muted"
            )} />
            <span className={cn(
              "font-display text-lg",
              draw.isActive ? "text-gum-green" : "text-text-muted"
            )}>
              {draw.isActive ? '진행중' : '종료'}
            </span>
          </div>
        </GlassCard>
      </div>

      {/* ═══ 탭 헤더 ═══ */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('stock')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-sm font-display transition-all',
            isCottonCandy
              ? cn('border rounded-full',
                  activeTab === 'stock'
                    ? 'border-accent-primary bg-accent-tertiary/30 text-text-primary'
                    : 'border-[rgba(100,200,176,0.2)] bg-bg-card text-text-muted hover:border-accent-primary')
              : cn('border-2',
                  activeTab === 'stock'
                    ? 'border-gum-black bg-gum-pink text-white shadow-brutal-sm'
                    : 'border-gum-black/20 bg-bg-card text-text-muted hover:border-gum-black')
          )}
        >
          <Package className="w-4 h-4" /> 재고 현황
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('results')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-sm font-display transition-all',
            isCottonCandy
              ? cn('border rounded-full',
                  activeTab === 'results'
                    ? 'border-accent-primary bg-accent-tertiary/30 text-text-primary'
                    : 'border-[rgba(100,200,176,0.2)] bg-bg-card text-text-muted hover:border-accent-primary')
              : cn('border-2',
                  activeTab === 'results'
                    ? 'border-gum-black bg-gum-pink text-white shadow-brutal-sm'
                    : 'border-gum-black/20 bg-bg-card text-text-muted hover:border-gum-black')
          )}
        >
          <Trophy className="w-4 h-4" /> 당첨 내역
        </button>
      </div>

      {/* ═══ 재고 현황 탭 ═══ */}
      {activeTab === 'stock' && (
      <GlassCard className="mb-6">
        <h2 className={cn("font-display text-lg mb-4", isCottonCandy ? "text-text-primary" : "text-gum-pink")}>
          재고 현황
        </h2>
        <div className="flex flex-col gap-3">
          {items.map((item, index) => {
            const level = getStockLevel(item.remaining, item.quantity);
            const percent = item.quantity > 0 ? Math.round((item.remaining / item.quantity) * 100) : 0;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "p-4 bg-bg-subtle",
                  isCottonCandy
                    ? "border border-[rgba(100,200,176,0.15)] rounded-2xl"
                    : "border-2 border-gum-black shadow-brutal-sm",
                  level === 'exhausted' && "opacity-60"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  {/* 이미지/플레이스홀더 */}
                  {item.imageUrl ? (
                    <div className={cn(
                      "w-10 h-10 flex-shrink-0 overflow-hidden",
                      isCottonCandy
                        ? "border border-[rgba(100,200,176,0.2)] rounded-xl"
                        : "border-2 border-gum-black shadow-brutal-sm"
                    )}>
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={cn(
                      "w-10 h-10 flex-shrink-0 bg-bg-card flex items-center justify-center",
                      isCottonCandy
                        ? "border border-[rgba(100,200,176,0.2)] rounded-xl"
                        : "border-2 border-gum-black shadow-brutal-sm"
                    )}>
                      <span className={cn("text-sm font-display", isCottonCandy ? "text-text-primary" : "text-gum-pink")}>
                        {item.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* 이름 */}
                  <p className="text-sm text-gum-black font-bold flex-1 min-w-0 truncate">{item.name}</p>

                  {/* 수량 */}
                  <span className={cn("font-mono text-sm font-bold tabular-nums", STOCK_TEXT_COLORS[level])}>
                    {item.remaining} / {item.quantity}
                  </span>

                  {/* 소진 뱃지 또는 위험 표시 */}
                  {level === 'exhausted' && (
                    <Badge className="bg-text-muted/20 text-text-muted border-text-muted text-xs">소진</Badge>
                  )}
                  {level === 'danger' && (
                    <span className="text-xs text-gum-coral font-bold whitespace-nowrap">재고 부족</span>
                  )}
                </div>

                {/* 프로그레스 바 */}
                <div className={cn(
                  "w-full h-3 bg-bg-card overflow-hidden",
                  isCottonCandy
                    ? "border border-[rgba(100,200,176,0.3)] rounded-full"
                    : "border-2 border-gum-black"
                )}>
                  <motion.div
                    className={cn("h-full", STOCK_BAR_COLORS[level], isCottonCandy && "rounded-full")}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>
      )}

      {/* ═══ 당첨 내역 탭 ═══ */}
      {activeTab === 'results' && (
        <DrawResultsTab drawId={id} isCottonCandy={isCottonCandy} />
      )}

      {/* ═══ 빠른 액션 ═══ */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="draw"
          className="flex-1 sm:flex-[2]"
          onClick={() => window.open(`/draw/${draw.id}`, '_blank')}
        >
          <Play className="w-5 h-5" /> 뽑기 화면 열기
        </Button>
        <Button
          variant={draw.isActive ? 'secondary' : 'primary'}
          className="flex-1"
          disabled={toggling}
          isLoading={toggling}
          onClick={handleToggleActive}
        >
          {draw.isActive ? <><Pause className="w-4 h-4" /> 일시정지</> : <><PlayCircle className="w-4 h-4" /> 재개</>}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => router.push(`/edit/${draw.id}`)}>
          <Pencil className="w-4 h-4" /> 편집
        </Button>
        <Button variant="secondary" className="flex-1" onClick={handleShare}>
          <Share2 className="w-4 h-4" /> 공유
        </Button>
      </div>
    </div>
  );
}

/* ═══ 당첨 내역 서브 컴포넌트 ═══ */

function DrawResultsTab({ drawId, isCottonCandy }: { drawId: string; isCottonCandy: boolean }) {
  const { results, todayCount, isLoading } = useDrawResults({ drawId, enabled: true });

  if (isLoading) {
    return (
      <GlassCard className="mb-6">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* 오늘 요약 */}
      <GlassCard className="!p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary font-bold">오늘 총 뽑기</span>
          <span className={cn("font-display text-xl", isCottonCandy ? "text-text-primary" : "text-gum-pink")}>
            {todayCount}회
          </span>
        </div>
      </GlassCard>

      {/* 당첨 내역 리스트 */}
      <GlassCard>
        <h2 className={cn("font-display text-lg mb-4", isCottonCandy ? "text-text-primary" : "text-gum-pink")}>
          당첨 내역
        </h2>

        {results.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-text-muted">
            <span className="text-4xl">🎯</span>
            <p className="text-sm">아직 뽑기 기록이 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {results.map((result) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={cn(
                    "flex items-center gap-3 p-3",
                    isCottonCandy
                      ? "border border-[rgba(100,200,176,0.15)] rounded-2xl bg-bg-subtle"
                      : "border-2 border-gum-black/10 bg-bg-subtle"
                  )}
                >
                  {/* 이미지/이니셜 */}
                  {result.itemImage ? (
                    <div className={cn(
                      "w-10 h-10 flex-shrink-0 overflow-hidden",
                      isCottonCandy
                        ? "border border-[rgba(100,200,176,0.2)] rounded-xl"
                        : "border-2 border-gum-black shadow-brutal-sm"
                    )}>
                      <img src={result.itemImage} alt={result.itemName} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={cn(
                      "w-10 h-10 flex-shrink-0 bg-bg-card flex items-center justify-center",
                      isCottonCandy
                        ? "border border-[rgba(100,200,176,0.2)] rounded-xl"
                        : "border-2 border-gum-black shadow-brutal-sm"
                    )}>
                      <span className={cn("text-sm font-display", isCottonCandy ? "text-text-primary" : "text-gum-pink")}>
                        {result.itemName.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* 경품 이름 */}
                  <p className="text-sm text-gum-black font-bold flex-1 min-w-0 truncate">
                    {result.itemName}
                  </p>

                  {/* 시각 */}
                  <span className="text-xs text-text-secondary font-mono whitespace-nowrap">
                    {new Date(result.createdAt).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
