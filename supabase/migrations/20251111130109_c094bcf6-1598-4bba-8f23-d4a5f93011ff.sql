-- Ativar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agendar execução diária da função de notificações às 8h
SELECT cron.schedule(
  'notificacoes-diarias-8am',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mfayoazhicnsvgqflfmh.supabase.co/functions/v1/notificacoes-automaticas',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mYXlvYXpoaWNuc3ZncWZsZm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTg3MDUsImV4cCI6MjA3ODM3NDcwNX0.e9WgB9bla-IQW_xhgRdpHncVB-AY9UZ__dC4DdHkxfU"}'::jsonb,
    body := concat('{"timestamp": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);
