import { Env } from './types';
import { createClient } from '@supabase/supabase-js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST',
  'Content-Type': 'application/json',
};

const CAFE24_SCOPES = 'mall.read_product mall.read_store mall.read_order mall.read_salesreport mall.read_category';
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
 * Cafe24 OAuth 시작
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
  return Response.redirect(buildAuthUrl(mallId, env.CAFE24_CLIENT_ID, redirectUri, state), 302);
}

/**
 * GET /auth/cafe24/callback?code=...&state=...
 *
 * 1. code → access_token 교환
 * 2. Cafe24 store 정보 조회
 * 3. Supabase auth user 자동 생성 (없으면)
 * 4. Clozet seller_profile 자동 생성 (status: active)
 * 5. share2dm_brands에 cafe24 + clozet_seller_id 업데이트
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

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  // 1. Authorization Code → Access Token
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
    console.error('[Cafe24 CB] token exchange failed:', await tokenRes.text());
    return Response.redirect(`${dashboardUrl}?cafe24_error=token_failed`, 302);
  }

  const tokenData = await tokenRes.json() as {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
  };

  // 2. Cafe24 store 정보 조회 (mall.read_store 스코프)
  let shopName = mallId;
  let ownerName = mallId;
  let contactPhone = '';
  let businessNumber = '';

  try {
    const storeRes = await fetch(
      `https://${mallId}.cafe24api.com/api/v2/admin/store`,
      { headers: { Authorization: `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json' } }
    );
    if (storeRes.ok) {
      const storeData = await storeRes.json() as { store?: any };
      const store = storeData.store;
      if (store) {
        shopName = store.shop_name || mallId;
        ownerName = store.ceo_name || mallId;
        contactPhone = store.phone || '';
        businessNumber = store.business_registration_number || '';
      }
    }
  } catch (e) {
    console.warn('[Cafe24 CB] store info fetch failed, using defaults');
  }

  // 3. brand 정보 조회 (notification_email 가져오기)
  const { data: brand } = await supabase
    .from('share2dm_brands')
    .select('notification_email, clozet_seller_id')
    .eq('id', brandId)
    .single();

  const contactEmail = brand?.notification_email || `${mallId}@cafe24.clozet.my`;

  // 4. Clozet seller_profile이 이미 있으면 재사용
  let sellerProfileId: string | null = brand?.clozet_seller_id ?? null;

  if (!sellerProfileId) {
    // 4a. Supabase auth user 자동 생성
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: contactEmail,
      email_confirm: true,
      user_metadata: { source: 'cafe24', mall_id: mallId },
    });

    let authUserId: string | null = null;

    if (authError) {
      // 이미 존재하는 이메일이면 기존 user 조회
      if (authError.message?.includes('already been registered') || authError.message?.includes('already registered')) {
        const { data: existingUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const existing = existingUsers?.users?.find(u => u.email === contactEmail);
        authUserId = existing?.id ?? null;
        console.log('[Cafe24 CB] existing auth user found:', authUserId);
      } else {
        console.error('[Cafe24 CB] auth user creation failed:', authError.message);
        return Response.redirect(`${dashboardUrl}?cafe24_error=auth_failed`, 302);
      }
    } else {
      authUserId = authData.user?.id ?? null;
      console.log('[Cafe24 CB] auth user created:', authUserId);
    }

    if (!authUserId) {
      return Response.redirect(`${dashboardUrl}?cafe24_error=auth_user_missing`, 302);
    }

    // 4b. Clozet seller_profile 자동 생성 (status: active)
    const { data: newProfile, error: profileError } = await supabase
      .from('seller_profile')
      .upsert({
        user_id: authUserId,
        store_name: shopName,
        owner_name: ownerName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        business_number: businessNumber || `CAFE24-${mallId}`,
        status: 'active',
        bio: `Cafe24 연동 (${mallId}.cafe24.com)`,
      }, { onConflict: 'user_id' })
      .select('id')
      .single();

    if (profileError || !newProfile) {
      console.error('[Cafe24 CB] seller_profile creation failed:', profileError?.message);
      return Response.redirect(`${dashboardUrl}?cafe24_error=profile_failed`, 302);
    }

    sellerProfileId = newProfile.id;
    console.log('[Cafe24 CB] seller_profile created:', sellerProfileId);
  }

  // 5. share2dm_brands 업데이트 (cafe24 토큰 + clozet_seller_id)
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
      clozet_seller_id: sellerProfileId,
      clozet_store_name: shopName,
      clozet_connected_at: new Date().toISOString(),
    })
    .eq('id', brandId);

  if (updateErr) {
    console.error('[Cafe24 CB] brands update error:', updateErr.message);
    return Response.redirect(`${dashboardUrl}?cafe24_error=db_failed`, 302);
  }

  // 6. Cafe24 Webhook 자동 등록
  await registerCafe24Webhooks(mallId, tokenData.access_token, env);

  console.log(`[Cafe24 CB] connected: brand_id=${brandId}, mall_id=${mallId}, seller_profile=${sellerProfileId}`);
  return Response.redirect(
    `${dashboardUrl}?cafe24_connected=true&cafe24_mall=${encodeURIComponent(mallId)}`,
    302
  );
}

/**
 * Cafe24 Webhook 등록
 * OAuth 연결 완료 시 자동 호출.
 * 이미 등록된 webhook은 중복 등록되지 않음 (Cafe24가 URL 기준으로 dedup).
 */
async function registerCafe24Webhooks(mallId: string, accessToken: string, env: Env): Promise<void> {
  const webhookUrl = 'https://go.share2dm.xyz/cafe24/webhook';

  const events = [
    { event_type: 'product_created',       resource_version: '2024-03-01' },
    { event_type: 'product_updated',       resource_version: '2024-03-01' },
    { event_type: 'product_deleted',       resource_version: '2024-03-01' },
    { event_type: 'order_placed',          resource_version: '2024-03-01' },
    { event_type: 'order_paid',            resource_version: '2024-03-01' },
  ];

  for (const event of events) {
    try {
      const res = await fetch(
        `https://${mallId}.cafe24api.com/api/v2/webhooks`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Cafe24-Client-Id': env.CAFE24_CLIENT_ID,
          },
          body: JSON.stringify({
            shop_no: 1,
            event_type: event.event_type,
            resource_version: event.resource_version,
            endpoint: webhookUrl,
          }),
        }
      );

      const result = await res.json() as any;

      if (!res.ok) {
        // 409 = 이미 등록된 webhook → 정상
        if (res.status === 409) {
          console.log(`[Cafe24 Webhook Reg] 이미 등록됨: ${event.event_type}`);
        } else {
          console.error(`[Cafe24 Webhook Reg] 등록 실패: ${event.event_type}`, result);
        }
      } else {
        console.log(`[Cafe24 Webhook Reg] 등록 완료: ${event.event_type}`);
      }
    } catch (e: any) {
      console.error(`[Cafe24 Webhook Reg] 오류: ${event.event_type}`, e.message);
    }
  }
}

/**
 * POST /cafe24/products/sync?brand_id=...
 *
 * Cafe24 상품을 Clozet products 테이블로 sync.
 * share2dm_cafe24_products에도 매핑 정보 저장.
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
    .select('cafe24_mall_id, cafe24_access_token, cafe24_refresh_token, cafe24_token_expires_at, clozet_seller_id')
    .eq('id', brandId)
    .single();

  if (!brand?.cafe24_mall_id || !brand?.cafe24_access_token) {
    return new Response(JSON.stringify({ error: 'cafe24_not_connected' }), {
      status: 403,
      headers: CORS_HEADERS,
    });
  }

  if (!brand.clozet_seller_id) {
    return new Response(JSON.stringify({ error: 'clozet_not_connected' }), {
      status: 403,
      headers: CORS_HEADERS,
    });
  }

  // seller_profile store_name 조회
  const { data: sellerProfile } = await supabase
    .from('seller_profile')
    .select('store_name')
    .eq('id', brand.clozet_seller_id)
    .single();

  const storeName = sellerProfile?.store_name || brand.cafe24_mall_id;

  const token = await getValidToken(brand, brandId, env, supabase);
  if (!token) {
    return new Response(JSON.stringify({ error: 'token_refresh_failed' }), {
      status: 401,
      headers: CORS_HEADERS,
    });
  }

  // Cafe24 상품 전체 조회 (판매 중인 것만)
  let allProducts: any[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const res = await fetch(
      `https://${brand.cafe24_mall_id}.cafe24api.com/api/v2/admin/products?limit=${limit}&offset=${offset}&display=T&selling=T&fields=product_no,product_name,price,detail_image,list_image,selling,description`,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    if (!res.ok) {
      console.error('[Cafe24 Sync] products fetch error:', await res.text());
      break;
    }

    const data = await res.json() as { products?: any[] };
    const products = data.products ?? [];
    allProducts = [...allProducts, ...products];
    if (products.length < limit) break;
    offset += limit;
  }

  let syncedCount = 0;

  for (const p of allProducts) {
    const productUrl = `https://${brand.cafe24_mall_id}.cafe24.com/product/detail.html?product_no=${p.product_no}`;
    const imageUrl = p.detail_image || p.list_image || null;

    // Clozet products 테이블에 upsert
    // 기존 매핑 확인
    const { data: existingMapping } = await supabase
      .from('share2dm_cafe24_products')
      .select('clozet_product_id')
      .eq('brand_id', brandId)
      .eq('cafe24_product_no', p.product_no)
      .maybeSingle();

    let clozetProductId = existingMapping?.clozet_product_id ?? null;

    if (clozetProductId) {
      // 기존 Clozet 상품 업데이트
      await supabase
        .from('products')
        .update({
          product_name: p.product_name,
          price: parseFloat(p.price ?? '0'),
          main_images: imageUrl ? [imageUrl] : [],
          description: p.description || '',
          status: p.selling === 'T' ? 'active' : 'inactive',
        })
        .eq('product_id', clozetProductId);
    } else {
      // 신규 Clozet 상품 생성
      const { data: newProduct } = await supabase
        .from('products')
        .insert({
          seller_id: brand.clozet_seller_id,
          product_name: p.product_name,
          price: parseFloat(p.price ?? '0'),
          main_images: imageUrl ? [imageUrl] : [],
          description: p.description || '',
          keywords: [],
          status: p.selling === 'T' ? 'active' : 'inactive',
          store_name: storeName,
        })
        .select('product_id')
        .single();

      clozetProductId = newProduct?.product_id ?? null;
    }

    // share2dm_cafe24_products 매핑 upsert
    await supabase
      .from('share2dm_cafe24_products')
      .upsert({
        brand_id: brandId,
        cafe24_product_no: p.product_no,
        product_name: p.product_name,
        price: parseFloat(p.price ?? '0'),
        image_url: imageUrl,
        product_url: productUrl,
        is_active: p.selling === 'T',
        synced_at: new Date().toISOString(),
        clozet_product_id: clozetProductId,
      }, { onConflict: 'brand_id,cafe24_product_no' });

    syncedCount++;
  }

  console.log(`[Cafe24 Sync] brand_id=${brandId}: ${syncedCount}개 상품 sync 완료`);
  return new Response(JSON.stringify({ synced: syncedCount }), {
    status: 200,
    headers: CORS_HEADERS,
  });
}

/**
 * GET /cafe24/products/list?brand_id=...
 * 캐시된 Cafe24 상품 목록 반환 (Dashboard 캠페인 생성 시 상품 선택용)
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

// Access token 만료 시 refresh
async function getValidToken(
  brand: {
    cafe24_mall_id: string;
    cafe24_access_token: string;
    cafe24_refresh_token: string;
    cafe24_token_expires_at: string | null;
  },
  brandId: string,
  env: Env,
  supabase: ReturnType<typeof createClient>
): Promise<string | null> {
  if (brand.cafe24_token_expires_at) {
    const expiresAt = new Date(brand.cafe24_token_expires_at).getTime();
    if (expiresAt - Date.now() > 5 * 60 * 1000) {
      return brand.cafe24_access_token;
    }
  } else {
    return brand.cafe24_access_token;
  }

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
