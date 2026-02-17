-- Migration 004: Clozet 연결 지원
-- share2dm_brands에 Clozet 연결 정보 컬럼 추가
ALTER TABLE public.share2dm_brands
  ADD COLUMN IF NOT EXISTS clozet_seller_id UUID REFERENCES public.seller_profile(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS clozet_store_name TEXT,
  ADD COLUMN IF NOT EXISTS clozet_connected_at TIMESTAMPTZ;

-- share2dm_campaigns에 Clozet 콘텐츠 정보 컬럼 추가
ALTER TABLE public.share2dm_campaigns
  ADD COLUMN IF NOT EXISTS clozet_content_id UUID REFERENCES public.contents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS clozet_short_code TEXT,
  ADD COLUMN IF NOT EXISTS product_url_source TEXT DEFAULT 'manual'
    CHECK (product_url_source IN ('manual', 'clozet'));

-- Clozet B.O에서 share2dm 연결 시 발급하는 일회용 토큰 테이블
-- Clozet B.O가 이 테이블에 INSERT → share2dm Worker가 SELECT + 검증
CREATE TABLE IF NOT EXISTS public.share2dm_connect_tokens (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id UUID NOT NULL REFERENCES public.seller_profile(id) ON DELETE CASCADE,
  share2dm_brand_id UUID REFERENCES public.share2dm_brands(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '10 minutes',
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_share2dm_connect_tokens_expires
  ON public.share2dm_connect_tokens(expires_at);

-- RLS: Clozet B.O 프론트엔드(anon key)가 자신의 seller_profile에 대해서만 INSERT 가능
ALTER TABLE public.share2dm_connect_tokens ENABLE ROW LEVEL SECURITY;

-- RPC: 토큰 생성 (RLS 우회, 내부에서 auth.uid() 기반으로 seller_profile 검증)
CREATE OR REPLACE FUNCTION public.create_share2dm_connect_token(p_brand_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_seller_id uuid;
  v_token     uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT id INTO v_seller_id
  FROM seller_profile
  WHERE user_id = v_uid;

  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'seller profile not found';
  END IF;

  INSERT INTO share2dm_connect_tokens (seller_profile_id, share2dm_brand_id)
  VALUES (v_seller_id, p_brand_id)
  RETURNING token INTO v_token;

  RETURN v_token;
END;
$$;

-- RLS: INSERT는 RPC를 통해서만 허용 (직접 INSERT 차단)
ALTER TABLE public.share2dm_connect_tokens ENABLE ROW LEVEL SECURITY;
