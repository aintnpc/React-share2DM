import { createClient } from '@supabase/supabase-js';
import { Env } from './types';

export async function handleTracking(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const parts = url.pathname.split('/'); // /t/{campaign_id}/{sender_ig_id}

  if (parts.length < 4) {
    return new Response('Not found', { status: 404 });
  }

  const campaignId = parts[2];
  const senderIgId = parts[3];

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  // Update click timestamp
  await supabase
    .from('share2dm_dm_logs')
    .update({ link_clicked_at: new Date().toISOString() })
    .eq('campaign_id', campaignId)
    .eq('sender_ig_id', senderIgId);

  // Get campaign product URL
  const { data: campaign } = await supabase
    .from('share2dm_campaigns')
    .select('product_url')
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    return new Response('Not found', { status: 404 });
  }

  // Redirect to actual product URL (ensure absolute URL)
  const productUrl = campaign.product_url.startsWith('http')
    ? campaign.product_url
    : `https://${campaign.product_url}`;
  return Response.redirect(productUrl, 302);
}
