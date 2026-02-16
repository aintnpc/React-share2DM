import { Env } from './types';
import { createClient } from '@supabase/supabase-js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
  'Content-Type': 'application/json',
};

/**
 * GET /auth/clozet/callback?token={uuid}&brand_id={share2dm_brand_id}&state={nonce}&origin={frontend_origin}
 *
 * Clozet B.O에서 연결 완료 후 여기로 리다이렉트.
 * 1. share2dm_connect_tokens 테이블에서 token 검증
 * 2. share2dm_brands에 clozet_seller_id, clozet_store_name, clozet_connected_at 업데이트
 * 3. 프론트엔드 대시보드로 리다이렉트
 */
export async function handleClozetCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const brandId = url.searchParams.get('brand_id');
  const state = url.searchParams.get('state') ?? '';
  const origin = url.searchParams.get('origin')
    ? decodeURIComponent(url.searchParams.get('origin')!)
    : 'https://share2dm.xyz';

  const dashboardUrl = `${origin}/dashboard`;

  if (!token || !brandId) {
    return Response.redirect(`${dashboardUrl}?clozet_error=missing_params`, 302);
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  // 1. 토큰 조회 및 검증
  const { data: tokenRow, error: tokenErr } = await supabase
    .from('share2dm_connect_tokens')
    .select('token, seller_profile_id, share2dm_brand_id, expires_at, used')
    .eq('token', token)
    .single();

  if (tokenErr || !tokenRow) {
    console.error('[Clozet CB] token not found:', tokenErr?.message);
    return Response.redirect(`${dashboardUrl}?clozet_error=invalid_token`, 302);
  }

  if (tokenRow.used) {
    return Response.redirect(`${dashboardUrl}?clozet_error=token_used`, 302);
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return Response.redirect(`${dashboardUrl}?clozet_error=token_expired`, 302);
  }

  // brand_id가 토큰에 저장된 것과 일치하는지 확인 (있을 경우)
  if (tokenRow.share2dm_brand_id && tokenRow.share2dm_brand_id !== brandId) {
    return Response.redirect(`${dashboardUrl}?clozet_error=brand_mismatch`, 302);
  }

  // 2. seller_profile 정보 조회 (store_name 가져오기)
  const { data: sellerProfile } = await supabase
    .from('seller_profile')
    .select('id, store_name')
    .eq('id', tokenRow.seller_profile_id)
    .single();

  if (!sellerProfile) {
    return Response.redirect(`${dashboardUrl}?clozet_error=seller_not_found`, 302);
  }

  // 3. share2dm_brands 업데이트
  const { error: updateErr } = await supabase
    .from('share2dm_brands')
    .update({
      clozet_seller_id: sellerProfile.id,
      clozet_store_name: sellerProfile.store_name,
      clozet_connected_at: new Date().toISOString(),
    })
    .eq('id', brandId);

  if (updateErr) {
    console.error('[Clozet CB] brands update error:', updateErr.message);
    return Response.redirect(`${dashboardUrl}?clozet_error=update_failed`, 302);
  }

  // 4. 토큰 사용 처리
  await supabase
    .from('share2dm_connect_tokens')
    .update({ used: true })
    .eq('token', token);

  console.log('[Clozet CB] connected: brand_id:', brandId, 'seller:', sellerProfile.store_name);

  // 5. 대시보드로 성공 리다이렉트 (state 포함해서 프론트에서 nonce 검증 가능)
  return Response.redirect(
    `${dashboardUrl}?clozet_connected=true&clozet_store=${encodeURIComponent(sellerProfile.store_name)}&state=${encodeURIComponent(state)}`,
    302
  );
}

/**
 * GET /clozet/contents?brand_id={share2dm_brand_id}&ig_code={shortcode}
 *
 * 캠페인 생성 시 릴스 shortcode로 Clozet 콘텐츠 조회.
 * Clozet과 share2dm이 같은 Supabase DB를 공유하므로 직접 contents 테이블 조회 가능.
 */
export async function handleClozetContentLookup(url: URL, env: Env): Promise<Response> {
  const brandId = url.searchParams.get('brand_id');
  const igCode = url.searchParams.get('ig_code'); // Instagram shortcode

  if (!brandId || !igCode) {
    return new Response(JSON.stringify({ error: 'brand_id and ig_code required' }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  // 브랜드가 Clozet에 연결되어 있는지 확인
  const { data: brand } = await supabase
    .from('share2dm_brands')
    .select('clozet_seller_id, clozet_store_name')
    .eq('id', brandId)
    .single();

  if (!brand?.clozet_seller_id) {
    return new Response(JSON.stringify({ error: 'clozet_not_connected' }), {
      status: 403,
      headers: CORS_HEADERS,
    });
  }

  // ig_contents_code로 Clozet contents 테이블 직접 조회
  const { data: content, error } = await supabase
    .from('contents')
    .select('id, short_code, ig_contents_code, store_name')
    .eq('ig_contents_code', igCode)
    .eq('store_name', brand.clozet_store_name) // 해당 브랜드 콘텐츠만
    .single();

  if (error || !content) {
    return new Response(JSON.stringify({ found: false }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  }

  return new Response(
    JSON.stringify({
      found: true,
      content_id: content.id,
      short_code: content.short_code,
      clozet_url: `https://app.clozet.my/reel/${content.short_code}`,
    }),
    { status: 200, headers: CORS_HEADERS }
  );
}
