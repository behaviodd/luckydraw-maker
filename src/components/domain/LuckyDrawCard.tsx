'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Play, Pencil, Trash2, Sparkles, Share2, MoreHorizontal, Copy } from 'lucide-react';
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
  onDuplicate: (id: string) => void;
}

const ACCENT_COLORS = ['bg-gum-pink', 'bg-gum-yellow', 'bg-gum-green', 'bg-gum-blue', 'bg-gum-purple', 'bg-gum-orange'];

export function LuckyDrawCard({ draw, index, onDelete, onDuplicate }: LuckyDrawCardProps) {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);
  const itemCount = draw.items?.length ?? 0;
  const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length];

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleShare = async () => {
    const url = `${window.location.origin}/play/${draw.id}`;
    await navigator.clipboard.writeText(url);
    addToast({ type: 'success', message: '링크가 복사되었습니다!' });
    setMenuOpen(false);
  };

  const menuItems = [
    { label: '복사하기', icon: Copy, onClick: () => { onDuplicate(draw.id); setMenuOpen(false); } },
    { label: '수정하기', icon: Pencil, onClick: () => { router.push(`/edit/${draw.id}`); setMenuOpen(false); } },
    { label: '공유하기', icon: Share2, onClick: handleShare },
    { label: '삭제하기', icon: Trash2, onClick: () => { onDelete(draw.id); setMenuOpen(false); }, danger: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <GlassCard className="group hover:shadow-brutal-lg hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200">
        <div className="overflow-hidden -mx-6 -mt-6 mb-4 accent-bar">
          <div className={`h-2 ${accentColor}`} />
        </div>
        <div className="flex flex-col gap-4">
          <div className="cursor-pointer" onClick={() => router.push(`/vault/${draw.id}`)}>
            <div className="mb-3">
              <h3 className="font-display text-xl text-gum-black leading-snug mb-1">{draw.name}</h3>
              <p className="text-xs text-text-muted font-mono">
                {format(new Date(draw.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-gum-green/15 text-gum-green border-gum-green">
                <Sparkles className="w-3 h-3 mr-1" />{itemCount}개 아이템
              </Badge>
              <Badge variant={draw.probabilityMode === 'equal' ? 'sky' : 'rose'}>
                {draw.probabilityMode === 'equal' ? '균등확률' : '차등확률'}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2 pt-3 border-t-2 border-gum-black/10">
            <Button variant="primary" className="flex-1 text-sm py-2" onClick={() => router.push(`/draw/${draw.id}`)}>
              <Play className="w-3 h-3" /> 시작
            </Button>
            <div className="relative flex" ref={menuRef}>
              <Button
                variant="secondary"
                className="text-sm py-2 px-3 h-full"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 bottom-full mb-2 w-40 bg-bg-card border-3 border-gum-black shadow-brutal-sm z-50 ctx-menu"
                  >
                    {menuItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={item.onClick}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors
                          ${item.danger
                            ? 'text-gum-coral hover:bg-gum-coral/10'
                            : 'text-gum-black hover:bg-bg-subtle'
                          }`}
                      >
                        <item.icon className="w-3.5 h-3.5" />
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
