import { Env } from './types';
import { createClient } from '@supabase/supabase-js';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface IGAccountResponse {
  data: Array<{
    id: string;
    name: string;
    instagram_business_account?: {
      id: string;
    };
  }>;
}

// Common OAuth logic: exchange code → long-lived token → IG account → webhook → save brand
async function processOAuth(code: string, redirectUri: string, env: Env) {
  // 1. Exchange code for short-lived token
  const tokenParams = new URLSearchParams({
    client_id: env.META_APP_ID,
    client_secret: env.META_APP_SECRET,
    redirect_uri: redirectUri,
    code: code,
  });

  const tokenRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?${tokenParams}`
  );
  const tokenData: TokenResponse = await tokenRes.json() as TokenResponse;

  if (!tokenData.access_token) {
    throw new Error('Token exchange failed');
  }

  // 2. Exchange for long-lived token (60 days)
  const longTokenParams = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: env.META_APP_ID,
    client_secret: env.META_APP_SECRET,
    fb_exchange_token: tokenData.access_token,
  });

  const longTokenRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?${longTokenParams}`
  );
  const longTokenData: TokenResponse = await longTokenRes.json() as TokenResponse;
  const accessToken = longTokenData.access_token || tokenData.access_token;

  // 3. Get Facebook Pages linked to user
  const pagesRes = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`
  );
  const pagesData: IGAccountResponse = await pagesRes.json() as IGAccountResponse;

  // 4. Find page with Instagram Business Account
  const pageWithIG = pagesData.data?.find(
    (p) => p.instagram_business_account?.id
  );

  if (!pageWithIG || !pageWithIG.instagram_business_account) {
    throw new Error('Instagram 비즈니스 계정을 찾을 수 없습니다.');
  }

  const igAccountId = pageWithIG.instagram_business_account.id;
  const brandName = pageWithIG.name;

  // 5. Webhook subscription is configured manually in Meta App Dashboard

  // 6. Save brand to Supabase
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  const expiresAt = longTokenData.expires_in
    ? new Date(Date.now() + longTokenData.expires_in * 1000).toISOString()
    : null;

  const { data: brand, error } = await supabase
    .from('brands')
    .upsert(
      {
        brand_name: brandName,
        ig_account_id: igAccountId,
        ig_access_token: accessToken,
        token_expires_at: expiresAt,
      },
      { onConflict: 'ig_account_id' }
    )
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return brand;
}

// GET /auth/callback — Facebook redirects here with ?code=...&state=...
export async function handleOAuthCallbackGet(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  const frontendOrigin = state ? decodeURIComponent(state) : 'http://localhost:3000';

  if (error || !code) {
    const errorMsg = encodeURIComponent(error || 'no_code');
    return Response.redirect(`${frontendOrigin}/login?error=${errorMsg}`, 302);
  }

  try {
    const redirectUri = `${url.origin}/auth/callback`;
    const brand = await processOAuth(code, redirectUri, env);

    const params = new URLSearchParams({
      brand_id: brand.id,
      brand_name: brand.brand_name,
    });
    return Response.redirect(`${frontendOrigin}/auth/callback?${params}`, 302);
  } catch (err: any) {
    const errorMsg = encodeURIComponent(err.message);
    return Response.redirect(`${frontendOrigin}/login?error=${errorMsg}`, 302);
  }
}

// POST /auth/callback — legacy: frontend sends { code, redirect_uri }
export async function handleOAuthCallback(
  request: Request,
  env: Env
): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const body: { code: string; redirect_uri: string } = await request.json();
    const brand = await processOAuth(body.code, body.redirect_uri, env);

    return new Response(
      JSON.stringify({
        brand_id: brand.id,
        brand_name: brand.brand_name,
        ig_account_id: brand.ig_account_id,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
