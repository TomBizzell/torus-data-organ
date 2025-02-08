
-- Enable the required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the OrbitDB sync to run every 5 minutes
SELECT cron.schedule(
  'sync-to-orbitdb',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://lecahcsrnyquowhmxwer.functions.supabase.co/orbitdb-sync',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
