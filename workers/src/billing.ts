import { Env } from './types';
import { PlanName, PLAN_CONFIG } from './plan-config';
import { createClient } from '@supabase/supabase-js';

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
 * POST /billing/issue-billing-key
 *
 * 토스페이먼츠 빌링키 발급 → DB에 저장 + plan 업데이트
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

  // 토스페이먼츠 빌링키 발급 API 호출
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

  // DB 업데이트
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  const { error: updateErr } = await supabase
    .from('share2dm_brands')
    .update({
      plan,
      toss_customer_key: customerKey,
      toss_billing_key: billingKey,
      billing_started_at: new Date().toISOString(),
      billing_card_last4: cardLast4,
    })
    .eq('id', brandId);

  if (updateErr) {
    console.error('[billing] DB update error:', updateErr.message);
    return new Response(
      JSON.stringify({ error: 'DB update failed' }),
      { status: 500, headers: CORS_HEADERS }
    );
  }

  return new Response(
    JSON.stringify({ success: true, plan, cardLast4 }),
    { status: 200, headers: CORS_HEADERS }
  );
}
