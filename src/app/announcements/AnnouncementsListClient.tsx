'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bell, Pin } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Announcement } from '@/types';

export default function AnnouncementsListClient({ announcements }: { announcements: Announcement[] }) {
  const router = useRouter();

  return (
    <div className="relative z-10 max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-gum-black">공지사항</h1>
        <Button variant="secondary" onClick={() => router.push('/')}>
          럭드메이커로 가기
        </Button>
      </div>

      {announcements.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="mb-6"
          >
            <div className="w-20 h-20 border-3 border-gum-black bg-gum-blue/20 shadow-brutal flex items-center justify-center">
              <Bell className="w-10 h-10 text-gum-blue" />
            </div>
          </motion.div>
          <p className="font-display text-xl text-gum-black mb-2">공지사항이 없어요!</p>
          <p className="text-sm text-text-secondary">새로운 소식이 올라오면 알려드릴게요</p>
        </div>
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
                onClick={() => router.push(`/announcements/${announcement.id}`)}
              >
                <div className="overflow-hidden -mx-6 -mt-6 mb-4">
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
  );
}
