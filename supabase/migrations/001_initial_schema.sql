-- share2dm initial schema

-- Brands (Instagram business accounts)
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  ig_account_id TEXT UNIQUE NOT NULL,
  ig_access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'growth', 'agency')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Campaigns (reel-to-DM mappings)
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  reel_url TEXT NOT NULL,
  reel_video_id TEXT NOT NULL,
  response_message TEXT NOT NULL,
  product_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- DM send logs
CREATE TABLE dm_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  sender_ig_id TEXT NOT NULL,
  reel_video_id TEXT,
  dm_sent_at TIMESTAMPTZ DEFAULT now(),
  link_clicked_at TIMESTAMPTZ,
  UNIQUE(campaign_id, sender_ig_id)
);

-- Indexes for fast webhook lookups
CREATE INDEX idx_brands_ig_account_id ON brands(ig_account_id);
CREATE INDEX idx_campaigns_reel_video_id ON campaigns(reel_video_id);
CREATE INDEX idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX idx_dm_logs_campaign_sender ON dm_logs(campaign_id, sender_ig_id);
CREATE INDEX idx_dm_logs_brand_id ON dm_logs(brand_id);

-- RLS policies
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_logs ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by Workers)
-- Dashboard users access through authenticated API
CREATE POLICY "Service role full access" ON brands FOR ALL USING (true);
CREATE POLICY "Service role full access" ON campaigns FOR ALL USING (true);
CREATE POLICY "Service role full access" ON dm_logs FOR ALL USING (true);
