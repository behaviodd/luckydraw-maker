'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Mail, Pin, X } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AnnouncementDetail } from './AnnouncementDetail';
import { FeedbackModal } from './FeedbackModal';
import type { AnnouncementWithReadStatus } from '@/types';

interface AnnouncementPanelProps {
  open: boolean;
  onClose: () => void;
  announcements: AnnouncementWithReadStatus[];
  markAsRead: (id: string) => Promise<void>;
}

export function AnnouncementPanel({ open, onClose, announcements, markAsRead }: AnnouncementPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const selectedAnnouncement = announcements.find((a) => a.id === selectedId) ?? null;

  const handleCardClick = (id: string) => {
    setSelectedId(id);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gum-black/40 z-50 modal-overlay"
              onClick={onClose}
            />

            {/* Slide panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col bg-bg-warm border-l-3 border-gum-black slide-panel"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b-3 border-gum-black bg-bg-card panel-header">
                <h2 className="font-display text-xl text-gum-black">공지사항</h2>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" onClick={() => setFeedbackOpen(true)} className="text-text-secondary">
                    <Mail className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" onClick={onClose} className="text-text-secondary">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {announcements.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center py-20"
                  >
                    <motion.div
                      animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="mb-6"
                    >
                      <div className="w-20 h-20 border-3 border-gum-black bg-gum-blue/20 shadow-brutal flex items-center justify-center empty-icon">
                        <Bell className="w-10 h-10 text-gum-blue" />
                      </div>
                    </motion.div>
                    <p className="font-display text-xl text-gum-black mb-2">공지사항이 없어요!</p>
                    <p className="text-sm text-text-secondary">새로운 소식이 올라오면 알려드릴게요</p>
                  </motion.div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {announcements.map((announcement, index) => (
                      <motion.div
                        key={announcement.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.06, duration: 0.3 }}
                      >
                        <GlassCard
                          className="cursor-pointer hover:shadow-brutal-lg hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200"
                          onClick={() => handleCardClick(announcement.id)}
                        >
                          {/* Accent bar */}
                          <div className="overflow-hidden -mx-6 -mt-6 mb-4 accent-bar">
                            <div className={`h-2 ${announcement.isPinned ? 'bg-gum-yellow' : 'bg-gum-blue'}`} />
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {announcement.isPinned && (
                                  <Badge className="bg-gum-yellow/15 text-gum-yellow border-gum-yellow">
                                    <Pin className="w-3 h-3 mr-1" />고정
                                  </Badge>
                                )}
                                {!announcement.isRead && (
                                  <Badge variant="rose">NEW</Badge>
                                )}
                              </div>
                              <h3 className="font-display text-lg text-gum-black leading-snug mb-1 truncate">
                                {announcement.title}
                              </h3>
                              <p className="text-xs text-text-muted font-mono">
                                {format(new Date(announcement.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                              </p>
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      {selectedAnnouncement && (
        <AnnouncementDetail
          announcement={selectedAnnouncement}
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
          markAsRead={markAsRead}
        />
      )}

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
}
