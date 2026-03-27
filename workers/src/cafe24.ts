import { Env } from './types';
import { createClient } from '@supabase/supabase-js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST',
  'Content-Type': 'application/json',
};

const CAFE24_SCOPES = 'mall.read_product';
const FRONTEND_ORIGIN = 'https://share2dm.xyz';

function buildAuthUrl(mallId: string, clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: CAFE24_SCOPES,
    state,
  });
  return `https://${mallId}.cafe24api.com/api/v2/oauth/authorize?${params}`;
}

/**
 * GET /auth/cafe24?brand_id=...&mall_id=...
 * Cafe24 OAuth 시작 → Cafe24 인증 페이지로 리다이렉트
 */
export async function handleCafe24Auth(url: URL, env: Env): Promise<Response> {
  const brandId = url.searchParams.get('brand_id');
  const mallId = url.searchParams.get('mall_id')?.toLowerCase().trim();

  if (!brandId || !mallId) {
    return new Response(JSON.stringify({ error: 'brand_id and mall_id required' }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  const state = btoa(JSON.stringify({
    brand_id: brandId,
    mall_id: mallId,
    nonce: crypto.randomUUID(),
  }));

  const redirectUri = `${url.origin}/auth/cafe24/callback`;
  const authUrl = buildAuthUrl(mallId, env.CAFE24_CLIENT_ID, redirectUri, state);

  return Response.redirect(authUrl, 302);
}

/**
 * GET /auth/cafe24/callback?code=...&state=...
 * Cafe24 OAuth 콜백 → code → access_token 교환 → DB 저장
 */
export async function handleCafe24Callback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  const dashboardUrl = `${FRONTEND_ORIGIN}/dashboard`;

  if (!code || !stateParam) {
    return Response.redirect(`${dashboardUrl}?cafe24_error=missing_params`, 302);
  }

  let brandId: string, mallId: string;
  try {
    const state = JSON.parse(atob(stateParam));
    brandId = state.brand_id;
    mallId = state.mall_id;
    if (!brandId || !mallId) throw new Error('missing fields');
  } catch {
    return Response.redirect(`${dashboardUrl}?cafe24_error=invalid_state`, 302);
  }

  // Authorization Code → Access Token 교환
  const redirectUri = `${url.origin}/auth/cafe24/callback`;
  const tokenRes = await fetch(`https://${mallId}.cafe24api.com/api/v2/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${env.CAFE24_CLIENT_ID}:${env.CAFE24_CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error('[Cafe24 CB] token exchange failed:', errText);
    return Response.redirect(`${dashboardUrl}?cafe24_error=token_failed`, 302);
  }

  const tokenData = await tokenRes.json() as {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
  };

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  const { error: updateErr } = await supabase
    .from('share2dm_brands')
    .update({
      cafe24_mall_id: mallId,
      cafe24_access_token: tokenData.access_token,
      cafe24_refresh_token: tokenData.refresh_token,
      cafe24_token_expires_at: tokenData.expires_at
        ? new Date(tokenData.expires_at * 1000).toISOString()
        : null,
      cafe24_connected_at: new Date().toISOString(),
    })
    .eq('id', brandId);

  if (updateErr) {
    console.error('[Cafe24 CB] DB update error:', updateErr.message);
    return Response.redirect(`${dashboardUrl}?cafe24_error=db_failed`, 302);
  }

  console.log(`[Cafe24 CB] connected: brand_id=${brandId}, mall_id=${mallId}`);
  return Response.redirect(
    `${dashboardUrl}?cafe24_connected=true&cafe24_mall=${encodeURIComponent(mallId)}`,
    302
  );
}

/**
 * POST /cafe24/products/sync?brand_id=...
 * Cafe24 상품 목록을 share2dm_cafe24_products 테이블에 sync
 */
export async function handleCafe24ProductsSync(url: URL, env: Env): Promise<Response> {
  const brandId = url.searchParams.get('brand_id');
  if (!brandId) {
    return new Response(JSON.stringify({ error: 'brand_id required' }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  const { data: brand } = await supabase
    .from('share2dm_brands')
    .select('cafe24_mall_id, cafe24_access_token, cafe24_refresh_token, cafe24_token_expires_at')
    .eq('id', brandId)
    .single();

  if (!brand?.cafe24_mall_id || !brand?.cafe24_access_token) {
    return new Response(JSON.stringify({ error: 'cafe24_not_connected' }), {
      status: 403,
      headers: CORS_HEADERS,
    });
  }

  const token = await getValidToken(brand, brandId, env, supabase);
  if (!token) {
    return new Response(JSON.stringify({ error: 'token_refresh_failed' }), {
      status: 401,
      headers: CORS_HEADERS,
    });
  }

  // Cafe24 상품 전체 페이징 조회 (판매 중인 상품만)
  let allProducts: any[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const res = await fetch(
      `https://${brand.cafe24_mall_id}.cafe24api.com/api/v2/admin/products?limit=${limit}&offset=${offset}&display=T&selling=T&fields=product_no,product_name,price,detail_image,list_image,selling`,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('[Cafe24 Sync] products fetch error:', err);
      break;
    }

    const data = await res.json() as { products?: any[] };
    const products = data.products ?? [];
    allProducts = [...allProducts, ...products];
    if (products.length < limit) break;
    offset += limit;
  }

  if (allProducts.length > 0) {
    const rows = allProducts.map((p: any) => ({
      brand_id: brandId,
      cafe24_product_no: p.product_no,
      product_name: p.product_name,
      price: parseFloat(p.price ?? '0'),
      image_url: p.detail_image || p.list_image || null,
      product_url: `https://${brand.cafe24_mall_id}.cafe24.com/product/detail.html?product_no=${p.product_no}`,
      is_active: p.selling === 'T',
      synced_at: new Date().toISOString(),
    }));

    const { error: upsertErr } = await supabase
      .from('share2dm_cafe24_products')
      .upsert(rows, { onConflict: 'brand_id,cafe24_product_no' });

    if (upsertErr) {
      console.error('[Cafe24 Sync] upsert error:', upsertErr.message);
      return new Response(JSON.stringify({ error: 'sync_failed' }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }
  }

  console.log(`[Cafe24 Sync] brand_id=${brandId}: ${allProducts.length}개 상품 sync 완료`);
  return new Response(JSON.stringify({ synced: allProducts.length }), {
    status: 200,
    headers: CORS_HEADERS,
  });
}

/**
 * GET /cafe24/products/list?brand_id=...
 * 캐시된 Cafe24 상품 목록 반환 (캠페인 생성 시 상품 선택용)
 */
export async function handleCafe24ProductsList(url: URL, env: Env): Promise<Response> {
  const brandId = url.searchParams.get('brand_id');
  if (!brandId) {
    return new Response(JSON.stringify({ error: 'brand_id required' }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  const { data: products } = await supabase
    .from('share2dm_cafe24_products')
    .select('cafe24_product_no, product_name, price, image_url, product_url')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .order('product_name');

  return new Response(JSON.stringify({ products: products ?? [] }), {
    status: 200,
    headers: CORS_HEADERS,
  });
}

// 토큰 만료 시 refresh token으로 갱신
async function getValidToken(
  brand: { cafe24_mall_id: string; cafe24_access_token: string; cafe24_refresh_token: string; cafe24_token_expires_at: string | null },
  brandId: string,
  env: Env,
  supabase: ReturnType<typeof createClient>
): Promise<string | null> {
  // 만료 5분 전까지는 기존 토큰 사용
  if (brand.cafe24_token_expires_at) {
    const expiresAt = new Date(brand.cafe24_token_expires_at).getTime();
    if (expiresAt - Date.now() > 5 * 60 * 1000) {
      return brand.cafe24_access_token;
    }
  } else {
    return brand.cafe24_access_token;
  }

  // Refresh
  const res = await fetch(`https://${brand.cafe24_mall_id}.cafe24api.com/api/v2/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${env.CAFE24_CLIENT_ID}:${env.CAFE24_CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: brand.cafe24_refresh_token,
    }),
  });

  if (!res.ok) {
    console.error('[Cafe24] token refresh failed');
    return null;
  }

  const data = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
  };

  await supabase
    .from('share2dm_brands')
    .update({
      cafe24_access_token: data.access_token,
      cafe24_refresh_token: data.refresh_token,
      cafe24_token_expires_at: data.expires_at
        ? new Date(data.expires_at * 1000).toISOString()
        : null,
    })
    .eq('id', brandId);

  return data.access_token;
}
