import { Env } from './types';
import { handleWebhookVerification, handleWebhookEvent } from './webhook';
import { handleTracking } from './tracking';
import { handleOAuthCallback, handleOAuthCallbackGet } from './auth';
import { handleClozetCallback, handleClozetContentLookup } from './clozet';
import { handleIssueBillingKey } from './billing';
import { createClient } from '@supabase/supabase-js';

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

      // media-id: brand의 access token으로 shortcode → media_id (GET /media-id?brand_id=...&url=...)
      if (url.pathname === '/media-id' && request.method === 'GET') {
        return handleMediaId(url, env);
      }

      // Clozet B.O에서 연결 완료 후 리다이렉트 (GET /auth/clozet/callback?token=...&brand_id=...&state=...&origin=...)
      if (url.pathname === '/auth/clozet/callback' && request.method === 'GET') {
        return handleClozetCallback(request, env);
      }

      // 캠페인 생성 시 Clozet 콘텐츠 조회 (GET /clozet/contents?brand_id=...&ig_code=...)
      if (url.pathname === '/clozet/contents' && request.method === 'GET') {
        return handleClozetContentLookup(url, env);
      }

      // 토스페이먼츠 빌링키 발급 (POST /billing/issue-billing-key)
      if (url.pathname === '/billing/issue-billing-key' && request.method === 'POST') {
        return handleIssueBillingKey(request, env);
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
};
