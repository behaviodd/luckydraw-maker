'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Search, Trash2, Power, PowerOff, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import * as Dialog from '@radix-ui/react-dialog';
import { useAdminDraws } from '@/hooks/useAdminDraws';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'active' | 'inactive';

export default function DrawsClient() {
  const router = useRouter();
  const { draws, loading, toggleActive, deleteDraw } = useAdminDraws();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const filtered = draws.filter((d) => {
    if (filter === 'active' && !d.isActive) return false;
    if (filter === 'inactive' && d.isActive) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        (d.ownerDisplayName?.toLowerCase().includes(q) ?? false) ||
        d.ownerEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteDraw(deleteTarget.id);
    setDeleteTarget(null);
  };

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'active', label: '활성' },
    { value: 'inactive', label: '비활성' },
  ];

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">럭키드로우 관리</h1>
          <p className="text-sm text-text-secondary">럭키드로우를 확인하고 관리하세요</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="럭키드로우 이름 또는 소유자로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-bg-card border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gum-pink/30 focus:border-gum-pink transition-colors"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer',
              filter === f.value
                ? 'bg-gum-pink text-white border-gum-pink'
                : 'bg-bg-card text-text-secondary border-border hover:bg-bg-subtle',
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-text-muted self-center font-mono">
          {filtered.length}개
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : draws.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gum-pink/10 flex items-center justify-center mb-6">
            <Gift className="w-8 h-8 text-gum-pink" />
          </div>
          <p className="text-lg font-semibold text-text-primary mb-2">럭키드로우가 없어요!</p>
          <p className="text-sm text-text-secondary">아직 생성된 럭키드로우가 없습니다.</p>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <p className="text-text-secondary">검색 조건에 맞는 럭키드로우가 없어요.</p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg-subtle">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">이름</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider w-44">소유자</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-20">상태</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-20">모드</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-24">아이템</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-28">잔여</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-28">생성일</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-28">액션</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((draw) => (
                <tr key={draw.id} className="border-t border-border hover:bg-bg-subtle/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-text-primary truncate block max-w-[200px]">{draw.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gum-pink/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {draw.ownerAvatarUrl ? (
                          <img src={draw.ownerAvatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[9px] font-bold text-gum-pink">
                            {(draw.ownerDisplayName ?? draw.ownerEmail)[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-text-secondary truncate">{draw.ownerDisplayName ?? draw.ownerEmail}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {draw.isActive ? (
                      <Badge className="bg-gum-green/15 text-gum-green border-gum-green">활성</Badge>
                    ) : (
                      <Badge>비활성</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-text-muted">{draw.probabilityMode === 'equal' ? '균등' : '가중치'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-mono text-text-secondary">{draw.itemCount}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-mono text-text-secondary">{draw.totalRemaining}/{draw.totalQuantity}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-text-muted font-mono">
                      {format(new Date(draw.createdAt), 'yyyy-MM-dd', { locale: ko })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => router.push(`/admin/draws/${draw.id}`)}
                        className="p-1.5 text-text-secondary hover:text-gum-pink transition-colors cursor-pointer rounded-lg hover:bg-gum-pink/10"
                        title="상세 보기"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(draw.id, !draw.isActive)}
                        className={cn(
                          'p-1.5 transition-colors cursor-pointer rounded-lg',
                          draw.isActive
                            ? 'text-gum-green hover:text-gum-coral hover:bg-gum-coral/10'
                            : 'text-text-muted hover:text-gum-green hover:bg-gum-green/10',
                        )}
                        title={draw.isActive ? '비활성화' : '활성화'}
                      >
                        {draw.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: draw.id, name: draw.name })}
                        className="p-1.5 text-text-muted hover:text-gum-coral transition-colors cursor-pointer rounded-lg hover:bg-gum-coral/10"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-3rem)] max-w-sm">
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <div className="w-full p-8 bg-bg-card rounded-2xl shadow-lg border border-border">
                  <Dialog.Title className="text-lg font-bold text-gum-coral mb-2">럭키드로우를 삭제할까요?</Dialog.Title>
                  <Dialog.Description className="text-sm text-text-secondary mb-6">
                    <strong>{deleteTarget?.name}</strong>를 삭제하면 모든 아이템 데이터가 함께 삭제되며, 이 작업은 되돌릴 수 없어요!
                  </Dialog.Description>
                  <div className="flex gap-3">
                    <button className="flex-1 px-4 py-2.5 text-sm font-semibold text-text-secondary bg-bg-subtle rounded-lg hover:bg-border transition-colors cursor-pointer" onClick={() => setDeleteTarget(null)}>취소</button>
                    <button className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gum-coral rounded-lg hover:opacity-90 transition-opacity cursor-pointer" onClick={handleDeleteConfirm}>삭제하기</button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
