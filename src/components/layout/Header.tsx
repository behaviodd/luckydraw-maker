'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b-3 border-gum-black bg-bg-card">
      <Link href="/vault" className="flex items-center gap-1">
        <span className="font-display text-gum-pink text-xl">럭드</span>
        <span className="font-display text-gum-black text-xl">메이커</span>
      </Link>

      {user && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="w-8 h-8 rounded-full border-2 border-gum-black shadow-brutal-sm"
              />
            )}
            <span className="text-sm text-text-secondary font-medium hidden sm:inline">
              {user.user_metadata?.full_name ?? user.email}
            </span>
          </div>
          <Button variant="ghost" onClick={signOut} className="text-text-secondary">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      )}
    </header>
  );
}
