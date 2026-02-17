-- DM Queue table for rate-limited sending (Instagram 200 DM/hour per account)
CREATE TABLE public.share2dm_dm_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  campaign_id uuid NOT NULL,
  sender_ig_id text NOT NULL,
  ig_contents_id text NOT NULL,
  message text NOT NULL,
  access_token text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  retry_count integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  sent_at timestamp with time zone,
  CONSTRAINT share2dm_dm_queue_pkey PRIMARY KEY (id),
  CONSTRAINT share2dm_dm_queue_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.share2dm_brands(id),
  CONSTRAINT share2dm_dm_queue_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.share2dm_campaigns(id),
  CONSTRAINT share2dm_dm_queue_unique_campaign_sender UNIQUE (campaign_id, sender_ig_id)
);

-- Fast lookup for pending items to process
CREATE INDEX idx_dm_queue_pending ON share2dm_dm_queue(status, created_at) WHERE status = 'pending';

-- Per-brand queue status queries
CREATE INDEX idx_dm_queue_brand_status ON share2dm_dm_queue(brand_id, status);

-- Per-campaign queue status queries
CREATE INDEX idx_dm_queue_campaign_status ON share2dm_dm_queue(campaign_id, status);

-- RLS: service role full access (same pattern as other share2dm tables)
ALTER TABLE public.share2dm_dm_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on share2dm_dm_queue"
  ON public.share2dm_dm_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
