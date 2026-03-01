'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Mail, Circle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAdminFeedbacks } from '@/hooks/useAdminFeedbacks';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';
import type { FeedbackCategory } from '@/types';

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
        <span className="text-xs text-text-muted font-mono">{filtered.length}건 · 최신순</span>
      </div>

      {/* Table */}
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg-subtle">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-10"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider w-24">분류</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">제목</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider w-44">보낸 사람</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-28">시간</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => {
                const cat = categoryBadge[f.category];
                const isExpanded = expandedId === f.id;
                const mailtoHref = `mailto:${f.senderEmail}?subject=${encodeURIComponent(`Re: ${f.subject}`)}`;
                return (
                  <tr key={f.id} className="border-t border-border group">
                    <td className="px-4 py-3 text-center">
                      {f.isRead ? (
                        <CheckCircle2 className="w-4 h-4 text-text-muted inline-block" />
                      ) : (
                        <Circle className="w-4 h-4 text-gum-pink fill-gum-pink inline-block" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cat.className}>{cat.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(f.id)}
                        className="text-left w-full cursor-pointer"
                      >
                        <span className={cn(
                          'block truncate max-w-sm',
                          !f.isRead ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary',
                        )}>
                          {f.subject}
                        </span>
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              key="msg"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <p className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed mt-2 pt-2 border-t border-border">
                                {f.message}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-text-secondary truncate max-w-[120px]">{f.senderEmail}</span>
                        <a
                          href={mailtoHref}
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 p-1 text-gum-pink hover:text-gum-pink/80 transition-colors"
                          title="답장"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-text-muted">
                        {formatDistanceToNow(new Date(f.createdAt), { addSuffix: true, locale: ko })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleToggle(f.id)} className="p-1 text-text-muted hover:text-text-secondary transition-colors cursor-pointer">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}
    </main>
  );
}
