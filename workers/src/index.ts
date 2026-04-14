import { Env } from './types';
import { handleWebhookVerification, handleWebhookEvent } from './webhook';
import { handleTracking } from './tracking';
import { handleOAuthCallback, handleOAuthCallbackGet, handleInitFromToken } from './auth';
import { handleClozetCallback, handleClozetContentLookup } from './clozet';
import { handleCafe24Auth, handleCafe24Callback, handleCafe24ProductsSync, handleCafe24ProductsList } from './cafe24';
import { handleCafe24Webhook } from './cafe24webhook';
import { handleIssueBillingKey, handleBillingCron } from './billing';
import { handleQueueCron, handleQueueStatus, handleAdminStats } from './queue-processor';
import { createClient } from '@supabase/supabase-js';
import { sendTokenExpiryWarning } from './email';

async function handleDebugSubscriptions(env: Env): Promise<Response> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  const { data: brands } = await supabase.from('share2dm_brands').select('*');

  if (!brands?.length) {
    return new Response(JSON.stringify({ error: 'No brands found' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const results = [];

  for (const brand of brands) {
    const token = brand.ig_access_token;

    // Token is a Page Access Token, so `me` returns the Page itself
    const meRes = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name,instagram_business_account&access_token=${token}`
    );
    const meData: any = await meRes.json();

    if (meData.error) {
      results.push({ brand: brand.brand_name, tokenError: meData.error });
      continue;
    }

    const pageId = meData.id;

    // Check current subscriptions
    const subCheckRes = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?access_token=${token}`
    );
    const subCheckData: any = await subCheckRes.json();

    // Re-subscribe
    const resubRes = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscribed_fields: ['messages'],
          access_token: token,
        }),
      }
    );
    const resubData: any = await resubRes.json();

    // Check IG messaging access (conversations)
    const igId = meData.instagram_business_account?.id;
    let conversationsCheck: any = null;
    if (igId) {
      const convRes = await fetch(
        `https://graph.instagram.com/v21.0/${igId}/conversations?access_token=${token}`
      );
      conversationsCheck = await convRes.json();
    }

    // Check app-level webhook subscriptions
    const appSubRes = await fetch(
      `https://graph.facebook.com/v21.0/${env.META_APP_ID}/subscriptions?access_token=${env.META_APP_ID}|${env.META_APP_SECRET}`
    );
    const appSubData: any = await appSubRes.json();

    results.push({
      brand: brand.brand_name,
      page: meData.name,
      pageId,
      igAccount: igId,
      storedIgAccountId: brand.ig_account_id,
      tokenExpiresAt: brand.token_expires_at,
      currentSubscriptions: subCheckData,
      resubscribeResult: resubData,
      igConversations: conversationsCheck,
      appWebhookSubscriptions: appSubData,
    });
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// /media-list?brand_id=... → brand의 최근 미디어 목록 반환 (릴/포스트 선택 UI용)
async function handleMediaList(url: URL, env: Env): Promise<Response> {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  const brandId = url.searchParams.get('brand_id');
  if (!brandId) {
    return new Response(JSON.stringify({ error: 'brand_id required' }), { status: 400, headers });
  }

  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    const { data: brand } = await supabase
      .from('share2dm_brands')
      .select('ig_account_id, ig_access_token')
      .eq('id', brandId)
      .single();

    if (!brand) {
      return new Response(JSON.stringify({ error: 'brand not found' }), { status: 404, headers });
    }

    const res = await fetch(
      `https://graph.facebook.com/v21.0/${brand.ig_account_id}/media?fields=id,shortcode,media_type,thumbnail_url,media_url,timestamp,permalink&limit=20&access_token=${brand.ig_access_token}`
    );
    const data = await res.json() as { data?: any[]; error?: { message: string } };

    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message }), { status: 400, headers });
    }

    return new Response(JSON.stringify({ media: data.data ?? [] }), { status: 200, headers });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
}

// Daily cron: ig_contents_code 있는 콘텐츠의 video_url + thumbnail_url 일괄 갱신
async function refreshIgContentUrls(supabase: any): Promise<void> {
  console.log('[Cron] IG content URL refresh started');

  // 1. ig_contents_code 있는 모든 콘텐츠와 creator_id 조회
  const { data: contents } = await supabase
    .from('contents')
    .select('id, ig_contents_code, creator_id')
    .not('ig_contents_code', 'is', null);

  if (!contents?.length) {
    console.log('[Cron] No ig_contents_code contents found');
    return;
  }

  // 2. creator_id → brand access token 매핑 (중복 조회 방지)
  const brandTokenCache: Record<string, string> = {};
  const { data: brands } = await supabase
    .from('share2dm_brands')
    .select('clozet_seller_id, ig_access_token');
  for (const brand of brands ?? []) {
    brandTokenCache[brand.clozet_seller_id] = brand.ig_access_token;
  }

  let updated = 0;
  let failed = 0;

  for (const content of contents) {
    const token = brandTokenCache[content.creator_id];
    if (!token) { failed++; continue; }

    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${content.ig_contents_code}?fields=media_url,thumbnail_url,media_type&access_token=${token}`
      );
      const data = await res.json() as any;
      if (data.error) { failed++; continue; }

      await supabase
        .from('contents')
        .update({
          video_url: data.media_url ?? null,
          thumbnail_url: data.thumbnail_url ?? data.media_url ?? null,
          url_refreshed_at: new Date().toISOString(),
        })
        .eq('id', content.id);

      updated++;
    } catch {
      failed++;
    }
  }

  console.log(`[Cron] IG URL refresh done: ${updated} updated, ${failed} failed`);
}

// /video-url?brand_id=...&media_id=... → IG Graph API로 실시간 video/thumbnail URL 반환
async function handleVideoUrl(url: URL, env: Env): Promise<Response> {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  const brandId = url.searchParams.get('brand_id');
  const mediaId = url.searchParams.get('media_id');

  if (!brandId || !mediaId) {
    return new Response(JSON.stringify({ error: 'brand_id and media_id required' }), { status: 400, headers });
  }

  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    const { data: brand } = await supabase
      .from('share2dm_brands')
      .select('ig_access_token')
      .eq('id', brandId)
      .single();

    if (!brand) {
      return new Response(JSON.stringify({ error: 'brand not found' }), { status: 404, headers });
    }

    const res = await fetch(
      `https://graph.facebook.com/v21.0/${mediaId}?fields=media_url,thumbnail_url,media_type&access_token=${brand.ig_access_token}`
    );
    const data = await res.json() as { media_url?: string; thumbnail_url?: string; media_type?: string; error?: { message: string } };

    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message }), { status: 400, headers });
    }

    return new Response(JSON.stringify({
      video_url: data.media_url ?? null,
      thumbnail_url: data.thumbnail_url ?? null,
      media_type: data.media_type ?? null,
    }), { status: 200, headers });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
}

// /media-id?brand_id=...&url=... → brand의 access token으로 media 조회 → ig_contents_id 반환
async function handleMediaId(url: URL, env: Env): Promise<Response> {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Content-Type': 'application/json',
  };

  const brandId = url.searchParams.get('brand_id');
  const igUrl = url.searchParams.get('url');

  if (!brandId || !igUrl) {
    return new Response(JSON.stringify({ error: 'brand_id and url required' }), { status: 400, headers });
  }

  // shortcode 추출
  const shortcodeMatch = igUrl.match(/\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
  const shortcode = shortcodeMatch?.[1];
  if (!shortcode) {
    return new Response(JSON.stringify({ error: 'invalid instagram url' }), { status: 400, headers });
  }

  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    const { data: brand } = await supabase
      .from('share2dm_brands')
      .select('ig_account_id, ig_access_token')
      .eq('id', brandId)
      .single();

    if (!brand) {
      return new Response(JSON.stringify({ error: 'brand not found' }), { status: 404, headers });
    }

    // brand의 media 목록에서 shortcode 매칭
    let mediaId: string | null = null;
    let nextUrl: string | null =
      `https://graph.facebook.com/v21.0/${brand.ig_account_id}/media?fields=id,shortcode&limit=50&access_token=${brand.ig_access_token}`;

    while (nextUrl && !mediaId) {
      const res = await fetch(nextUrl);
      const data: any = await res.json();

      if (data.error) {
        console.log('[media-id] graph error:', JSON.stringify(data.error));
        return new Response(JSON.stringify({ error: data.error.message }), { status: 400, headers });
      }

      const match = data.data?.find((m: any) => m.shortcode === shortcode);
      if (match) {
        mediaId = match.id;
      } else {
        nextUrl = data.paging?.next || null;
      }
    }

    if (!mediaId) {
      return new Response(JSON.stringify({ error: 'media not found for this shortcode' }), { status: 404, headers });
    }

    console.log('[media-id] shortcode:', shortcode, '→ media_id:', mediaId);
    return new Response(JSON.stringify({ media_id: mediaId }), { status: 200, headers });
  } catch (e: any) {
    console.log('[media-id] failed:', e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    console.log(`[Worker] ${request.method} ${url.pathname}`);

    try {
      // CORS headers for web dashboard
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }

      // OAuth callback from Meta (GET /auth/callback?code=...&state=...)
      if (url.pathname === '/auth/callback' && request.method === 'GET') {
        return handleOAuthCallbackGet(request, env);
      }

      // OAuth callback legacy (POST /auth/callback)
      if (url.pathname === '/auth/callback' && request.method === 'POST') {
        return handleOAuthCallback(request, env);
      }

      // Init brand from Clozet BackOffice token (POST /auth/init-from-token)
      if (url.pathname === '/auth/init-from-token' && request.method === 'POST') {
        return handleInitFromToken(request, env);
      }

      // Webhook verification (GET /webhook)
      if (url.pathname === '/webhook' && request.method === 'GET') {
        return handleWebhookVerification(request, env);
      }

      // Webhook event (POST /webhook)
      if (url.pathname === '/webhook' && request.method === 'POST') {
        return handleWebhookEvent(request, env, ctx);
      }

      // Click tracking redirect (GET /t/{campaign_id}/{sender_ig_id})
      if (url.pathname.startsWith('/t/') && request.method === 'GET') {
        return handleTracking(request, env);
      }

      // video-url: IG media_id로 실시간 video/thumbnail URL 반환 (GET /video-url?brand_id=...&media_id=...)
      if (url.pathname === '/video-url' && request.method === 'GET') {
        return handleVideoUrl(url, env);
      }

      // thumbnail-proxy: Instagram CDN 이미지 CORS 우회 프록시 (GET /thumbnail-proxy?url=...)
      if (url.pathname === '/thumbnail-proxy' && request.method === 'GET') {
        const imageUrl = url.searchParams.get('url');
        if (!imageUrl || !imageUrl.includes('cdninstagram.com')) {
          return new Response('invalid url', { status: 400 });
        }
        const res = await fetch(imageUrl);
        const headers = new Headers(res.headers);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Cache-Control', 'public, max-age=3600');
        return new Response(res.body, { status: res.status, headers });
      }

      // media-id: brand의 access token으로 shortcode → media_id (GET /media-id?brand_id=...&url=...)
      if (url.pathname === '/media-id' && request.method === 'GET') {
        return handleMediaId(url, env);
      }

      // media-list: brand의 최근 미디어 목록 (GET /media-list?brand_id=...)
      if (url.pathname === '/media-list' && request.method === 'GET') {
        return handleMediaList(url, env);
      }

      // Cafe24 OAuth 시작 (GET /auth/cafe24?brand_id=...&mall_id=...)
      if (url.pathname === '/auth/cafe24' && request.method === 'GET') {
        return handleCafe24Auth(url, env);
      }

      // Cafe24 OAuth 콜백 (GET /auth/cafe24/callback?code=...&state=...)
      if (url.pathname === '/auth/cafe24/callback' && request.method === 'GET') {
        return handleCafe24Callback(request, env);
      }

      // Cafe24 상품 sync (POST /cafe24/products/sync?brand_id=...)
      if (url.pathname === '/cafe24/products/sync' && request.method === 'POST') {
        return handleCafe24ProductsSync(url, env);
      }

      // Cafe24 상품 목록 조회 (GET /cafe24/products/list?brand_id=...)
      if (url.pathname === '/cafe24/products/list' && request.method === 'GET') {
        return handleCafe24ProductsList(url, env);
      }

      // Cafe24 Webhook (POST /cafe24/webhook) — 상품/주문/재고 변경 자동 반영
      if (url.pathname === '/cafe24/webhook' && request.method === 'POST') {
        return handleCafe24Webhook(request, env);
      }

      // Clozet B.O에서 연결 완료 후 리다이렉트 (GET /auth/clozet/callback?token=...&brand_id=...&state=...&origin=...)
      if (url.pathname === '/auth/clozet/callback' && request.method === 'GET') {
        return handleClozetCallback(request, env, ctx);
      }

      // 캠페인 생성 시 Clozet 콘텐츠 조회 (GET /clozet/contents?brand_id=...&ig_code=...)
      if (url.pathname === '/clozet/contents' && request.method === 'GET') {
        return handleClozetContentLookup(url, env);
      }

      // 토스페이먼츠 빌링키 발급 (POST /billing/issue-billing-key)
      if (url.pathname === '/billing/issue-billing-key' && request.method === 'POST') {
        return handleIssueBillingKey(request, env);
      }

      // Queue status (GET /queue/status?brand_id=...&campaign_id=...)
      if (url.pathname === '/queue/status' && request.method === 'GET') {
        return handleQueueStatus(url, env);
      }

      // Admin stats (GET /admin/stats)
      if (url.pathname === '/admin/stats' && request.method === 'GET') {
        return handleAdminStats(env);
      }

      // Debug: check & resubscribe page webhooks (GET /debug/subscriptions)
      if (url.pathname === '/debug/subscriptions' && request.method === 'GET') {
        return handleDebugSubscriptions(env);
      }


      // Health check
      if (url.pathname === '/' || url.pathname === '/health') {
        return new Response(JSON.stringify({ status: 'ok', service: 'share2dm' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response('Not found', { status: 404 });
    } catch (error) {
      console.error('[Worker] Unhandled error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    // Every minute: process DM queue
    if (event.cron === '*/1 * * * *') {
      console.log('[Cron] Queue processor triggered');
      await handleQueueCron(env);
    }
    // Daily at midnight UTC: billing + queue cleanup
    if (event.cron === '0 0 * * *') {
      console.log('[Cron] Billing cron triggered');
      await handleBillingCron(env);

      // Delete sent/failed queue items older than 7 days
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('share2dm_dm_queue')
        .delete({ count: 'exact' })
        .in('status', ['sent', 'failed'])
        .lt('created_at', sevenDaysAgo);
      console.log(`[Cron] Queue cleanup: deleted ${count} old sent/failed items`);

      // Refresh Instagram video_url + thumbnail_url for all ig_contents_code contents
      await refreshIgContentUrls(supabase);

      // Token expiry D-7 warning
      if (env.RESEND_API_KEY) {
        const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const oneDayLater = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();
        const { data: expiringBrands } = await supabase
          .from('share2dm_brands')
          .select('brand_name, notification_email, token_expires_at')
          .not('notification_email', 'is', null)
          .lte('token_expires_at', sevenDaysLater)
          .gte('token_expires_at', oneDayLater);
        for (const brand of expiringBrands ?? []) {
          const daysLeft = Math.ceil((new Date(brand.token_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          try {
            await sendTokenExpiryWarning(env.RESEND_API_KEY, brand.notification_email, brand.brand_name, daysLeft);
            console.log(`[Cron] Token expiry warning sent to ${brand.notification_email} (${daysLeft} days left)`);
          } catch (e: any) {
            console.error(`[Cron] Failed to send expiry warning:`, e.message);
          }
        }
      }
    }
  },
};
