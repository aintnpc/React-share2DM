-- Migration 012: Cafe24 연결 지원
-- share2dm_brands에 Cafe24 OAuth 토큰 및 연결 정보 추가
ALTER TABLE public.share2dm_brands
  ADD COLUMN IF NOT EXISTS cafe24_mall_id TEXT,
  ADD COLUMN IF NOT EXISTS cafe24_access_token TEXT,
  ADD COLUMN IF NOT EXISTS cafe24_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS cafe24_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cafe24_connected_at TIMESTAMPTZ;

-- Cafe24 상품 캐시 테이블 (Cafe24 API에서 pull한 상품 정보 저장)
CREATE TABLE IF NOT EXISTS public.share2dm_cafe24_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.share2dm_brands(id) ON DELETE CASCADE,
  cafe24_product_no INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  price NUMERIC,
  image_url TEXT,
  product_url TEXT,
  is_active BOOLEAN DEFAULT true,
  synced_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id, cafe24_product_no)
);

CREATE INDEX IF NOT EXISTS idx_share2dm_cafe24_products_brand_id
  ON public.share2dm_cafe24_products(brand_id);

-- share2dm_campaigns의 product_url_source에 'cafe24' 추가
ALTER TABLE public.share2dm_campaigns
  DROP CONSTRAINT IF EXISTS share2dm_campaigns_product_url_source_check;

ALTER TABLE public.share2dm_campaigns
  ADD CONSTRAINT share2dm_campaigns_product_url_source_check
  CHECK (product_url_source IN ('manual', 'clozet', 'cafe24'));

-- 캠페인에 Cafe24 상품 연결 컬럼 추가
ALTER TABLE public.share2dm_campaigns
  ADD COLUMN IF NOT EXISTS cafe24_product_no INTEGER;
