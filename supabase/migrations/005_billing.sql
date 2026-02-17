-- Add TossPayments billing columns to share2dm_brands
ALTER TABLE share2dm_brands
  ADD COLUMN toss_customer_key TEXT,
  ADD COLUMN toss_billing_key TEXT,
  ADD COLUMN billing_started_at TIMESTAMPTZ,
  ADD COLUMN billing_card_last4 TEXT,
  ADD COLUMN next_billing_date DATE,
  ADD COLUMN last_payment_key TEXT;

-- Payment history log
CREATE TABLE share2dm_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES share2dm_brands(id) ON DELETE CASCADE,
  payment_key TEXT NOT NULL,
  order_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'DONE',
  paid_at TIMESTAMPTZ DEFAULT now(),
  toss_response JSONB
);

CREATE INDEX idx_share2dm_payments_brand_id ON share2dm_payments(brand_id);

ALTER TABLE share2dm_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON share2dm_payments FOR ALL USING (true);
