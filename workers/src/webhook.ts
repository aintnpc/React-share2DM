import { Env, WebhookBody, MessagingEvent, CommentChangeValue } from './types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PLAN_CONFIG, PlanName } from './plan-config';
import { sendDmLimitWarning, sendDmLimitExceeded } from './email';

/**
 * 플랜 DM 한도 체크 + 80% 경고 / 초과 이메일 발송 (월 1회)
 * @returns true = 발송 가능, false = 한도 초과로 차단
 */
async function checkDmLimit(
  supabase: SupabaseClient,
  env: Env,
  brand: any,
): Promise<boolean> {
  const planLimits = PLAN_CONFIG[brand.plan as PlanName];
  if (!planLimits || planLimits.dmPerMonth === -1) return true;

  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('share2dm_dm_logs')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', brand.id)
    .gte('dm_sent_at', startOfMonth.toISOString());

  const usedCount = count ?? 0;
  const limit = planLimits.dmPerMonth;
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  if (usedCount >= limit) {
    // 초과 이메일 (월 1회)
    if (env.RESEND_API_KEY && brand.notification_email && brand.dm_exceeded_sent_month !== currentMonth) {
      try {
        await sendDmLimitExceeded(env.RESEND_API_KEY, brand.notification_email, brand.brand_name, brand.plan, limit);
        await supabase.from('share2dm_brands').update({ dm_exceeded_sent_month: currentMonth }).eq('id', brand.id);
      } catch (e: any) {
        console.error('[DM Limit] Failed to send exceeded email:', e.message);
      }
    }
    console.log(`[DM Limit] Blocked brand ${brand.id}: ${usedCount}/${limit} (plan: ${brand.plan})`);
    return false;
  }

  // 80% 경고 이메일 (월 1회)
  if (
    env.RESEND_API_KEY &&
    brand.notification_email &&
    usedCount >= limit * 0.8 &&
    brand.dm_warning_sent_month !== currentMonth
  ) {
    try {
      await sendDmLimitWarning(env.RESEND_API_KEY, brand.notification_email, brand.brand_name, brand.plan, usedCount, limit);
      await supabase.from('share2dm_brands').update({ dm_warning_sent_month: currentMonth }).eq('id', brand.id);
    } catch (e: any) {
      console.error('[DM Limit] Failed to send warning email:', e.message);
    }
  }

  return true;
}

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
  env: Env,
  ctx?: ExecutionContext
): Promise<Response> {
  let body: string;
  try {
    body = await request.text();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  console.log('[Webhook] Received event:', body);

  // Log signature status but don't block on it (temporarily disabled)
  const signature = request.headers.get('x-hub-signature-256');
  if (signature && env.META_APP_SECRET) {
    const expected = await computeSignature(body, env.META_APP_SECRET);
    const isValid = signature === expected;
    console.log('[Webhook] Signature valid:', isValid);
  }

  let payload: WebhookBody;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  console.log('[Webhook] object:', payload.object, 'entries:', payload.entry?.length);

  if (payload.object !== 'instagram' && payload.object !== 'page') {
    return new Response('OK', { status: 200 });
  }

  // Process in background, return 200 immediately
  const processing = (async () => {
    try {
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
      for (const entry of payload.entry) {
        const brandIgId = entry.id;

        // Format 1: entry.messaging[] (Messenger Platform)
        if (entry.messaging?.length) {
          console.log('[Webhook] messaging format, events:', entry.messaging.length);
          for (const event of entry.messaging) {
            await processMessagingEvent(event, brandIgId, supabase, env);
          }
        }

        // Format 2: entry.changes[].value (Instagram Platform)
        if (entry.changes?.length) {
          console.log('[Webhook] changes format, changes:', entry.changes.length);
          for (const change of entry.changes) {
            if (change.field === 'messages' && change.value) {
              await processMessagingEvent(change.value as MessagingEvent, brandIgId, supabase, env);
            } else if (change.field === 'comments' && change.value) {
              await handleCommentEvent(change.value as CommentChangeValue, brandIgId, supabase, env);
            }
          }
        }
      }
    } catch (err) {
      console.error('[Webhook] Processing error:', err);
    }
  })();

  if (ctx) {
    ctx.waitUntil(processing);
  } else {
    await processing;
  }

  return new Response('OK', { status: 200 });
}

async function processMessagingEvent(
  event: MessagingEvent,
  brandIgId: string,
  supabase: SupabaseClient,
  env: Env
): Promise<void> {
  console.log('[DM] event:', JSON.stringify(event));

  if (event.message?.is_echo) {
    console.log('[DM] Echo message, skip');
    return;
  }

  if (!event.message?.attachments) {
    console.log('[DM] No attachments, skip');
    return;
  }

  console.log('[DM] attachments:', JSON.stringify(event.message.attachments));

  // Find reel attachment
  const reelAttachment = event.message.attachments.find(
    (a) => a.type === 'ig_reel'
  );

  if (!reelAttachment) {
    console.log('[DM] No ig_reel attachment, skip');
    return;
  }

  const reelVideoId = reelAttachment.payload.reel_video_id;
  const senderId = event.sender.id;
  const mid = event.message.mid;

  console.log('[DM] reelVideoId:', reelVideoId, 'senderId:', senderId, 'mid:', mid);

  if (!reelVideoId) {
    console.log('[DM] No reelVideoId, skip');
    return;
  }

  // Deduplicate: skip if this exact message (mid) was already processed
  if (mid) {
    const { data: existing } = await supabase
      .from('share2dm_dm_queue')
      .select('id, status')
      .eq('mid', mid)
      .maybeSingle();

    if (existing) {
      console.log('[DM] Duplicate mid, skip:', mid, 'status:', existing.status);
      return;
    }
  }

  // Get brand info
  const { data: brand } = await supabase
    .from('share2dm_brands')
    .select('*')
    .eq('ig_account_id', brandIgId)
    .single();

  console.log('[DM] brand lookup brandIgId:', brandIgId, '→', brand?.id ?? 'NOT FOUND');

  if (!brand) return;

  // Match campaign
  const { data: campaign } = await supabase
    .from('share2dm_campaigns')
    .select('*')
    .eq('ig_contents_id', reelVideoId)
    .eq('brand_id', brand.id)
    .eq('campaign_type', 'reel_share')
    .eq('is_active', true)
    .is('deleted_at', null)
    .single();

  console.log('[DM] campaign lookup reelVideoId:', reelVideoId, '→', campaign?.id ?? 'NOT FOUND');

  if (!campaign) return;

  // DM limit check
  if (!(await checkDmLimit(supabase, env, brand))) return;

  // Build tracking URL and message
  const trackingUrl = `https://go.share2dm.xyz/t/${campaign.id}/${senderId}`;
  const message = `${campaign.response_message}\n\n${trackingUrl}`;

  // Enqueue DM (will be processed by cron with rate limiting)
  // Use upsert to handle re-shares: if a previous queue entry exists (e.g. status='sent' or 'failed'),
  // reset it to 'pending' so the cron picks it up again
  const { error: queueError } = await supabase.from('share2dm_dm_queue').upsert({
    id: crypto.randomUUID(),
    brand_id: brand.id,
    campaign_id: campaign.id,
    sender_ig_id: senderId,
    ig_contents_id: reelVideoId,
    mid: mid ?? null,
    message,
    access_token: brand.ig_access_token,
    status: 'pending',
    retry_count: 0,
    error_message: null,
    sent_at: null,
  }, { onConflict: 'campaign_id,sender_ig_id' });

  if (queueError) {
    console.error(`[DM] queue insert failed:`, queueError);
    return;
  }

  // Atomically claim the queue item: only the first concurrent request succeeds.
  // Instagram often sends the same webhook event 2–3 times within milliseconds,
  // so the mid check above is racy. This UPDATE WHERE status='pending' is atomic
  // in PostgreSQL — only one concurrent transaction will flip the row to 'sending'.
  const { data: claimed } = await supabase
    .from('share2dm_dm_queue')
    .update({ status: 'sending' })
    .eq('campaign_id', campaign.id)
    .eq('sender_ig_id', senderId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (!claimed) {
    console.log(`[DM] Already claimed by another request (campaign: ${campaign.id}, sender: ${senderId}), skip`);
    return;
  }

  console.log(`[DM] Claimed queue item, attempting immediate send to ${senderId}...`);

  // Try to send immediately instead of waiting for cron
  try {
    const response = await fetch(
      'https://graph.facebook.com/v21.0/me/messages',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: senderId },
          message: { text: message },
          access_token: brand.ig_access_token,
        }),
      }
    );

    if (response.ok) {
      // Success: mark queue as sent + log
      await supabase
        .from('share2dm_dm_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', claimed.id);

      await supabase.from('share2dm_dm_logs').upsert({
        id: crypto.randomUUID(),
        campaign_id: campaign.id,
        brand_id: brand.id,
        sender_ig_id: senderId,
        ig_contents_id: reelVideoId,
      }, { onConflict: 'campaign_id,sender_ig_id' });

      console.log(`[DM] Sent immediately to ${senderId} (campaign: ${campaign.id})`);
    } else {
      // Failed — reset to pending so cron can retry
      await supabase
        .from('share2dm_dm_queue')
        .update({ status: 'pending' })
        .eq('id', claimed.id);
      console.log(`[DM] Immediate send failed (${response.status}), will retry via cron`);
    }
  } catch (err: any) {
    // Network error — reset to pending so cron can retry
    await supabase
      .from('share2dm_dm_queue')
      .update({ status: 'pending' })
      .eq('id', claimed.id);
    console.log(`[DM] Immediate send exception: ${err.message}, will retry via cron`);
  }
}

async function handleCommentEvent(
  value: CommentChangeValue,
  brandIgId: string,
  supabase: SupabaseClient,
  env: Env
): Promise<void> {
  console.log('[Comment] event:', JSON.stringify(value));

  // 대댓글은 처리 안 함
  if (value.parent_id) {
    console.log('[Comment] Skipping reply comment (parent_id exists)');
    return;
  }

  const commentId = value.id;
  const commentText = value.text ?? '';
  const commenterIgId = value.from?.id;
  const mediaId = value.media?.id;

  if (!commenterIgId || !mediaId || !commentId) {
    console.log('[Comment] Missing required fields, skip');
    return;
  }

  // 동일 comment_id 중복 처리 방지
  const { data: existingComment } = await supabase
    .from('share2dm_comment_logs')
    .select('id')
    .eq('comment_id', commentId)
    .maybeSingle();

  if (existingComment) {
    console.log('[Comment] Duplicate comment_id, skip:', commentId);
    return;
  }

  // Brand 조회
  const { data: brand } = await supabase
    .from('share2dm_brands')
    .select('*')
    .eq('ig_account_id', brandIgId)
    .single();

  console.log('[Comment] brand lookup brandIgId:', brandIgId, '→', brand?.id ?? 'NOT FOUND');
  if (!brand) return;

  // Comment Automation 캠페인 조회
  const { data: campaign } = await supabase
    .from('share2dm_campaigns')
    .select('*')
    .eq('ig_contents_id', mediaId)
    .eq('brand_id', brand.id)
    .eq('campaign_type', 'comment_automation')
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle();

  console.log('[Comment] campaign lookup mediaId:', mediaId, '→', campaign?.id ?? 'NOT FOUND');
  if (!campaign) return;

  // 키워드 매칭
  const keywords: string[] = campaign.trigger_keywords ?? [];
  const lowerText = commentText.toLowerCase();
  const hasKeyword = keywords.length === 0 || keywords.some((kw: string) => lowerText.includes(kw.toLowerCase()));

  if (!hasKeyword) {
    console.log('[Comment] No keyword match. text:', commentText, 'keywords:', keywords);
    return;
  }

  // 플랜 DM 한도 체크
  if (!(await checkDmLimit(supabase, env, brand))) return;

  // 1. 공개 댓글 답글 즉시 발송
  let commentRepliedAt: string | null = null;
  if (campaign.comment_reply_message) {
    try {
      const replyRes = await fetch(
        `https://graph.facebook.com/v21.0/${commentId}/replies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: campaign.comment_reply_message,
            access_token: brand.ig_access_token,
          }),
        }
      );
      if (replyRes.ok) {
        commentRepliedAt = new Date().toISOString();
        console.log('[Comment] Public reply posted for comment:', commentId);
      } else {
        const errBody = await replyRes.text();
        console.warn('[Comment] Public reply failed:', replyRes.status, errBody);
      }
    } catch (err: any) {
      console.warn('[Comment] Public reply exception:', err.message);
    }
  }

  // 2. comment_logs 기록 (DM 큐잉 전에 삽입해서 중복 방지)
  const { error: logError } = await supabase.from('share2dm_comment_logs').insert({
    campaign_id: campaign.id,
    brand_id: brand.id,
    commenter_ig_id: commenterIgId,
    comment_id: commentId,
    comment_text: commentText,
    comment_replied_at: commentRepliedAt,
  });

  if (logError) {
    // UNIQUE 충돌 = 같은 유저가 이미 이 캠페인에서 처리됨
    console.log('[Comment] comment_logs insert conflict (user already processed):', logError.code);
    return;
  }

  // 3. DM 큐에 추가 (기존 큐 시스템 재사용)
  const trackingUrl = `https://go.share2dm.xyz/t/${campaign.id}/${commenterIgId}`;
  const message = `${campaign.response_message}\n\n${trackingUrl}`;

  const { error: queueError } = await supabase.from('share2dm_dm_queue').upsert({
    id: crypto.randomUUID(),
    brand_id: brand.id,
    campaign_id: campaign.id,
    sender_ig_id: commenterIgId,
    ig_contents_id: mediaId,
    mid: null,
    message,
    access_token: brand.ig_access_token,
    status: 'pending',
    retry_count: 0,
    error_message: null,
    sent_at: null,
  }, { onConflict: 'campaign_id,sender_ig_id' });

  if (queueError) {
    console.error('[Comment] DM queue insert failed:', queueError);
    return;
  }

  // Atomically claim the queue item to prevent double-send
  const { data: claimed } = await supabase
    .from('share2dm_dm_queue')
    .update({ status: 'sending' })
    .eq('campaign_id', campaign.id)
    .eq('sender_ig_id', commenterIgId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (!claimed) {
    console.log(`[Comment] Already claimed by another request (campaign: ${campaign.id}, sender: ${commenterIgId}), skip`);
    return;
  }

  console.log(`[Comment] Claimed queue item, attempting immediate send to ${commenterIgId}...`);

  // 4. 즉시 DM 발송 시도 (실패 시 cron이 재시도)
  try {
    const dmRes = await fetch(
      'https://graph.facebook.com/v21.0/me/messages',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: commenterIgId },
          message: { text: message },
          access_token: brand.ig_access_token,
        }),
      }
    );

    if (dmRes.ok) {
      await supabase
        .from('share2dm_dm_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', claimed.id);

      await supabase.from('share2dm_dm_logs').upsert({
        id: crypto.randomUUID(),
        campaign_id: campaign.id,
        brand_id: brand.id,
        sender_ig_id: commenterIgId,
        ig_contents_id: mediaId,
      }, { onConflict: 'campaign_id,sender_ig_id' });

      console.log(`[Comment] DM sent immediately to ${commenterIgId} (campaign: ${campaign.id})`);
    } else {
      // Reset to pending so cron can retry
      await supabase
        .from('share2dm_dm_queue')
        .update({ status: 'pending' })
        .eq('id', claimed.id);
      console.log(`[Comment] Immediate DM failed (${dmRes.status}), will retry via cron`);
    }
  } catch (err: any) {
    // Reset to pending so cron can retry
    await supabase
      .from('share2dm_dm_queue')
      .update({ status: 'pending' })
      .eq('id', claimed.id);
    console.log(`[Comment] Immediate DM exception: ${err.message}, will retry via cron`);
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
