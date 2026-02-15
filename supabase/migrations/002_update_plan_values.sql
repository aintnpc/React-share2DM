-- Update plan names: starter → standard, agency → pro
UPDATE share2dm_brands SET plan = 'standard' WHERE plan = 'starter';
UPDATE share2dm_brands SET plan = 'pro' WHERE plan = 'agency';

-- Drop old CHECK constraint and add new one
ALTER TABLE share2dm_brands DROP CONSTRAINT IF EXISTS share2dm_brands_plan_check;
ALTER TABLE share2dm_brands ADD CONSTRAINT share2dm_brands_plan_check
  CHECK (plan IN ('free', 'standard', 'growth', 'pro'));

-- Composite index for monthly DM count query performance
CREATE INDEX IF NOT EXISTS idx_share2dm_dm_logs_brand_month
  ON share2dm_dm_logs(brand_id, dm_sent_at);
