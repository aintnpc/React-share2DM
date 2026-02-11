import { Env } from './types';
import { handleWebhookVerification, handleWebhookEvent } from './webhook';
import { handleTracking } from './tracking';
import { handleOAuthCallback, handleOAuthCallbackGet } from './auth';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

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

    // Health check
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'share2dm' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
