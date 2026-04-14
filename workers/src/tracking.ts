import { createClient } from '@supabase/supabase-js';
import { Env } from './types';

const baseStyles = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      background-color: #0B0914;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #fff;
      position: relative;
      overflow: hidden;
    }
    .orb {
      position: absolute;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(147,51,234,0.25) 0%, rgba(236,72,153,0.15) 60%, transparent 100%);
      filter: blur(80px);
      pointer-events: none;
    }
    .content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      text-align: center;
      padding: 0 24px;
    }
    .logo {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      box-shadow: 0 0 28px rgba(147, 51, 234, 0.5);
    }
    .brand {
      font-size: 22px;
      font-weight: 700;
      background: linear-gradient(135deg, #a855f7, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.3px;
    }
    .divider {
      width: 1px;
      height: 40px;
      background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.15), transparent);
    }
    .code {
      font-size: 72px;
      font-weight: 800;
      line-height: 1;
      background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.4));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .message {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.45);
      line-height: 1.6;
    }
`;

const notFoundHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>share2dm</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="orb"></div>
  <div class="content">
    <img class="logo" src="https://share2dm.xyz/share2dm_logo_nobg.png" alt="share2dm" />
    <span class="brand">share2dm</span>
    <div class="divider"></div>
    <div class="code">404</div>
    <p class="message">이 링크는 더 이상 유효하지 않아요.<br/>캠페인이 종료되었습니다.</p>
  </div>
</body>
</html>`;

const clozetNotFoundHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>share2dm</title>
  <style>
    ${baseStyles}
    .spinner-wrap {
      position: relative;
      width: 56px;
      height: 56px;
    }
    .spinner-wrap svg {
      transform: rotate(-90deg);
    }
    .spinner-track {
      fill: none;
      stroke: rgba(255,255,255,0.08);
      stroke-width: 3;
    }
    .spinner-fill {
      fill: none;
      stroke: url(#grad);
      stroke-width: 3;
      stroke-linecap: round;
      stroke-dasharray: 150.796;
      stroke-dashoffset: 150.796;
      animation: fill-ring 2s linear forwards;
    }
    @keyframes fill-ring {
      to { stroke-dashoffset: 0; }
    }
    .redirect-text {
      font-size: 13px;
      color: rgba(255,255,255,0.3);
    }
  </style>
</head>
<body>
  <div class="orb"></div>
  <div class="content">
    <img class="logo" src="https://share2dm.xyz/share2dm_logo_nobg.png" alt="share2dm" />
    <span class="brand">share2dm</span>
    <div class="divider"></div>
    <div class="code">404</div>
    <p class="message">이 링크는 더 이상 유효하지 않아요.<br/>캠페인이 종료되었습니다.</p>
    <div class="spinner-wrap">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#a855f7"/>
            <stop offset="100%" stop-color="#ec4899"/>
          </linearGradient>
        </defs>
        <circle class="spinner-track" cx="28" cy="28" r="24"/>
        <circle class="spinner-fill" cx="28" cy="28" r="24"/>
      </svg>
    </div>
    <p class="redirect-text">Clozet으로 이동 중...</p>
  </div>
  <script>
    setTimeout(function() {
      window.location.href = 'https://app.clozet.my/?tab=reels';
    }, 2000);
  </script>
</body>
</html>`;

export async function handleTracking(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const parts = url.pathname.split('/'); // /t/{campaign_id}/{sender_ig_id}

  if (parts.length < 4) {
    return new Response(notFoundHtml, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const campaignId = parts[2];
  const senderIgId = parts[3];

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  // Update click timestamp
  await supabase
    .from('share2dm_dm_logs')
    .update({ link_clicked_at: new Date().toISOString() })
    .eq('campaign_id', campaignId)
    .eq('sender_ig_id', senderIgId);

  // Get campaign (including soft-deleted)
  const { data: campaign } = await supabase
    .from('share2dm_campaigns')
    .select('product_url, product_url_source, deleted_at')
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    return new Response(notFoundHtml, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (campaign.deleted_at) {
    const html = campaign.product_url_source === 'clozet' ? clozetNotFoundHtml : notFoundHtml;
    return new Response(html, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Redirect to actual product URL (ensure absolute URL)
  const productUrl = campaign.product_url.startsWith('http')
    ? campaign.product_url
    : `https://${campaign.product_url}`;

  // app.clozet.my로 가는 경우 sticker click 추적용 파라미터 추가
  let finalUrl = productUrl;
  if (productUrl.includes('app.clozet.my') || productUrl.includes('clozet.my')) {
    const separator = productUrl.includes('?') ? '&' : '?';
    finalUrl = `${productUrl}${separator}s2dm_cid=${campaignId}&s2dm_sid=${senderIgId}`;
  }

  return Response.redirect(finalUrl, 302);
}
