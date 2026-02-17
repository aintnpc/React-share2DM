import { Env } from './types';
import { PlanName, PLAN_CONFIG } from './plan-config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

interface IssueBillingKeyBody {
  authKey: string;
  customerKey: string;
  brandId: string;
  plan: PlanName;
}

/**
 * 토스페이먼츠 자동결제 승인 API 호출
 */
async function approveBilling(
  env: Env,
  billingKey: string,
  customerKey: string,
  orderId: string,
  orderName: string,
  amount: number,
): Promise<{ ok: boolean; data: any }> {
  const secretKeyBase64 = btoa(`${env.TOSS_SECRET_KEY}:`);

  const res = await fetch(`https://api.tosspayments.com/v1/billing/${billingKey}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${secretKeyBase64}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ customerKey, orderId, orderName, amount }),
  });

  const data: any = await res.json();
  return { ok: res.ok, data };
}

/**
 * 다음 결제일 계산 (가입일 기준 매월)
 */
function getNextBillingDate(fromDate: Date): string {
  const next = new Date(fromDate);
  next.setMonth(next.getMonth() + 1);
  return next.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * 결제 기록 저장
 */
async function savePaymentLog(
  supabase: SupabaseClient,
  brandId: string,
  paymentKey: string,
  orderId: string,
  plan: string,
  amount: number,
  tossResponse: any,
) {
  await supabase.from('share2dm_payments').insert({
    brand_id: brandId,
    payment_key: paymentKey,
    order_id: orderId,
    plan,
    amount,
    status: 'DONE',
    toss_response: tossResponse,
  });
}

/**
 * POST /billing/issue-billing-key
 *
 * 토스페이먼츠 빌링키 발급 → 첫 결제 승인 → DB에 저장 + plan 업데이트
 */
export async function handleIssueBillingKey(request: Request, env: Env): Promise<Response> {
  const body: IssueBillingKeyBody = await request.json();
  const { authKey, customerKey, brandId, plan } = body;

  if (!authKey || !customerKey || !brandId || !plan) {
    return new Response(
      JSON.stringify({ error: 'authKey, customerKey, brandId, plan are required' }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (!PLAN_CONFIG[plan] || plan === 'free') {
    return new Response(
      JSON.stringify({ error: 'invalid plan' }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // 1. 빌링키 발급
  const secretKeyBase64 = btoa(`${env.TOSS_SECRET_KEY}:`);

  const tossRes = await fetch('https://api.tosspayments.com/v1/billing/authorizations/issue', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${secretKeyBase64}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ authKey, customerKey }),
  });

  const tossData: any = await tossRes.json();

  if (!tossRes.ok) {
    console.error('[billing] TossPayments error:', JSON.stringify(tossData));
    return new Response(
      JSON.stringify({ error: tossData.message ?? 'billing key issue failed', code: tossData.code }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const billingKey: string = tossData.billingKey;
  const cardLast4 = tossData.card?.number?.slice(-4) ?? null;

  console.log('[billing] billingKey issued for brand:', brandId, 'plan:', plan);

  // 2. 첫 결제 승인 (즉시 과금)
  const amount = PLAN_CONFIG[plan].pricePerMonth;
  const now = new Date();
  const orderId = `share2dm_${brandId}_${now.getTime()}`;
  const orderName = `share2dm ${plan} 구독`;

  const paymentResult = await approveBilling(env, billingKey, customerKey, orderId, orderName, amount);

  if (!paymentResult.ok) {
    console.error('[billing] First payment failed:', JSON.stringify(paymentResult.data));
    return new Response(
      JSON.stringify({ error: paymentResult.data.message ?? 'first payment failed', code: paymentResult.data.code }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  console.log('[billing] First payment approved:', paymentResult.data.paymentKey);

  // 3. DB 업데이트
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  const nextBillingDate = getNextBillingDate(now);

  const { error: updateErr } = await supabase
    .from('share2dm_brands')
    .update({
      plan,
      toss_customer_key: customerKey,
      toss_billing_key: billingKey,
      billing_started_at: now.toISOString(),
      billing_card_last4: cardLast4,
      next_billing_date: nextBillingDate,
      last_payment_key: paymentResult.data.paymentKey,
    })
    .eq('id', brandId);

  if (updateErr) {
    console.error('[billing] DB update error:', updateErr.message);
    return new Response(
      JSON.stringify({ error: 'DB update failed' }),
      { status: 500, headers: CORS_HEADERS }
    );
  }

  // 4. 결제 기록 저장
  await savePaymentLog(supabase, brandId, paymentResult.data.paymentKey, orderId, plan, amount, paymentResult.data);

  return new Response(
    JSON.stringify({ success: true, plan, cardLast4, paymentKey: paymentResult.data.paymentKey }),
    { status: 200, headers: CORS_HEADERS }
  );
}

/**
 * Cron Trigger 핸들러 — 매일 실행, 오늘이 결제일인 brand를 찾아 자동결제 승인
 */
export async function handleBillingCron(env: Env): Promise<void> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // 오늘이 결제일인 유료 브랜드 조회
  const { data: brands, error } = await supabase
    .from('share2dm_brands')
    .select('id, plan, toss_billing_key, toss_customer_key, next_billing_date')
    .eq('next_billing_date', today)
    .not('toss_billing_key', 'is', null)
    .neq('plan', 'free');

  if (error) {
    console.error('[cron] DB query error:', error.message);
    return;
  }

  if (!brands?.length) {
    console.log('[cron] No billing due today:', today);
    return;
  }

  console.log(`[cron] ${brands.length} brand(s) due for billing on ${today}`);

  for (const brand of brands) {
    const plan = brand.plan as PlanName;
    const amount = PLAN_CONFIG[plan]?.pricePerMonth;
    if (!amount) continue;

    const orderId = `share2dm_${brand.id}_${Date.now()}`;
    const orderName = `share2dm ${plan} 월 구독`;

    const result = await approveBilling(
      env,
      brand.toss_billing_key,
      brand.toss_customer_key,
      orderId,
      orderName,
      amount,
    );

    if (result.ok) {
      const nextBillingDate = getNextBillingDate(new Date());

      await supabase
        .from('share2dm_brands')
        .update({
          next_billing_date: nextBillingDate,
          last_payment_key: result.data.paymentKey,
        })
        .eq('id', brand.id);

      await savePaymentLog(supabase, brand.id, result.data.paymentKey, orderId, plan, amount, result.data);

      console.log(`[cron] Payment success: brand=${brand.id} paymentKey=${result.data.paymentKey}`);
    } else {
      console.error(`[cron] Payment failed: brand=${brand.id}`, JSON.stringify(result.data));
      // 결제 실패 시 plan을 free로 다운그레이드 (선택적)
      // await supabase.from('share2dm_brands').update({ plan: 'free' }).eq('id', brand.id);
    }
  }
}
