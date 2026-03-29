import { Env } from './types';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /cafe24/webhook
 *
 * Cafe24에서 상품/주문/재고 변경 시 호출.
 * Cafe24 Developer Center에서 Webhook URL로 등록:
 *   https://go.share2dm.xyz/cafe24/webhook
 *
 * 지원 이벤트:
 *   - product_updated     : 상품 정보 변경 → Clozet products 업데이트
 *   - product_deleted     : 상품 삭제 → Clozet products 비활성화
 *   - order_placed        : 주문 발생 → 전환 추적 (미래)
 *   - stock_update        : 재고 변경 → Clozet products 재고 업데이트
 */
export async function handleCafe24Webhook(request: Request, env: Env): Promise<Response> {
  const mallId = request.headers.get('X-Cafe24-Mall-Id') || '';
  const eventType = request.headers.get('X-Cafe24-Event') || '';
  const hmac = request.headers.get('X-Cafe24-Signature') || '';

  // HMAC 검증 (Cafe24는 HMAC-SHA256으로 서명)
  if (env.CAFE24_CLIENT_SECRET && hmac) {
    const body = await request.clone().text();
    const valid = await verifyCafe24Signature(body, hmac, env.CAFE24_CLIENT_SECRET);
    if (!valid) {
      console.warn(`[Cafe24 Webhook] HMAC 검증 실패 - mall_id: ${mallId}, event: ${eventType}`);
      return new Response('Unauthorized', { status: 401 });
    }
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  console.log(`[Cafe24 Webhook] mall_id=${mallId}, event=${eventType}`);

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  // mall_id로 brand + clozet_seller_id 조회
  const { data: brand } = await supabase
    .from('share2dm_brands')
    .select('id, clozet_seller_id')
    .eq('cafe24_mall_id', mallId)
    .maybeSingle();

  if (!brand?.clozet_seller_id) {
    // 등록되지 않은 mall이면 무시 (200 반환 — Cafe24가 재시도 않도록)
    return new Response('OK', { status: 200 });
  }

  switch (eventType) {
    case 'product_updated':
    case 'product_created':
      await handleProductUpsert(payload, brand.id, brand.clozet_seller_id, mallId, supabase);
      break;

    case 'product_deleted':
      await handleProductDelete(payload, brand.id, brand.clozet_seller_id, supabase);
      break;

    case 'stock_update':
    case 'product_stock_updated':
      await handleStockUpdate(payload, brand.id, brand.clozet_seller_id, supabase);
      break;

    case 'order_placed':
    case 'order_paid':
      await handleOrderEvent(payload, brand.id, mallId, supabase);
      break;

    default:
      console.log(`[Cafe24 Webhook] 미처리 이벤트: ${eventType}`);
  }

  return new Response('OK', { status: 200 });
}

// 상품 생성/수정
async function handleProductUpsert(
  payload: any,
  brandId: string,
  sellerProfileId: string,
  mallId: string,
  supabase: ReturnType<typeof createClient>
) {
  const p = payload.resource?.product || payload.product || payload;
  if (!p?.product_no) return;

  const imageUrl = p.detail_image || p.list_image || null;
  const productUrl = `https://${mallId}.cafe24.com/product/detail.html?product_no=${p.product_no}`;
  const isActive = p.selling === 'T';

  // 기존 매핑 확인
  const { data: mapping } = await supabase
    .from('share2dm_cafe24_products')
    .select('clozet_product_id')
    .eq('brand_id', brandId)
    .eq('cafe24_product_no', p.product_no)
    .maybeSingle();

  if (mapping?.clozet_product_id) {
    // 기존 Clozet 상품 업데이트
    await supabase
      .from('products')
      .update({
        product_name: p.product_name,
        price: parseFloat(p.price ?? '0'),
        main_images: imageUrl ? [imageUrl] : [],
        description: p.description || '',
        status: isActive ? 'active' : 'inactive',
      })
      .eq('product_id', mapping.clozet_product_id);

    // 매핑 캐시 업데이트
    await supabase
      .from('share2dm_cafe24_products')
      .update({
        product_name: p.product_name,
        price: parseFloat(p.price ?? '0'),
        image_url: imageUrl,
        is_active: isActive,
        synced_at: new Date().toISOString(),
      })
      .eq('brand_id', brandId)
      .eq('cafe24_product_no', p.product_no);

    console.log(`[Cafe24 Webhook] 상품 업데이트: product_no=${p.product_no}, clozet_id=${mapping.clozet_product_id}`);
  } else {
    // 신규 Clozet 상품 생성
    const { data: sellerProfile } = await supabase
      .from('seller_profile')
      .select('store_name')
      .eq('id', sellerProfileId)
      .single();

    const { data: newProduct } = await supabase
      .from('products')
      .insert({
        seller_id: sellerProfileId,
        product_name: p.product_name,
        price: parseFloat(p.price ?? '0'),
        main_images: imageUrl ? [imageUrl] : [],
        description: p.description || '',
        keywords: [],
        status: isActive ? 'active' : 'inactive',
        store_name: sellerProfile?.store_name || mallId,
      })
      .select('product_id')
      .single();

    if (newProduct?.product_id) {
      await supabase
        .from('share2dm_cafe24_products')
        .upsert({
          brand_id: brandId,
          cafe24_product_no: p.product_no,
          product_name: p.product_name,
          price: parseFloat(p.price ?? '0'),
          image_url: imageUrl,
          product_url: productUrl,
          is_active: isActive,
          synced_at: new Date().toISOString(),
          clozet_product_id: newProduct.product_id,
        }, { onConflict: 'brand_id,cafe24_product_no' });

      console.log(`[Cafe24 Webhook] 신규 상품 생성: product_no=${p.product_no}, clozet_id=${newProduct.product_id}`);
    }
  }
}

// 상품 삭제 → Clozet에서 비활성화
async function handleProductDelete(
  payload: any,
  brandId: string,
  sellerProfileId: string,
  supabase: ReturnType<typeof createClient>
) {
  const productNo = payload.resource?.product_no || payload.product_no;
  if (!productNo) return;

  const { data: mapping } = await supabase
    .from('share2dm_cafe24_products')
    .select('clozet_product_id')
    .eq('brand_id', brandId)
    .eq('cafe24_product_no', productNo)
    .maybeSingle();

  if (mapping?.clozet_product_id) {
    await supabase
      .from('products')
      .update({ status: 'inactive' })
      .eq('product_id', mapping.clozet_product_id);

    await supabase
      .from('share2dm_cafe24_products')
      .update({ is_active: false, synced_at: new Date().toISOString() })
      .eq('brand_id', brandId)
      .eq('cafe24_product_no', productNo);

    console.log(`[Cafe24 Webhook] 상품 비활성화: product_no=${productNo}`);
  }
}

// 재고 변경
async function handleStockUpdate(
  payload: any,
  brandId: string,
  sellerProfileId: string,
  supabase: ReturnType<typeof createClient>
) {
  const productNo = payload.resource?.product_no || payload.product_no;
  const stockQuantity = payload.resource?.quantity ?? payload.quantity ?? null;
  if (!productNo) return;

  // 재고가 0이 되면 품절 처리 (선택적)
  if (stockQuantity !== null && stockQuantity <= 0) {
    const { data: mapping } = await supabase
      .from('share2dm_cafe24_products')
      .select('clozet_product_id')
      .eq('brand_id', brandId)
      .eq('cafe24_product_no', productNo)
      .maybeSingle();

    if (mapping?.clozet_product_id) {
      await supabase
        .from('products')
        .update({ status: 'sold_out' })
        .eq('product_id', mapping.clozet_product_id);
    }
  }

  console.log(`[Cafe24 Webhook] 재고 업데이트: product_no=${productNo}, qty=${stockQuantity}`);
}

// 주문 발생 → DM 전환 추적 (추후 확장)
async function handleOrderEvent(
  payload: any,
  brandId: string,
  mallId: string,
  supabase: ReturnType<typeof createClient>
) {
  const order = payload.resource?.order || payload.order || payload;
  console.log(`[Cafe24 Webhook] 주문 수신: mall_id=${mallId}, order_id=${order?.order_id}`);
  // TODO: DM 클릭 → 주문 전환율 추적 구현
}

// Cafe24 Webhook HMAC-SHA256 서명 검증
async function verifyCafe24Signature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const signatureBytes = hexToBytes(signature);
    return await crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(body));
  } catch {
    return false;
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}
