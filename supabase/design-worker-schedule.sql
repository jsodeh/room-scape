-- Operational configuration, applied after the additive migration. The worker
-- token is generated/configured separately and never committed in this file.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;
create or replace function public.design_dispatch_worker(p_operation text default 'work') returns bigint
language plpgsql security definer set search_path='' as $$
declare worker_token text;request_id bigint;
begin
  if p_operation not in ('work','models') then raise exception 'Unknown worker operation'; end if;
  select decrypted_secret into worker_token from vault.decrypted_secrets where name='roomscape_worker_token' limit 1;
  if worker_token is null then raise exception 'Internal worker credential not configured'; end if;
  select net.http_post(
    url:='https://fkptdunoizrlkqwdmcyi.supabase.co/functions/v1/design-worker',
    headers:=jsonb_build_object('Content-Type','application/json','x-roomscape-worker-token',worker_token),
    body:=jsonb_build_object('operation',p_operation),timeout_milliseconds:=20000
  ) into request_id;
  return request_id;
end; $$;
revoke all on function public.design_dispatch_worker(text) from public,anon,authenticated;
grant execute on function public.design_dispatch_worker(text) to service_role;
select cron.schedule('roomscape-design-worker','* * * * *', $$select public.design_dispatch_worker('work');$$);
