-- Creator Pool 동의 여부 컬럼 추가
ALTER TABLE share2dm_brands
  ADD COLUMN IF NOT EXISTS creator_pool_agreed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS creator_pool_agreed_at TIMESTAMPTZ;
