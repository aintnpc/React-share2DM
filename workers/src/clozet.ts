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
async function syncIgContentsCodes(
  sellerProfileId: string,
  igAccountId: string,
  igAccessToken: string,
  supabase: any
): Promise<void> {
  // ig_contents_code가 없는 콘텐츠만 조회
  const { data: contents } = await supabase
    .from('contents')
    .select('id, short_code')
    .eq('creator_id', sellerProfileId)
    .is('ig_contents_code', null)
    .not('short_code', 'is', null) as { data: { id: string; short_code: string }[] | null };

  if (!contents?.length) return;

  // IG Graph API에서 미디어 목록 페이징 조회 → shortcode 매핑 테이블 구성
  const shortcodeMap: Record<string, string> = {}; // shortcode → media_id
  let nextUrl: string | null =
    `https://graph.facebook.com/v21.0/${igAccountId}/media?fields=id,shortcode&limit=50&access_token=${igAccessToken}`;

  while (nextUrl && Object.keys(shortcodeMap).length < 500) {
    const res = await fetch(nextUrl);
    const data: any = await res.json();
    if (data.error || !data.data) break;
    for (const m of data.data) {
      if (m.shortcode) shortcodeMap[m.shortcode] = m.id;
    }
    nextUrl = data.paging?.next || null;
  }

  // 매칭된 것만 업데이트
  for (const content of contents) {
    const mediaId = shortcodeMap[content.short_code];
    if (!mediaId) continue;
    await supabase
      .from('contents')
      .update({ ig_contents_code: mediaId })
      .eq('id', content.id);
  }

  console.log(
    `[Clozet Sync] seller ${sellerProfileId}: ${contents.length} contents checked, ${Object.keys(shortcodeMap).length} IG media fetched`
  );
}

export async function handleClozetCallback(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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

  // 5. IG media ID 백그라운드 동기화
  const { data: brand } = await supabase
    .from('share2dm_brands')
    .select('ig_account_id, ig_access_token')
    .eq('id', brandId)
    .single();

  if (brand?.ig_account_id && brand?.ig_access_token) {
    ctx.waitUntil(
      syncIgContentsCodes(sellerProfile.id, brand.ig_account_id, brand.ig_access_token, supabase)
    );
  }

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
  const mediaId = url.searchParams.get('media_id'); // Instagram media ID (optional)

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

  // short_code로 Clozet contents 테이블 직접 조회 (short_code는 UNIQUE)
  const { data: content, error } = await supabase
    .from('contents')
    .select('id, short_code, ig_contents_code, store_name')
    .eq('short_code', igCode)
    .single();

  if (error || !content) {
    return new Response(JSON.stringify({ found: false }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  }

  // ig_contents_code가 없고 media_id가 넘어왔으면 채워줌
  if (!content.ig_contents_code && mediaId) {
    await supabase
      .from('contents')
      .update({ ig_contents_code: mediaId })
      .eq('id', content.id);
  }

  return new Response(
    JSON.stringify({
      found: true,
      content_id: content.id,
      short_code: content.short_code,
      clozet_url: `https://clozet.my/reel/${content.short_code}`,
    }),
    { status: 200, headers: CORS_HEADERS }
  );
}
