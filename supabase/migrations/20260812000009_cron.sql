-- 009: pg_cron — liberación automática de reservas vencidas (TTL 20 min)

-- Verifica que el extension exista antes de agendar
do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'release-expired-reservations',
      '*/5 * * * *',
      $$select public.release_expired_reservations()$$
    );
  end if;
end;
$cron$;
