'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useThemeStore, THEME_OPTIONS } from '@/stores/themeStore';
import type { ThemeId } from '@/stores/themeStore';

interface ThemeSelectorProps {
  open: boolean;
  onSelect: (id: ThemeId) => void;
}

export function ThemeSelector({ open, onSelect }: ThemeSelectorProps) {
  const currentTheme = useThemeStore((s) => s.currentTheme);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden border-t border-gum-black/10"
        >
          <div className="p-2 space-y-2 bg-bg-subtle/50">
            {THEME_OPTIONS.map((opt) => {
              const isActive = currentTheme === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onSelect(opt.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-2 ${
                    isActive
                      ? 'border-gum-pink bg-gum-pink/10'
                      : 'border-transparent hover:bg-bg-card'
                  }`}
                >
                  <div
                    className="w-8 h-8 border-2 border-gum-black shrink-0 rounded-sm"
                    style={{
                      background: opt.preview,
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-display text-gum-black">{opt.label}</p>
                    <p className="text-xs text-text-muted">{opt.description}</p>
                  </div>
                  {isActive && (
                    <Check className="w-4 h-4 text-gum-pink shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
