-- Fix: add ON DELETE CASCADE to dm_queue campaign_id foreign key
-- Without this, deleting a campaign fails when dm_queue records still exist

ALTER TABLE public.share2dm_dm_queue
  DROP CONSTRAINT share2dm_dm_queue_campaign_id_fkey,
  ADD CONSTRAINT share2dm_dm_queue_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES public.share2dm_campaigns(id) ON DELETE CASCADE;
