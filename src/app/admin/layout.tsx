import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { AdminNav } from '@/components/layout/AdminNav';
import { AdminProvider } from '@/contexts/AdminContext';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 서버 컴포넌트 재확인 (미들웨어 우회 방어)
  const supabase = await createServerClient();
  const { data: isAdmin } = await supabase.rpc('is_admin');

  if (!isAdmin) {
    redirect('/vault?error=unauthorized');
  }

  return (
    <AdminProvider>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
      />
      <div data-admin="" className="relative z-10 min-h-screen bg-bg-warm flex flex-col">
        <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-bg-card shrink-0">
          <div className="flex items-center gap-3">
            <a href="/vault" className="flex items-center gap-1">
              <span className="text-gum-pink text-lg font-bold">럭키드로우</span>
              <span className="text-gum-black text-lg font-bold">메이커</span>
            </a>
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold text-gum-pink bg-gum-pink/8 rounded-md">
              관리자
            </span>
          </div>
          <a href="/vault" className="text-sm text-text-secondary hover:text-gum-black transition-colors font-medium">
            사용자 화면으로 →
          </a>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <AdminNav />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </AdminProvider>
  );
}
