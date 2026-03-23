'use client';

import { useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

interface FloatingShape {
  x: number;
  y: number;
  size: number;
  color: string;
  shape: 'circle' | 'star' | 'diamond' | 'heart';
  delay: number;
  duration: number;
}

const COLORS = [
  'var(--color-gum-pink)', 'var(--color-gum-yellow)', 'var(--color-gum-green)',
  'var(--color-gum-blue)', 'var(--color-gum-purple)', 'var(--color-gum-orange)',
  'var(--color-gum-coral)',
];
const SHAPES: FloatingShape['shape'][] = ['circle', 'star', 'diamond', 'heart'];

function seededValue(seed: number) {
  const value = Math.sin(seed * 12345.6789) * 10000;
  return value - Math.floor(value);
}

function buildShapes(): FloatingShape[] {
  return Array.from({ length: 20 }, (_, i) => ({
    x: seededValue(i + 1) * 100,
    y: seededValue(i + 21) * 100,
    size: 10 + seededValue(i + 41) * 18,
    color: COLORS[Math.floor(seededValue(i + 61) * COLORS.length)],
    shape: SHAPES[Math.floor(seededValue(i + 81) * SHAPES.length)],
    delay: seededValue(i + 101) * 5,
    duration: 4 + seededValue(i + 121) * 6,
  }));
}

function ShapeElement({ shape, color, size }: { shape: string; color: string; size: number }) {
  if (shape === 'circle') {
    return (
      <div
        className="rounded-full border-2 border-current"
        style={{ width: size, height: size, color, borderColor: color, opacity: 0.15 }}
      />
    );
  }
  if (shape === 'star') {
    return (
      <span style={{ fontSize: size, color, opacity: 0.15 }}>&#9733;</span>
    );
  }
  if (shape === 'diamond') {
    return (
      <div
        className="rotate-45 border-2"
        style={{ width: size * 0.7, height: size * 0.7, borderColor: color, opacity: 0.15 }}
      />
    );
  }
  // heart
  return (
    <span style={{ fontSize: size * 0.8, color, opacity: 0.15 }}>&#9829;</span>
  );
}

export function StarField() {
  const mounted = useIsMounted();

  if (!mounted) return <div className="star-field fixed inset-0 z-0 pointer-events-none overflow-hidden" />;

  const shapes = buildShapes();

  return (
    <div className="star-field fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {shapes.map((s, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
          animate={{
            y: [0, -12, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            delay: s.delay,
            ease: 'easeInOut',
          }}
        >
          <ShapeElement shape={s.shape} color={s.color} size={s.size} />
        </motion.div>
      ))}
    </div>
  );
}
