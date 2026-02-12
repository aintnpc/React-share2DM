import { Env, WebhookBody, MessagingEvent, Campaign, Brand } from './types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export async function handleWebhookVerification(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === env.META_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

export async function handleWebhookEvent(
  request: Request,
  env: Env
): Promise<Response> {
  // Verify signature
  const signature = request.headers.get('x-hub-signature-256');
  if (!signature) {
    return new Response('Missing signature', { status: 401 });
  }

  const body = await request.text();
  console.log('[Webhook] Received event:', body);

  const isValid = await verifySignature(body, signature, env.META_APP_SECRET);
  if (!isValid) {
    const expected = await computeSignature(body, env.META_APP_SECRET);
    console.log('[Webhook] Invalid signature. received:', signature, 'expected:', expected, 'secret_length:', env.META_APP_SECRET?.length, 'secret_prefix:', env.META_APP_SECRET?.substring(0, 4));
    return new Response('Invalid signature', { status: 401 });
  }

  const payload: WebhookBody = JSON.parse(body);
  console.log('[Webhook] object:', payload.object);

  if (payload.object !== 'instagram') {
    return new Response('OK', { status: 200 });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  for (const entry of payload.entry) {
    const brandIgId = entry.id;

    for (const event of entry.messaging || []) {
      await processMessagingEvent(event, brandIgId, supabase);
    }
  }

  return new Response('OK', { status: 200 });
}

async function processMessagingEvent(
  event: MessagingEvent,
  brandIgId: string,
  supabase: SupabaseClient
): Promise<void> {
  if (!event.message?.attachments) return;

  // Find reel attachment
  const reelAttachment = event.message.attachments.find(
    (a) => a.type === 'ig_reel'
  );

  if (!reelAttachment) return;

  const reelVideoId = reelAttachment.payload.reel_video_id;
  const senderId = event.sender.id;

  if (!reelVideoId) return;

  // Get brand info
  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('ig_account_id', brandIgId)
    .single();

  if (!brand) return;

  // Match campaign
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('reel_video_id', reelVideoId)
    .eq('brand_id', brand.id)
    .eq('is_active', true)
    .single();

  if (!campaign) return;

  // Check duplicate
  const { data: existing } = await supabase
    .from('dm_logs')
    .select('id')
    .eq('campaign_id', campaign.id)
    .eq('sender_ig_id', senderId)
    .single();

  if (existing) return;

  // Build tracking URL
  const trackingUrl = `https://share2dm.xyz/t/${campaign.id}/${senderId}`;

  // Build message
  const message = `${campaign.response_message}\n\n${trackingUrl}`;

  // Send DM
  await sendInstagramDM(senderId, message, brand.ig_access_token);

  // Log
  await supabase.from('dm_logs').insert({
    id: crypto.randomUUID(),
    campaign_id: campaign.id,
    brand_id: brand.id,
    sender_ig_id: senderId,
    reel_video_id: reelVideoId,
  });
}

async function sendInstagramDM(
  recipientId: string,
  message: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(
    `https://graph.instagram.com/v21.0/me/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(`DM send failed: ${error}`);
  }
}

async function computeSignature(body: string, appSecret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const hashArray = Array.from(new Uint8Array(sig));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `sha256=${hashHex}`;
}

async function verifySignature(
  body: string,
  signature: string,
  appSecret: string
): Promise<boolean> {
  const expectedSignature = await computeSignature(body, appSecret);
  return signature === expectedSignature;
}
