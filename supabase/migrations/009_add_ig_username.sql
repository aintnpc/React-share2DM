-- Add ig_username column to share2dm_brands to store actual Instagram @handle
ALTER TABLE public.share2dm_brands ADD COLUMN IF NOT EXISTS ig_username TEXT;
