export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  META_APP_ID: string;
  META_APP_SECRET: string;
  META_VERIFY_TOKEN: string;
  TOSS_SECRET_KEY: string;
  RESEND_API_KEY: string;
  CAFE24_CLIENT_ID: string;
  CAFE24_CLIENT_SECRET: string;
}

// Instagram Webhook payload types
export interface WebhookBody {
  object: string;
  entry: WebhookEntry[];
}

export interface WebhookChange {
  field: string;
  value: MessagingEvent | CommentChangeValue;
}

export interface CommentChangeValue {
  id: string; // comment_id
  text: string;
  from: { id: string; username?: string };
  media: { id: string };
  parent_id?: string; // 대댓글이면 존재
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
  ig_username: string | null;
  token_expires_at: number | null;
  plan: PlanName;
  created_at: string;
  clozet_seller_id: string | null;
  clozet_store_name: string | null;
  clozet_connected_at: string | null;
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
  campaign_type: 'reel_share' | 'comment_automation';
  trigger_keywords: string[];
  comment_reply_message: string | null;
}

export interface CommentLog {
  id: string;
  campaign_id: string;
  brand_id: string;
  commenter_ig_id: string;
  comment_id: string;
  comment_text: string | null;
  comment_replied_at: string | null;
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

export interface DmQueue {
  id: string;
  brand_id: string;
  campaign_id: string;
  sender_ig_id: string;
  ig_contents_id: string;
  mid: string | null;
  message: string;
  access_token: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  retry_count: number;
  error_message: string | null;
  created_at: string;
  sent_at: string | null;
}
