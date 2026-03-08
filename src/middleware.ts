import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/vault', '/draw', '/create', '/edit', '/admin', '/api/draw'];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          res = NextResponse.next({
            request: { headers: req.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser()는 Supabase 서버에서 JWT 서명을 검증한다 (getSession은 로컬 디코딩만)
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = req.nextUrl.pathname;

  // 비로그인 손님 허용 경로: 인증 체크 없이 통과
  // - /play/* → 손님 뽑기 페이지
  // - /api/draw/[uuid]/pick → 손님 뽑기 API (pick만 허용, 다른 API는 보호)
  const isPublicPath =
    pathname.startsWith('/play') ||
    /^\/api\/draw\/[^/]+\/pick$/.test(pathname);

  if (isPublicPath) {
    return res;
  }

  // 보호 경로: 비로그인 시 홈으로 리다이렉트
  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // /admin 경로: 관리자 권한 확인
  if (pathname.startsWith('/admin') && user) {
    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/vault?error=unauthorized', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/vault/:path*', '/draw/:path*', '/create/:path*', '/edit/:path*', '/admin/:path*', '/play/:path*', '/api/draw/:path*'],
};
