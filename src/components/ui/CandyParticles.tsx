'use client';

import { useMemo } from 'react';

const SYMBOLS = ['✦', '♡', '★', '·', '∘', '✿'];

export function CandyParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 8 + 8,
      opacity: Math.random() * 0.4 + 0.2,
      delay: Math.random() * 4,
      duration: Math.random() * 2 + 3,
      colorVar: ['--color-accent-primary', '--color-accent-secondary', '--color-accent-tertiary'][
        Math.floor(Math.random() * 3)
      ],
    }))
  , []);

  return (
    <div className="candy-bg-particles" aria-hidden="true">
      {particles.map(p => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: p.top,
            left: p.left,
            fontSize: p.size,
            opacity: p.opacity,
            color: `var(${p.colorVar})`,
            animation: `bubble-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          {p.symbol}
        </span>
      ))}
    </div>
  );
}
