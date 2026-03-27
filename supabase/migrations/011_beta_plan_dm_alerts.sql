-- 베타 플랜 추가: plan CHECK constraint에 'beta' 추가
ALTER TABLE share2dm_brands DROP CONSTRAINT IF EXISTS share2dm_brands_plan_check;
ALTER TABLE share2dm_brands ADD CONSTRAINT share2dm_brands_plan_check
  CHECK (plan IN ('free', 'beta', 'standard', 'growth', 'pro'));

-- DM 한도 경고/초과 이메일 중복 방지 컬럼 (YYYY-MM 형식, 월 1회만 발송)
ALTER TABLE share2dm_brands
  ADD COLUMN IF NOT EXISTS dm_warning_sent_month TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dm_exceeded_sent_month TEXT DEFAULT NULL;
