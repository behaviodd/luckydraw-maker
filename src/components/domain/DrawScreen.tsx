'use client';

import { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDrawStore } from '@/stores/drawStore';
import { drawItem } from '@/lib/lottery';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import type { LuckyDraw } from '@/types';

interface DrawScreenProps {
  draw: LuckyDraw;
}

const CONFETTI_COLORS = ['#eb6b34', '#FFC900', '#23D18C', '#90B8F8', '#C9B1FF', '#FF6B6B', '#FFAB76'];

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
            border: '2px solid #1C1C1C',
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

export function DrawScreen({ draw }: DrawScreenProps) {
  const router = useRouter();
  const { isDrawing, setIsDrawing, lastResult, setLastResult } = useDrawStore();

  useEffect(() => {
    setIsDrawing(false);
    setLastResult(null);
  }, [setIsDrawing, setLastResult]);

  const handleDraw = useCallback(() => {
    if (!draw.items || draw.items.length === 0) return;
    setIsDrawing(true);
    const result = drawItem(draw.items, draw.probabilityMode);
    setTimeout(() => {
      setLastResult({ item: result, isNew: true });
      setIsDrawing(false);
    }, 2500);
  }, [draw, setIsDrawing, setLastResult]);

  const handleReset = () => setLastResult(null);
  const itemCount = draw.items?.length ?? 0;

  return (
    <div className="relative z-10 min-h-screen flex flex-col bg-bg-warm">
      {/* Top bar */}
      <div className="flex items-center justify-end p-6 border-b-3 border-gum-black bg-bg-card relative z-10">
        <Button variant="ghost" onClick={() => router.push('/vault')} className="font-bold text-text-secondary">
          <X className="w-5 h-5" /> 나가기
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10 p-6">
        <AnimatePresence mode="wait">
          {/* Idle */}
          {!isDrawing && !lastResult && (
            <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-8">
              <div className="text-center">
                <motion.h2 className="font-display text-3xl text-gum-black mb-2"
                  animate={{ rotate: [-1, 1, -1] }} transition={{ duration: 3, repeat: Infinity }}>
                  {draw.name}
                </motion.h2>
                <p className="text-text-secondary text-sm">
                  {itemCount}개 아이템 · {draw.probabilityMode === 'equal' ? '균등확률' : '차등확률'}
                </p>
              </div>
              <ItemPreview draw={draw} />
              <Button variant="draw" onClick={handleDraw}>{draw.drawButtonLabel}</Button>
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

          {/* Result */}
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
        </AnimatePresence>
      </div>
    </div>
  );
}
