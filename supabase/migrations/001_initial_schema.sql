-- share2dm initial schema

-- Brands (Instagram business accounts)
CREATE TABLE share2dm_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  ig_account_id TEXT UNIQUE NOT NULL,
  ig_access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'standard', 'growth', 'pro')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Campaigns (reel-to-DM mappings)
CREATE TABLE share2dm_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES share2dm_brands(id) ON DELETE CASCADE,
  reel_url TEXT NOT NULL,
  reel_video_id TEXT NOT NULL,
  response_message TEXT NOT NULL,
  product_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- DM send logs
CREATE TABLE share2dm_dm_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES share2dm_campaigns(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES share2dm_brands(id) ON DELETE CASCADE,
  sender_ig_id TEXT NOT NULL,
  reel_video_id TEXT,
  dm_sent_at TIMESTAMPTZ DEFAULT now(),
  link_clicked_at TIMESTAMPTZ,
  UNIQUE(campaign_id, sender_ig_id)
);

-- Indexes for fast webhook lookups
CREATE INDEX idx_share2dm_brands_ig_account_id ON share2dm_brands(ig_account_id);
CREATE INDEX idx_share2dm_campaigns_reel_video_id ON share2dm_campaigns(reel_video_id);
CREATE INDEX idx_share2dm_campaigns_brand_id ON share2dm_campaigns(brand_id);
CREATE INDEX idx_share2dm_dm_logs_campaign_sender ON share2dm_dm_logs(campaign_id, sender_ig_id);
CREATE INDEX idx_share2dm_dm_logs_brand_id ON share2dm_dm_logs(brand_id);

-- RLS policies
ALTER TABLE share2dm_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE share2dm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE share2dm_dm_logs ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by Workers)
-- Dashboard users access through authenticated API
CREATE POLICY "Service role full access" ON share2dm_brands FOR ALL USING (true);
CREATE POLICY "Service role full access" ON share2dm_campaigns FOR ALL USING (true);
CREATE POLICY "Service role full access" ON share2dm_dm_logs FOR ALL USING (true);
