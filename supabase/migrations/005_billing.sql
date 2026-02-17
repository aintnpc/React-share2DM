-- Add TossPayments billing columns to share2dm_brands
ALTER TABLE share2dm_brands
  ADD COLUMN toss_customer_key TEXT,
  ADD COLUMN toss_billing_key TEXT,
  ADD COLUMN billing_started_at TIMESTAMPTZ,
  ADD COLUMN billing_card_last4 TEXT;
