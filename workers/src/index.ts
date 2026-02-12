import { Env } from './types';
import { handleWebhookVerification, handleWebhookEvent } from './webhook';
import { handleTracking } from './tracking';
import { handleOAuthCallback, handleOAuthCallbackGet } from './auth';
import { createClient } from '@supabase/supabase-js';

async function handleDebugSubscriptions(env: Env): Promise<Response> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  const { data: brands } = await supabase.from('brands').select('*');

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

    results.push({
      brand: brand.brand_name,
      page: meData.name,
      pageId,
      igAccount: meData.instagram_business_account?.id,
      storedIgAccountId: brand.ig_account_id,
      tokenExpiresAt: brand.token_expires_at,
      currentSubscriptions: subCheckData,
      resubscribeResult: resubData,
    });
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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
        return handleWebhookEvent(request, env);
      }

      // Click tracking redirect (GET /t/{campaign_id}/{sender_ig_id})
      if (url.pathname.startsWith('/t/') && request.method === 'GET') {
        return handleTracking(request, env);
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
