import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/vault', '/draw', '/create', '/edit', '/admin', '/play', '/api/draw'];

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

  const isProtected = protectedPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // /admin 경로: 관리자 권한 확인
  if (req.nextUrl.pathname.startsWith('/admin') && user) {
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
