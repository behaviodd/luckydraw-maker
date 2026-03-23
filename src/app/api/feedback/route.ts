import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';

const feedbackSchema = z.object({
  subject: z.string().min(1).max(100),
  message: z.string().min(10).max(2000),
  category: z.enum(['bug', 'feature', 'general', 'other']),
});

const categoryLabels: Record<string, string> = {
  bug: '버그 신고',
  feature: '기능 제안',
  general: '일반 문의',
  other: '기타',
};

export async function POST(request: NextRequest) {
  // 인증 확인
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // Rate limit (인증 사용자 ID 기준 — IP 스푸핑 방지)
  const { allowed } = checkRateLimit(`feedback:${user.id}`);
  if (!allowed) {
    return NextResponse.json(
      { error: '잠시 후 다시 시도해주세요.' },
      { status: 429 },
    );
  }

  // 요청 바디 검증
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '입력값을 확인해주세요.', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { subject, message, category } = parsed.data;
  const senderEmail = user.email ?? '';

  // Supabase DB에 피드백 저장
  const { error: dbError } = await supabase.from('feedbacks').insert({
    user_id: user.id,
    sender_email: senderEmail,
    subject,
    message,
    category,
  });

  if (dbError) {
    console.error('[Feedback] DB 저장 실패:', dbError);
    return NextResponse.json({ error: '전송에 실패했습니다. 다시 시도해주세요.' }, { status: 500 });
  }

  // Resend 이메일 전송 (선택 — API 키가 설정된 경우에만)
  const resendKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.FEEDBACK_TO_EMAIL;

  if (resendKey && !resendKey.includes('xxxx') && toEmail) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: process.env.FEEDBACK_FROM_EMAIL ?? 'onboarding@resend.dev',
        to: toEmail,
        replyTo: senderEmail,
        subject: `[럭키드로우메이커 피드백] ${categoryLabels[category] ?? category}: ${subject}`,
        text: [
          `카테고리: ${categoryLabels[category] ?? category}`,
          `보낸 사람: ${senderEmail} (${user.user_metadata?.full_name ?? 'Unknown'})`,
          `User ID: ${user.id}`,
          '',
          '--- 내용 ---',
          message,
        ].join('\n'),
      });
    } catch (err) {
      // 이메일 전송 실패해도 DB에는 이미 저장됨 — 무시
      console.warn('[Feedback] 이메일 전송 실패 (DB 저장은 성공):', err);
    }
  }

  return NextResponse.json({ success: true });
}
