'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface FloatingShape {
  x: number;
  y: number;
  size: number;
  color: string;
  shape: 'circle' | 'star' | 'diamond' | 'heart';
  delay: number;
  duration: number;
}

const COLORS = ['#FF90E8', '#FFC900', '#23D18C', '#90B8F8', '#C9B1FF', '#FFAB76', '#FF6B6B'];
const SHAPES: FloatingShape['shape'][] = ['circle', 'star', 'diamond', 'heart'];

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
  const [shapes, setShapes] = useState<FloatingShape[]>([]);

  useEffect(() => {
    setShapes(
      Array.from({ length: 20 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 10 + Math.random() * 18,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        delay: Math.random() * 5,
        duration: 4 + Math.random() * 6,
      }))
    );
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
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
