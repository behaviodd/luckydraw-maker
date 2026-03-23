'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Shield, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import Image from 'next/image';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'admin';

export default function UsersClient() {
  const { users, loading, toggleAdmin, deleteUser } = useAdminUsers();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [adminTarget, setAdminTarget] = useState<{ id: string; name: string; grant: boolean } | null>(null);

  const filtered = users.filter((u) => {
    if (filter === 'admin' && !u.isAdmin) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.email.toLowerCase().includes(q) ||
        (u.displayName?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteUser(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleAdminConfirm = async () => {
    if (!adminTarget) return;
    await toggleAdmin(adminTarget.id, adminTarget.grant);
    setAdminTarget(null);
  };

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'admin', label: '관리자만' },
  ];

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">회원 관리</h1>
          <p className="text-sm text-text-secondary">회원 정보를 확인하고 관리하세요</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="이름 또는 이메일로 검색"
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
          {filtered.length}명
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gum-pink/10 flex items-center justify-center mb-6">
            <Users className="w-8 h-8 text-gum-pink" />
          </div>
          <p className="text-lg font-semibold text-text-primary mb-2">회원이 없어요!</p>
          <p className="text-sm text-text-secondary">아직 가입한 회원이 없습니다.</p>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <p className="text-text-secondary">검색 조건에 맞는 회원이 없어요.</p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg-subtle">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">회원</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider w-48">이메일</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-20">럭드</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-28">가입일</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-24">관리자</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-16">삭제</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-t border-border hover:bg-bg-subtle/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gum-pink/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {user.avatarUrl ? (
                          <Image src={user.avatarUrl} alt="" width={32} height={32} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-gum-pink">
                            {(user.displayName ?? user.email)[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-text-primary truncate">{user.displayName ?? '이름 없음'}</span>
                        {user.isAdmin && (
                          <Badge className="bg-gum-purple/15 text-gum-purple border-gum-purple shrink-0">
                            <Shield className="w-3 h-3 mr-1" />관리자
                          </Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-text-muted truncate block">{user.email}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-mono text-text-secondary">{user.drawCount}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-text-muted font-mono">
                      {format(new Date(user.createdAt), 'yyyy-MM-dd', { locale: ko })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Switch.Root
                      checked={user.isAdmin}
                      onCheckedChange={(checked) =>
                        setAdminTarget({
                          id: user.id,
                          name: user.displayName ?? user.email,
                          grant: checked,
                        })
                      }
                      className="w-9 h-5 rounded-full bg-bg-subtle data-[state=checked]:bg-gum-purple transition-colors cursor-pointer inline-flex"
                    >
                      <Switch.Thumb className="block w-4 h-4 rounded-full bg-white shadow translate-x-0.5 data-[state=checked]:translate-x-[18px] transition-transform" />
                    </Switch.Root>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setDeleteTarget({ id: user.id, name: user.displayName ?? user.email })}
                      className="p-1.5 text-text-muted hover:text-gum-coral transition-colors cursor-pointer rounded-lg hover:bg-gum-coral/10"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                  <Dialog.Title className="text-lg font-bold text-gum-coral mb-2">회원을 삭제할까요?</Dialog.Title>
                  <Dialog.Description className="text-sm text-text-secondary mb-6">
                    <strong>{deleteTarget?.name}</strong> 회원을 삭제하면 모든 데이터가 함께 삭제되며, 이 작업은 되돌릴 수 없어요!
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

      {/* Admin Toggle Confirmation Dialog */}
      <Dialog.Root open={!!adminTarget} onOpenChange={() => setAdminTarget(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-3rem)] max-w-sm">
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <div className="w-full p-8 bg-bg-card rounded-2xl shadow-lg border border-border">
                  <Dialog.Title className="text-lg font-bold text-gum-purple mb-2">
                    {adminTarget?.grant ? '관리자 권한을 부여할까요?' : '관리자 권한을 해제할까요?'}
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-text-secondary mb-6">
                    <strong>{adminTarget?.name}</strong>님의 관리자 권한을 {adminTarget?.grant ? '부여' : '해제'}합니다.
                  </Dialog.Description>
                  <div className="flex gap-3">
                    <button className="flex-1 px-4 py-2.5 text-sm font-semibold text-text-secondary bg-bg-subtle rounded-lg hover:bg-border transition-colors cursor-pointer" onClick={() => setAdminTarget(null)}>취소</button>
                    <button className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gum-purple rounded-lg hover:opacity-90 transition-opacity cursor-pointer" onClick={handleAdminConfirm}>확인</button>
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
