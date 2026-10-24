-- Cancellation and a worker claim can arrive together. Lock the row so the
-- cancellation intent cannot disappear between a read and a conditional write.
create function public.design_cancel_job(p_job uuid,p_user uuid) returns void
language plpgsql security definer set search_path='' as $$
declare job public.design_jobs;
begin
  select * into job from public.design_jobs where id=p_job and user_id=p_user for update;
  if job.id is null then raise exception 'Generation not found'; end if;
  if job.status in ('queued','needs_recovery') then
    update public.design_jobs set status='cancelled',cancel_requested=true,updated_at=now() where id=job.id;
  elsif job.status in ('running','saving') then
    update public.design_jobs set cancel_requested=true,updated_at=now() where id=job.id;
  end if;
end; $$;
revoke all on function public.design_cancel_job(uuid,uuid) from public,anon,authenticated;
grant execute on function public.design_cancel_job(uuid,uuid) to service_role;
