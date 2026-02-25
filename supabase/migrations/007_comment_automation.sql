-- Migration 007: Comment Automation
-- Adds campaign_type, trigger_keywords, comment_reply_message to share2dm_campaigns
-- Creates share2dm_comment_logs table

-- 1. Extend share2dm_campaigns
ALTER TABLE share2dm_campaigns
  ADD COLUMN campaign_type TEXT NOT NULL DEFAULT 'reel_share'
    CHECK (campaign_type IN ('reel_share', 'comment_automation')),
  ADD COLUMN trigger_keywords TEXT[] DEFAULT '{}',
  ADD COLUMN comment_reply_message TEXT;

-- 2. Create comment logs table
CREATE TABLE share2dm_comment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES share2dm_campaigns(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES share2dm_brands(id),
  commenter_ig_id TEXT NOT NULL,
  comment_id TEXT NOT NULL,
  comment_text TEXT,
  comment_replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id),
  UNIQUE(campaign_id, commenter_ig_id)
);

CREATE INDEX idx_comment_logs_campaign ON share2dm_comment_logs(campaign_id);
CREATE INDEX idx_comment_logs_brand ON share2dm_comment_logs(brand_id);
