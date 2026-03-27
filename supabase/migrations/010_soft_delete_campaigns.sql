-- Soft delete campaigns: add deleted_at column
ALTER TABLE share2dm_campaigns
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for fast filtering of active campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_deleted_at
  ON share2dm_campaigns (deleted_at)
  WHERE deleted_at IS NULL;
