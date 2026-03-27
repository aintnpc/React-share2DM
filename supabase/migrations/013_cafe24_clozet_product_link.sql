-- Migration 013: Cafe24 상품 ↔ Clozet product 매핑
-- share2dm_cafe24_products에 Clozet product_id 연결 컬럼 추가
ALTER TABLE public.share2dm_cafe24_products
  ADD COLUMN IF NOT EXISTS clozet_product_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_share2dm_cafe24_products_clozet_id
  ON public.share2dm_cafe24_products(clozet_product_id);
