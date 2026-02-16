export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  META_APP_ID: string;
  META_APP_SECRET: string;
  META_VERIFY_TOKEN: string;
}

// Instagram Webhook payload types
export interface WebhookBody {
  object: string;
  entry: WebhookEntry[];
}

export interface WebhookChange {
  field: string;
  value: MessagingEvent;
}

export interface WebhookEntry {
  id: string; // Brand's IG account ID
  time: number;
  messaging: MessagingEvent[];
  changes: WebhookChange[];
}

export interface MessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: Attachment[];
    is_echo?: boolean;
  };
}

export interface Attachment {
  type: string; // 'ig_reel', 'image', 'video', etc.
  payload: {
    url?: string;
    reel_video_id?: string;
  };
}

// DB types
import { PlanName } from './plan-config';

export interface Brand {
  id: string;
  brand_name: string;
  ig_account_id: string;
  ig_access_token: string;
  token_expires_at: number | null;
  plan: PlanName;
  created_at: string;
}

export interface Campaign {
  id: string;
  brand_id: string;
  reel_url: string;
  ig_contents_id: string;
  short_code: string | null;
  response_message: string;
  product_url: string;
  is_active: boolean;
  created_at: string;
}

export interface DmLog {
  id: string;
  campaign_id: string;
  brand_id: string;
  sender_ig_id: string;
  ig_contents_id: string;
  dm_sent_at: string;
  link_clicked_at: string | null;
}
