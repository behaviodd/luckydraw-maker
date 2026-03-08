'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Ticket, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDrawStore } from '@/stores/drawStore';
import { useThemeStore } from '@/stores/themeStore';
import { useUIStore } from '@/stores/uiStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import type { LuckyDraw } from '@/types';

/**
 * mode:
 *   'owner'  — 소유자 운영 화면 (아이템 프리뷰, 개수, 확률모드 표시)
 *   'play'   — 공유 링크 화면 (최소 정보만, 서버 추첨)
 */
interface DrawScreenProps {
  draw: LuckyDraw;
  mode: 'owner' | 'play';
  onItemDecremented?: (itemId: string, newRemaining: number) => void;
}

interface PickResult {
  name: string;
  imageUrl: string | null;
}

const CONFETTI_COLORS = [
  'var(--color-gum-pink)', 'var(--color-gum-yellow)', 'var(--color-gum-green)',
  'var(--color-gum-blue)', 'var(--color-gum-purple)', 'var(--color-gum-coral)',
  'var(--color-gum-orange)',
];

/* ═══ dark-glass 전용 서브 컴포넌트 ═══ */

function ConfettiPieces() {
  return (
    <>
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            width: 6 + Math.random() * 10,
            height: 6 + Math.random() * 10,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            border: '2px solid var(--color-border)',
            left: `${5 + Math.random() * 90}%`,
            top: '-20px',
          }}
          animate={{
            y: [0, (typeof window !== 'undefined' ? window.innerHeight : 800) + 50],
            rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 0.8,
            ease: 'easeIn',
          }}
        />
      ))}
    </>
  );
}

function ShuffleAnimation() {
  const emojis = ['🎀', '⭐', '💖', '🌟', '✨', '🎪', '🎠', '🎡'];
  return (
    <div className="flex gap-4">
      {[0, 1, 2].map((col) => (
        <div key={col} className="w-24 h-24 border-4 border-gum-black bg-bg-card overflow-hidden shadow-brutal-lg">
          <motion.div
            className="flex flex-col items-center"
            animate={{ y: [0, -24 * emojis.length] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear', delay: col * 0.12 }}
          >
            {[...emojis, ...emojis].map((emoji, i) => (
              <div key={i} className="w-24 h-24 flex items-center justify-center text-4xl">{emoji}</div>
            ))}
          </motion.div>
        </div>
      ))}
    </div>
  );
}

function ItemPreview({ draw }: { draw: LuckyDraw }) {
  const items = (draw.items ?? []).slice(0, 8);
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-center gap-3 opacity-70">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          className="w-14 h-14 border-2 border-gum-black bg-bg-card flex items-center justify-center shadow-brutal-sm overflow-hidden"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
        >
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-display text-sm text-gum-pink">{item.name.charAt(0)}</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

/* ═══ cotton-candy 전용 서브 컴포넌트 ═══ */

function CandyItemPreview({ draw }: { draw: LuckyDraw }) {
  const items = draw.items ?? [];
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-center gap-2 max-w-md">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          className="px-3 py-1.5 rounded-full border border-[rgba(100,200,176,0.2)] bg-bg-card/80 backdrop-blur-sm text-sm font-body text-text-primary flex items-center gap-1.5"
          style={{ animation: `bubble-float ${3 + Math.random() * 2}s ease-in-out ${i * 0.3}s infinite` }}
        >
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <span className="text-accent-primary font-display text-xs">{item.name.charAt(0)}</span>
          )}
          <span>{item.name}</span>
        </motion.div>
      ))}
    </div>
  );
}

function CandyBurst() {
  const emojis = ['💖', '✨', '⭐', '💗', '🌸', '💫', '💖', '✨', '⭐', '💗', '🌸', '💫'];
  return (
    <div className="relative w-48 h-48">
      {/* 방사형 글로우 펄스 */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(125,212,190,0.3) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.2, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* 이모지 폭발 */}
      {emojis.map((e, i) => {
        const angle = (i / emojis.length) * Math.PI * 2;
        const tx = Math.cos(angle) * 90;
        const ty = Math.sin(angle) * 90;
        return (
          <motion.span
            key={i}
            className="absolute text-xl"
            style={{
              left: '50%',
              top: '50%',
              marginLeft: -10,
              marginTop: -10,
            }}
            animate={{
              x: [0, tx, tx],
              y: [0, ty, ty],
              scale: [0, 1.5, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.1,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          >
            {e}
          </motion.span>
        );
      })}
    </div>
  );
}

function CandyConfetti() {
  const emojis = ['💖', '✨', '🌸', '💗', '⭐', '💫', '🎀', '💖', '✨', '🌸',
    '💗', '⭐', '💫', '🎀', '💖', '✨', '🌸', '💗', '⭐', '💫',
    '🎀', '💖', '✨', '🌸', '💗', '⭐', '💫', '🎀', '💖', '✨'];
  return (
    <>
      {emojis.map((emoji, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 150 + Math.random() * 250;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance - 60;
        return (
          <motion.span
            key={i}
            className="absolute pointer-events-none"
            style={{
              fontSize: 14 + Math.random() * 10,
              left: '50%',
              top: '40%',
              marginLeft: -10,
              marginTop: -10,
            }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{
              x: tx,
              y: ty + Math.random() * 100,
              scale: [0, 1.3, 0.8],
              rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 1.5 + Math.random() * 1,
              delay: Math.random() * 0.3,
              ease: 'easeOut',
            }}
          >
            {emoji}
          </motion.span>
        );
      })}
    </>
  );
}

function HeartPopDecorations() {
  const positions = [
    { top: '-16px', left: '50%', ml: -8 },    // 상
    { bottom: '-16px', left: '50%', ml: -8 },  // 하
    { top: '50%', left: '-16px', mt: -8 },     // 좌
    { top: '50%', right: '-16px', mt: -8 },    // 우
    { top: '-8px', left: '-8px' },              // 좌상
    { top: '-8px', right: '-8px' },             // 우상
  ];
  const colors = ['var(--color-accent-primary)', 'var(--color-accent-secondary)'];
  return (
    <>
      {positions.map((pos, i) => (
        <motion.span
          key={i}
          className="absolute text-lg pointer-events-none"
          style={{
            ...pos,
            marginLeft: 'ml' in pos ? pos.ml : undefined,
            marginTop: 'mt' in pos ? pos.mt : undefined,
            color: colors[i % 2],
          }}
          initial={{ opacity: 0, scale: 0, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{
            delay: 0.3 + i * 0.1,
            duration: 0.5,
            type: 'spring',
            stiffness: 300,
            damping: 15,
          }}
        >
          💖
        </motion.span>
      ))}
    </>
  );
}

/* ═══ retro-pc 전용 서브 컴포넌트 ═══ */

function RetroLoadingText() {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d + 1) % 4);
    }, 300);
    return () => clearInterval(interval);
  }, []);
  return <span>추첨 중{'.'.repeat(dots)}</span>;
}

function RetroProgressBar() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => (p >= 20 ? 0 : p + 1));
    }, 120);
    return () => clearInterval(interval);
  }, []);
  const filled = '█'.repeat(progress);
  const empty = '░'.repeat(20 - progress);
  return <span className="font-retro">[{filled}{empty}]</span>;
}

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [text]);
  return <span>{displayed}<span className="retro-cursor" /></span>;
}

/* ═══ 메인 컴포넌트 ═══ */

export function DrawScreen({ draw, mode, onItemDecremented }: DrawScreenProps) {
  const addToast = useUIStore((s) => s.addToast);
  const currentTheme = useThemeStore((s) => s.currentTheme);
  const isRetro = currentTheme === 'retro-pc';
  const isCottonCandy = currentTheme === 'cotton-candy';
  const { isDrawing, setIsDrawing, lastResult, setLastResult } = useDrawStore();
  const [exhausted, setExhausted] = useState(false);
  const isOwner = mode === 'owner';

  // 횟수(ticket) 관리 — owner 모드 전용, 로컬 상태
  const [currentTickets, setCurrentTickets] = useState(0);
  const [ticketConfirm, setTicketConfirm] = useState<number | null>(null); // 교체 확인 다이얼로그
  const [showTicketPanel, setShowTicketPanel] = useState(true);
  const ticketOptions = draw.ticketOptions?.length ? draw.ticketOptions : [1, 2, 3, 5, 10];

  // 한번에 뽑기 결과
  const [bulkResults, setBulkResults] = useState<PickResult[]>([]);

  const handleTicketGrant = (n: number) => {
    if (currentTickets > 0) {
      setTicketConfirm(n); // 잔여 있으면 확인 다이얼로그
    } else {
      setCurrentTickets(n);
      setShowTicketPanel(false);
    }
  };

  const confirmTicketReplace = () => {
    if (ticketConfirm !== null) {
      setCurrentTickets(ticketConfirm);
      setTicketConfirm(null);
      setShowTicketPanel(false);
    }
  };

  // owner 모드: 클라이언트 items로 소진 여부 판단
  const allExhaustedByItems = isOwner && (draw.items ?? []).every((item) => item.remaining <= 0);

  // owner 모드에서 횟수 0이면 뽑기 차단
  const ticketBlocked = isOwner && currentTickets <= 0;

  useEffect(() => {
    setIsDrawing(false);
    setLastResult(null);
    setExhausted(false);
  }, [setIsDrawing, setLastResult]);

  const MIN_SPIN_DURATION = 2000; // 최소 2초 연출 보장

  // 에러 케이스별 toast 메시지
  const handleDrawError = useCallback((data: { error?: string; exhausted?: boolean }) => {
    if (data.exhausted) {
      setExhausted(true);
      addToast({ type: 'info', message: '모든 경품이 소진되었습니다!' });
      return;
    }
    const messages: Record<string, { type: 'error' | 'info'; message: string }> = {
      draw_not_active: { type: 'info', message: '이벤트가 종료되었습니다.' },
      rate_limited: { type: 'info', message: '잠시 후 다시 시도해주세요.' },
      item_exhausted_retry: { type: 'info', message: '잠시 후 다시 시도해주세요.' },
      no_remaining: { type: 'info', message: '모든 경품이 소진되었습니다.' },
    };
    const msg = messages[data.error ?? ''] ?? { type: 'error', message: '오류가 발생했습니다. 다시 시도해주세요.' };
    addToast(msg);
  }, [addToast]);

  // 서버 API 추첨 (owner + play 모두 사용)
  // 핵심: API 호출과 최소 대기 타이머를 동시에 시작하여 연출 끊김 방지
  const handleDraw = useCallback(async () => {
    if (isDrawing || exhausted || allExhaustedByItems || ticketBlocked) return;
    setIsDrawing(true);

    try {
      // API 호출 + 최소 연출 시간을 병렬 실행
      const [data] = await Promise.all([
        fetch(`/api/draw/${draw.id}/pick`, { method: 'POST' }).then((r) => r.json()),
        new Promise((resolve) => setTimeout(resolve, MIN_SPIN_DURATION)),
      ]);

      if (!data.success) {
        handleDrawError(data);
        return;
      }

      setLastResult({
        item: {
          id: data.item.id,
          drawId: draw.id,
          name: data.item.name,
          imageUrl: data.item.imageUrl,
          quantity: 0,
          remaining: data.remaining ?? 0,
          sortOrder: 0,
        },
        isNew: true,
      });

      // owner 모드: 뽑기 성공 시 횟수 차감
      if (isOwner) {
        setCurrentTickets((prev) => Math.max(0, prev - 1));
      }

      if (onItemDecremented && data.item.id && data.remaining !== undefined) {
        onItemDecremented(data.item.id, data.remaining);
      }
    } catch {
      addToast({ type: 'error', message: '네트워크 오류가 발생했습니다. 다시 시도해주세요.' });
    } finally {
      setIsDrawing(false);
    }
  }, [draw.id, isDrawing, exhausted, allExhaustedByItems, ticketBlocked, isOwner, setIsDrawing, setLastResult, addToast, onItemDecremented, handleDrawError]);

  // 한번에 뽑기 — 부여된 횟수만큼 일괄 추첨
  const handleBulkDraw = useCallback(async () => {
    if (isDrawing || exhausted || allExhaustedByItems || !isOwner || currentTickets <= 0) return;
    setIsDrawing(true);
    setBulkResults([]);

    try {
      const [data] = await Promise.all([
        fetch(`/api/draw/${draw.id}/pick`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ count: currentTickets }),
        }).then((r) => r.json()),
        new Promise((resolve) => setTimeout(resolve, MIN_SPIN_DURATION)),
      ]);

      if (!data.success) {
        handleDrawError(data);
        return;
      }

      if (data.bulk) {
        const results: PickResult[] = data.items.map((item: { name: string; imageUrl: string | null; id: string; remaining: number }) => ({
          name: item.name,
          imageUrl: item.imageUrl,
        }));
        setBulkResults(results);
        setCurrentTickets(0);

        // onItemDecremented 콜백 — 각 아이템별 remaining 업데이트
        if (onItemDecremented) {
          for (const item of data.items) {
            onItemDecremented(item.id, item.remaining);
          }
        }
      }
    } catch {
      addToast({ type: 'error', message: '네트워크 오류가 발생했습니다. 다시 시도해주세요.' });
    } finally {
      setIsDrawing(false);
    }
  }, [draw.id, isDrawing, exhausted, allExhaustedByItems, isOwner, currentTickets, setIsDrawing, addToast, onItemDecremented, handleDrawError]);

  const handleReset = () => {
    setLastResult(null);
    setBulkResults([]);
    // 횟수 소진 시 자동으로 패널 다시 열기
    if (isOwner && currentTickets <= 0) {
      setShowTicketPanel(true);
    }
  };
  const isAllExhausted = exhausted || allExhaustedByItems;

  // owner 모드에서만 아이템 관련 정보 표시
  const itemCount = isOwner ? (draw.items?.length ?? 0) : 0;

  // 뽑기 버튼 비활성화 조건
  const drawDisabled = isDrawing || isAllExhausted || ticketBlocked;

  // ── 횟수 부여 패널 (owner 전용) ──
  const renderTicketPanel = () => {
    if (!isOwner) return null;
    return (
      <>
        {/* 횟수 부여 패널 */}
        <AnimatePresence>
          {showTicketPanel && !isDrawing && !lastResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[calc(100vw-3rem)] max-w-lg"
            >
              <GlassCard className="!p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-gum-pink" />
                    <span className="font-display text-sm text-gum-black">횟수 부여</span>
                  </div>
                  {currentTickets > 0 && (
                    <span className="text-xs font-mono text-text-secondary">
                      잔여: {currentTickets}회
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {ticketOptions.map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant="secondary"
                      className="!px-4 !py-3 !text-base font-display min-w-[56px]"
                      onClick={() => handleTicketGrant(n)}
                    >
                      {n}회
                    </Button>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 교체 확인 다이얼로그 */}
        <AnimatePresence>
          {ticketConfirm !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-gum-black/40"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
              >
                <GlassCard className="w-[calc(100vw-3rem)] max-w-sm !p-6">
                  <p className="font-display text-lg text-gum-black mb-2">횟수 교체</p>
                  <p className="text-sm text-text-secondary mb-6">
                    현재 {currentTickets}회가 남아있습니다. {ticketConfirm}회로 교체할까요?
                  </p>
                  <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => setTicketConfirm(null)}>취소</Button>
                    <Button variant="primary" className="flex-1" onClick={confirmTicketReplace}>교체</Button>
                  </div>
                </GlassCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  };

  // ── 잔여 횟수 표시 (owner 전용, 뽑기 버튼 아래) ──
  const renderTicketStatus = () => {
    if (!isOwner) return null;
    return (
      <div className="flex items-center justify-center gap-1 mt-2">
        <Ticket className="w-3.5 h-3.5 text-text-secondary" />
        <span className={cn(
          "text-sm font-mono",
          currentTickets > 0 ? "text-gum-black" : "text-text-muted"
        )}>
          {currentTickets > 0 ? `${currentTickets}회 남음` : '횟수를 부여해주세요'}
        </span>
        {currentTickets <= 0 && (
          <button
            type="button"
            className="text-xs text-gum-pink font-bold ml-2 underline"
            onClick={() => setShowTicketPanel(true)}
          >
            부여하기
          </button>
        )}
      </div>
    );
  };

  // "한번에 뽑기" 버튼 — owner 모드, 티켓 2장 이상일 때만 표시
  const renderBulkDrawButton = () => {
    if (!isOwner || currentTickets < 2 || isAllExhausted) return null;
    return (
      <Button
        type="button"
        variant="secondary"
        disabled={isDrawing}
        isLoading={isDrawing}
        onClick={handleBulkDraw}
        className="!text-sm"
      >
        <Zap className="w-4 h-4" /> {currentTickets}회 한번에 뽑기
      </Button>
    );
  };

  // 한번에 뽑기 결과 화면
  const hasBulkResults = bulkResults.length > 0;

  /* ── retro-pc 렌더 ── */
  if (isRetro) {
    return (
      <div className="relative z-10 min-h-screen flex flex-col bg-bg-warm">
        <div className="flex-1 flex items-center justify-center relative z-10 p-6">
          <div className="w-full max-w-lg">
            {/* Idle */}
            {!isDrawing && !lastResult && !hasBulkResults && (
              <div className="border-2 border-gum-black bg-bg-card shadow-brutal">
                <div className="retro-titlebar">
                  <span>■ LUCKY DRAW SYSTEM v1.0</span>
                  <span>[×]</span>
                </div>
                <div className="p-6 font-retro space-y-3">
                  <p className="text-gum-black">&gt; 럭키드로우 이름: {draw.name}</p>
                  {mode === 'owner' && (
                    <>
                      <p className="text-gum-black">&gt; 아이템 수: {itemCount}개</p>
                      <p className="text-gum-black">&gt; 확률 모드: {draw.probabilityMode === 'equal' ? '균등확률' : '차등확률'}</p>
                    </>
                  )}
                  <div className="my-6">
                    {isAllExhausted ? (
                      <div className="border-2 border-gum-black p-4 text-center">
                        <p className="text-gum-black font-bold">모든 아이템이 소진되었습니다.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <Button variant="draw" disabled={drawDisabled} isLoading={isDrawing} onClick={handleDraw}>{draw.drawButtonLabel}</Button>
                        {renderBulkDrawButton()}
                        {renderTicketStatus()}
                      </div>
                    )}
                  </div>
                  {!isAllExhausted && !isOwner && (
                    <p className="text-text-secondary text-sm">
                      <span className="retro-cursor">버튼을 눌러 당첨자를 추첨하세요</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Drawing */}
            {isDrawing && (
              <div className="border-2 border-gum-black bg-bg-card shadow-brutal">
                <div className="retro-titlebar">
                  <span>■ PROCESSING...</span>
                  <span>[×]</span>
                </div>
                <div className="p-6 font-retro space-y-4 text-center">
                  <p className="text-xl text-gum-black font-bold"><RetroLoadingText /></p>
                  <div className="text-gum-black">
                    <RetroProgressBar />
                  </div>
                  <p className="text-text-secondary text-sm">잠시만 기다려주세요...</p>
                </div>
              </div>
            )}

            {/* Single Result */}
            {!isDrawing && lastResult && (
              <div className="border-2 border-gum-black bg-bg-card shadow-brutal">
                <div className="retro-titlebar">
                  <span>■ 추첨 결과</span>
                  <span>[×]</span>
                </div>
                <div className="p-6 font-retro">
                  <div className="border-2 border-gum-black p-4 mb-6">
                    <div className="text-center space-y-2">
                      <p className="text-gum-black">╔══════════════════════════════╗</p>
                      <p className="text-gum-black font-bold">║{'           '}당첨자 발표{'           '}║</p>
                      <p className="text-gum-black">╠══════════════════════════════╣</p>
                      <div className="py-4">
                        {lastResult.item.imageUrl && (
                          <div className="w-24 h-24 mx-auto mb-3 border-2 border-gum-black overflow-hidden">
                            <img src={lastResult.item.imageUrl} alt={lastResult.item.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <p className="text-xl text-gum-pink font-bold">
                          <TypewriterText text={lastResult.item.name} />
                        </p>
                      </div>
                      <p className="text-gum-black">╚══════════════════════════════╝</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button variant="primary" onClick={handleReset}>
                      <RotateCcw className="w-4 h-4" /> 다시 뽑기
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Results */}
            {!isDrawing && hasBulkResults && (
              <div className="border-2 border-gum-black bg-bg-card shadow-brutal">
                <div className="retro-titlebar">
                  <span>■ 일괄 추첨 결과 ({bulkResults.length}건)</span>
                  <span>[×]</span>
                </div>
                <div className="p-6 font-retro">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 max-h-[60vh] overflow-y-auto">
                    {bulkResults.map((result, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 15 }}
                        className="border-2 border-gum-black bg-bg-subtle p-3 flex flex-col items-center justify-center gap-2 shadow-brutal-sm h-28"
                      >
                        {result.imageUrl ? (
                          <div className="w-14 h-14 border border-gum-black overflow-hidden flex-shrink-0">
                            <img src={result.imageUrl} alt={result.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 border border-gum-black bg-gum-pink/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl font-display text-gum-pink">{result.name.charAt(0)}</span>
                          </div>
                        )}
                        <span className="text-gum-black font-bold text-xs text-center leading-tight line-clamp-2 w-full">{result.name}</span>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <Button variant="primary" onClick={handleReset}>
                      <RotateCcw className="w-4 h-4" /> 다시 뽑기
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {renderTicketPanel()}
      </div>
    );
  }

  /* ── cotton-candy 렌더 ── */
  if (isCottonCandy) {
    return (
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center relative z-10 p-6">
          <AnimatePresence mode="wait">
            {/* ── 상태 A: 대기 ── */}
            {!isDrawing && !lastResult && !hasBulkResults && (
              <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-8">
                <div className="text-center">
                  <motion.h2 className="font-display text-3xl text-text-primary mb-2"
                    animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                    {draw.name}
                  </motion.h2>
                  {mode === 'owner' && (
                    <p className="text-text-secondary text-sm">
                      {itemCount}개 아이템 · {draw.probabilityMode === 'equal' ? '균등확률' : '차등확률'}
                    </p>
                  )}
                </div>
                {isAllExhausted ? (
                  <GlassCard className="flex flex-col items-center gap-4 p-8">
                    <p className="text-4xl">🎀</p>
                    <p className="font-display text-xl text-text-primary">모든 아이템이 소진되었어요!</p>
                    <p className="text-sm text-text-secondary">더 이상 뽑을 수 있는 아이템이 없습니다.</p>
                  </GlassCard>
                ) : (
                  <>
                    {isOwner && <CandyItemPreview draw={draw} />}
                    <Button variant="draw" disabled={drawDisabled} isLoading={isDrawing} onClick={handleDraw}>{draw.drawButtonLabel}</Button>
                    {renderBulkDrawButton()}
                    {renderTicketStatus()}
                  </>
                )}
              </motion.div>
            )}

            {/* ── 상태 B: 추첨 중 ── */}
            {isDrawing && (
              <motion.div key="drawing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-8">
                <CandyBurst />
                <motion.p
                  className="font-display text-xl"
                  style={{ color: 'var(--color-accent-primary)' }}
                  animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  두근두근... 💗
                </motion.p>
              </motion.div>
            )}

            {/* ── 상태 C: 결과 ── */}
            {!isDrawing && lastResult && (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-8 relative w-full">
                <CandyConfetti />
                {/* 타이틀 */}
                <motion.div initial={{ scale: 0, rotate: -5 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 14 }} className="text-center">
                  <p className="font-display text-4xl mb-2" style={{ color: 'var(--color-accent-primary)' }}>당첨! 🎉</p>
                </motion.div>

                {/* 결과 카드 + heart-pop 데코 */}
                <motion.div
                  className="relative"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 16, delay: 0.2 }}
                >
                  <GlassCard glow="rose" className="flex flex-col items-center gap-5 p-8 min-w-[240px]">
                    {lastResult.item.imageUrl ? (
                      <div
                        className="w-36 h-36 rounded-full overflow-hidden"
                        style={{ border: '1px solid rgba(100, 200, 176, 0.3)' }}
                      >
                        <img src={lastResult.item.imageUrl} alt={lastResult.item.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div
                        className="w-36 h-36 rounded-full flex items-center justify-center bg-accent-tertiary/30"
                        style={{ border: '1px solid rgba(100, 200, 176, 0.3)' }}
                      >
                        <span className="text-6xl font-display" style={{ color: 'var(--color-accent-primary)' }}>
                          {lastResult.item.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <p className="font-display text-2xl text-center" style={{ color: 'var(--color-accent-primary)' }}>
                      {lastResult.item.name}
                    </p>
                  </GlassCard>
                </motion.div>

                {/* 다시 뽑기 버튼 */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                  <Button variant="primary" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4" /> 다시 뽑기
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* ── 상태 D: 한번에 뽑기 결과 ── */}
            {!isDrawing && hasBulkResults && (
              <motion.div key="bulk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-6 relative w-full max-w-lg">
                <CandyConfetti />
                <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 14 }}
                  className="font-display text-3xl" style={{ color: 'var(--color-accent-primary)' }}>
                  {bulkResults.length}개 당첨!
                </motion.p>
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[55vh] overflow-y-auto">
                  {bulkResults.map((result, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 15 }}
                    >
                      <GlassCard className="flex flex-col items-center justify-center gap-2 !p-3 h-28">
                        {result.imageUrl ? (
                          <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0"
                            style={{ border: '1px solid rgba(100,200,176,0.3)' }}>
                            <img src={result.imageUrl} alt={result.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-accent-tertiary/30 flex items-center justify-center flex-shrink-0"
                            style={{ border: '1px solid rgba(100,200,176,0.3)' }}>
                            <span className="text-2xl font-display" style={{ color: 'var(--color-accent-primary)' }}>{result.name.charAt(0)}</span>
                          </div>
                        )}
                        <span className="font-display text-xs text-text-primary text-center leading-tight line-clamp-2 w-full">{result.name}</span>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Button variant="primary" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4" /> 다시 뽑기
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {renderTicketPanel()}
      </div>
    );
  }

  /* ── dark-glass 렌더 (기존) ── */
  return (
    <div className="relative z-10 min-h-screen flex flex-col bg-bg-warm">
      <div className="flex-1 flex items-center justify-center relative z-10 p-6">
        <AnimatePresence mode="wait">
          {/* Idle */}
          {!isDrawing && !lastResult && !hasBulkResults && (
            <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-8">
              <div className="text-center">
                <motion.h2 className="font-display text-3xl text-gum-black mb-2"
                  animate={{ rotate: [-1, 1, -1] }} transition={{ duration: 3, repeat: Infinity }}>
                  {draw.name}
                </motion.h2>
                {mode === 'owner' && (
                  <p className="text-text-secondary text-sm">
                    {itemCount}개 아이템 · {draw.probabilityMode === 'equal' ? '균등확률' : '차등확률'}
                  </p>
                )}
              </div>
              {isAllExhausted ? (
                <GlassCard className="flex flex-col items-center gap-4 p-8">
                  <p className="text-4xl">📦</p>
                  <p className="font-display text-xl text-gum-black">모든 아이템이 소진되었어요!</p>
                  <p className="text-sm text-text-secondary">더 이상 뽑을 수 있는 아이템이 없습니다.</p>
                </GlassCard>
              ) : (
                <>
                  {isOwner && <ItemPreview draw={draw} />}
                  <Button variant="draw" disabled={drawDisabled} isLoading={isDrawing} onClick={handleDraw}>{draw.drawButtonLabel}</Button>
                  {renderBulkDrawButton()}
                  {renderTicketStatus()}
                </>
              )}
            </motion.div>
          )}

          {/* Drawing */}
          {isDrawing && (
            <motion.div key="drawing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-8">
              <ShuffleAnimation />
              <motion.p className="font-display text-xl text-gum-black"
                animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                두근두근...
              </motion.p>
            </motion.div>
          )}

          {/* Single Result */}
          {!isDrawing && lastResult && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-8 relative w-full">
              <ConfettiPieces />
              <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="text-center">
                <p className="font-display text-4xl text-gum-pink mb-2">당첨!</p>
                <div className="flex justify-center gap-1">
                  {['🎉', '✨', '🎊'].map((e, i) => (
                    <motion.span key={i} className="text-2xl"
                      animate={{ y: [0, -8, 0], rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}>{e}</motion.span>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.2 }}>
                <GlassCard glow="rose" className="flex flex-col items-center gap-5 p-8 min-w-[240px]">
                  {lastResult.item.imageUrl ? (
                    <div className="w-36 h-36 border-4 border-gum-black bg-bg-subtle shadow-brutal-lg overflow-hidden">
                      <img src={lastResult.item.imageUrl} alt={lastResult.item.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-36 h-36 border-4 border-gum-black bg-gum-pink/10 shadow-brutal-lg flex items-center justify-center">
                      <span className="text-6xl font-display text-gum-pink">{lastResult.item.name.charAt(0)}</span>
                    </div>
                  )}
                  <p className="font-display text-2xl text-gum-black text-center">{lastResult.item.name}</p>
                </GlassCard>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Button variant="secondary" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4" /> 다시 뽑기
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* Bulk Results */}
          {!isDrawing && hasBulkResults && (
            <motion.div key="bulk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 relative w-full max-w-lg">
              <ConfettiPieces />
              <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="text-center">
                <p className="font-display text-4xl text-gum-pink mb-2">{bulkResults.length}개 당첨!</p>
                <div className="flex justify-center gap-1">
                  {['🎉', '✨', '🎊'].map((e, i) => (
                    <motion.span key={i} className="text-2xl"
                      animate={{ y: [0, -8, 0], rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}>{e}</motion.span>
                  ))}
                </div>
              </motion.div>

              <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[55vh] overflow-y-auto">
                {bulkResults.map((result, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <GlassCard className="flex flex-col items-center justify-center gap-2 !p-3 h-28">
                      {result.imageUrl ? (
                        <div className="w-14 h-14 border-3 border-gum-black bg-bg-subtle shadow-brutal-sm overflow-hidden flex-shrink-0">
                          <img src={result.imageUrl} alt={result.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 border-3 border-gum-black bg-gum-pink/10 shadow-brutal-sm flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl font-display text-gum-pink">{result.name.charAt(0)}</span>
                        </div>
                      )}
                      <span className="font-display text-xs text-gum-black text-center leading-tight line-clamp-2 w-full">{result.name}</span>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Button variant="secondary" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4" /> 다시 뽑기
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {renderTicketPanel()}
    </div>
  );
}
