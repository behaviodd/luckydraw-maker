import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 서버 컴포넌트 재확인 (미들웨어 우회 방어)
  const supabase = await createServerClient();
  const { data: isAdmin } = await supabase.rpc('is_admin');

  if (!isAdmin) {
    redirect('/vault?error=unauthorized');
  }

  return (
    <div className="relative z-10 min-h-screen bg-bg-warm">
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b-3 border-gum-black bg-bg-card">
        <div className="flex items-center gap-3">
          <a href="/vault" className="flex items-center gap-1">
            <span className="font-display text-gum-pink text-xl">럭드</span>
            <span className="font-display text-gum-black text-xl">메이커</span>
          </a>
          <Badge variant="rose">관리자 모드</Badge>
        </div>
        <a href="/vault" className="text-sm text-text-secondary hover:text-gum-black transition-colors font-bold">
          사용자 화면으로
        </a>
      </header>
      {children}
    </div>
  );
}
