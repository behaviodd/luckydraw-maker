'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Mail, ChevronDown, ChevronUp, Circle, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAdminFeedbacks } from '@/hooks/useAdminFeedbacks';
import { Badge } from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';
import type { Feedback, FeedbackCategory } from '@/types';

const categories: { value: FeedbackCategory | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'bug', label: '버그 신고' },
  { value: 'feature', label: '기능 제안' },
  { value: 'general', label: '일반 문의' },
  { value: 'other', label: '기타' },
];

const categoryBadge: Record<FeedbackCategory, { label: string; className: string }> = {
  bug: { label: '버그 신고', className: 'bg-gum-coral/15 text-gum-coral border-gum-coral' },
  feature: { label: '기능 제안', className: 'bg-gum-green/15 text-gum-green border-gum-green' },
  general: { label: '일반 문의', className: 'bg-gum-blue/15 text-gum-blue border-gum-blue' },
  other: { label: '기타', className: '' },
};

function FeedbackCard({
  feedback,
  expanded,
  onToggle,
}: {
  feedback: Feedback;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cat = categoryBadge[feedback.category];
  const mailtoHref = `mailto:${feedback.senderEmail}?subject=${encodeURIComponent(`Re: ${feedback.subject}`)}`;

  return (
    <GlassCard
      className={cn(
        'transition-all duration-200 cursor-pointer hover:shadow-md',
        !feedback.isRead && 'ring-1 ring-gum-pink',
      )}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <Badge className={cat.className}>{cat.label}</Badge>
        <span className="text-xs text-text-muted ml-auto">
          {formatDistanceToNow(new Date(feedback.createdAt), { addSuffix: true, locale: ko })}
        </span>
        {feedback.isRead ? (
          <CheckCircle2 className="w-4 h-4 text-text-muted shrink-0" />
        ) : (
          <Circle className="w-4 h-4 text-gum-pink fill-gum-pink shrink-0" />
        )}
      </div>

      {/* Subject */}
      <h3 className={cn(
        'text-lg leading-snug mb-1 truncate',
        !feedback.isRead ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary',
      )}>
        {feedback.subject}
      </h3>

      {/* Sender */}
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs text-text-muted truncate">{feedback.senderEmail}</p>
        <a
          href={mailtoHref}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-gum-pink hover:text-gum-pink/80 transition-colors"
        >
          <Mail className="w-3 h-3" /> 답장
        </a>
      </div>

      {/* Message preview or full */}
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="full"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed border-t border-border pt-3 mt-1">
              {feedback.message}
            </p>
          </motion.div>
        ) : (
          <p className="text-sm text-text-secondary line-clamp-2">{feedback.message}</p>
        )}
      </AnimatePresence>

      {/* Toggle */}
      <div className="flex justify-end mt-2">
        <span className="text-xs text-text-muted flex items-center gap-1">
          {expanded ? <><ChevronUp className="w-3 h-3" /> 접기</> : <><ChevronDown className="w-3 h-3" /> 상세 보기</>}
        </span>
      </div>
    </GlassCard>
  );
}

export default function FeedbacksClient() {
  const { feedbacks, loading, markAsRead } = useAdminFeedbacks();
  const [category, setCategory] = useState<FeedbackCategory | 'all'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = feedbacks.filter((f) => {
    if (category !== 'all' && f.category !== category) return false;
    if (unreadOnly && f.isRead) return false;
    return true;
  });

  const handleToggle = (id: string) => {
    const isExpanding = expandedId !== id;
    setExpandedId(isExpanding ? id : null);
    if (isExpanding) {
      const feedback = feedbacks.find((f) => f.id === id);
      if (feedback && !feedback.isRead) {
        markAsRead(id);
      }
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">사용자 피드백</h1>
        <p className="text-sm text-text-secondary">사용자들의 피드백을 확인하고 관리하세요</p>
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer',
              category === cat.value
                ? 'bg-gum-pink text-white border-gum-pink'
                : 'bg-bg-card text-text-secondary border-border hover:bg-bg-subtle',
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="w-4 h-4 accent-gum-pink"
          />
          읽지 않은 피드백만 보기
        </label>
        <span className="text-xs text-text-muted font-mono">최신순</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : feedbacks.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gum-pink/10 flex items-center justify-center mb-6">
            <MessageSquare className="w-8 h-8 text-gum-pink" />
          </div>
          <p className="text-lg font-semibold text-text-primary mb-2">피드백이 없어요!</p>
          <p className="text-sm text-text-secondary">아직 접수된 피드백이 없습니다.</p>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <p className="text-text-secondary">필터 조건에 맞는 피드백이 없어요.</p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((feedback, index) => (
            <motion.div
              key={feedback.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
            >
              <FeedbackCard
                feedback={feedback}
                expanded={expandedId === feedback.id}
                onToggle={() => handleToggle(feedback.id)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}
