import { Resend } from 'resend';

export async function sendTokenExpiryWarning(
  apiKey: string,
  to: string,
  brandName: string,
  daysLeft: number
): Promise<void> {
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: 'share2dm <noreply@share2dm.xyz>',
    to,
    subject: `[share2dm] Instagram 연동 토큰이 ${daysLeft}일 후 만료됩니다`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #7C3AED;">share2dm</h2>
        <p>안녕하세요, <strong>${brandName}</strong> 님.</p>
        <p>Instagram 연동 토큰이 <strong>${daysLeft}일 후 만료</strong>됩니다.</p>
        <p>만료되면 DM 자동 발송이 중단됩니다. 아래 버튼을 눌러 재로그인해주세요.</p>
        <a href="https://share2dm.xyz/login"
           style="display:inline-block; margin-top:16px; padding:12px 24px;
                  background:#7C3AED; color:white; border-radius:8px;
                  text-decoration:none; font-weight:bold;">
          지금 재로그인하기
        </a>
        <p style="margin-top:24px; color:#888; font-size:12px;">
          share2dm · 문의: support@share2dm.xyz
        </p>
      </div>
    `,
  });
}

export async function sendRateLimitAlert(
  apiKey: string,
  to: string,
  brandName: string
): Promise<void> {
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: 'share2dm <noreply@share2dm.xyz>',
    to,
    subject: `[share2dm] DM 발송 속도 제한 감지 (429)`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #7C3AED;">share2dm</h2>
        <p>안녕하세요, <strong>${brandName}</strong> 님.</p>
        <p>Instagram API에서 <strong>속도 제한(429)</strong>이 감지되었습니다.</p>
        <p>일부 DM이 대기 중이며, 자동으로 재시도됩니다. 잠시 후 대시보드에서 발송 현황을 확인해주세요.</p>
        <a href="https://share2dm.xyz/dashboard"
           style="display:inline-block; margin-top:16px; padding:12px 24px;
                  background:#7C3AED; color:white; border-radius:8px;
                  text-decoration:none; font-weight:bold;">
          대시보드 확인하기
        </a>
        <p style="margin-top:24px; color:#888; font-size:12px;">
          share2dm · 문의: support@share2dm.xyz
        </p>
      </div>
    `,
  });
}
