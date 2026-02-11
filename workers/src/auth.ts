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
    access_token?: string;
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

  console.log('[OAuth] Step 1 - short-lived token:', JSON.stringify(tokenData));

  if (!tokenData.access_token) {
    throw new Error('Token exchange failed: ' + JSON.stringify(tokenData));
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
  console.log('[OAuth] Step 2 - long-lived token:', JSON.stringify(longTokenData));
  const accessToken = longTokenData.access_token || tokenData.access_token;

  // 2.5. Check actual permissions on this token
  const permRes = await fetch(
    `https://graph.facebook.com/v21.0/me/permissions?access_token=${accessToken}`
  );
  const permData = await permRes.json();
  console.log('[OAuth] Token permissions:', JSON.stringify(permData));

  // 3. Get Facebook Pages linked to user
  const pagesRes = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${accessToken}`
  );
  const pagesData: IGAccountResponse = await pagesRes.json() as IGAccountResponse;
  console.log('[OAuth] me/accounts response:', JSON.stringify(pagesData));

  // 3.5. If no pages found, check Business Manager
  if (!pagesData.data?.length) {
    const bizRes = await fetch(
      `https://graph.facebook.com/v21.0/me/businesses?access_token=${accessToken}`
    );
    const bizData = await bizRes.json();
    console.log('[OAuth] me/businesses response:', JSON.stringify(bizData));

    // Try to get pages from each business
    if ((bizData as any).data?.length) {
      for (const biz of (bizData as any).data) {
        const bizPagesRes = await fetch(
          `https://graph.facebook.com/v21.0/${biz.id}/owned_pages?fields=id,name,access_token,instagram_business_account&access_token=${accessToken}`
        );
        const bizPagesData = await bizPagesRes.json();
        console.log(`[OAuth] Business ${biz.name} pages:`, JSON.stringify(bizPagesData));

        if ((bizPagesData as any).data?.length) {
          pagesData.data = (bizPagesData as any).data;
          break;
        }
      }
    }
  }

  // 4. Find page with Instagram Business Account
  const pageWithIG = pagesData.data?.find(
    (p) => p.instagram_business_account?.id
  );

  if (!pageWithIG || !pageWithIG.instagram_business_account) {
    const pageNames = pagesData.data?.map(p => p.name).join(', ') || 'none';
    throw new Error(`IG 비즈니스 계정을 찾을 수 없습니다. 연결된 페이지: ${pageNames}`);
  }

  const igAccountId = pageWithIG.instagram_business_account.id;
  const brandName = pageWithIG.name;
  const pageAccessToken = pageWithIG.access_token || accessToken;
  const pageId = pageWithIG.id;

  console.log('[OAuth] Found page:', brandName, 'pageId:', pageId, 'hasPageToken:', !!pageWithIG.access_token);

  // 5. Save brand to Supabase (use page token for DM sending)
  //    Instagram messaging webhooks are configured at app level in Meta Dashboard,
  //    so page-level subscribed_apps is not needed.
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
        ig_access_token: pageAccessToken,
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
