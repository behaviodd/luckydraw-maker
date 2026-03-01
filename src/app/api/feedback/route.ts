import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { createServerClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const feedbackSchema = z.object({
  senderEmail: z.string().email(),
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

  // Rate limit (IP 기준)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';

  const { allowed } = checkRateLimit(`feedback:${ip}`);
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

  const { senderEmail, subject, message, category } = parsed.data;

  // TODO: 추후 피드백 DB 저장으로 확장 가능
  // await supabase.from('feedbacks').insert({
  //   user_id: user.id,
  //   sender_email: senderEmail,
  //   subject,
  //   message,
  //   category,
  // });

  // Resend로 이메일 전송
  try {
    await getResend().emails.send({
      from: process.env.FEEDBACK_FROM_EMAIL ?? 'noreply@yourdomain.com',
      to: process.env.FEEDBACK_TO_EMAIL!,
      replyTo: senderEmail,
      subject: `[럭드메이커 피드백] ${categoryLabels[category] ?? category}: ${subject}`,
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
    console.error('[Feedback] 이메일 전송 실패:', err);
    return NextResponse.json({ error: '전송에 실패했습니다. 다시 시도해주세요.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
