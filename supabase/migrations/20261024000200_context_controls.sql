-- User-requested provider deletion is queued separately from paid inference.
alter table public.design_provider_states add column delete_requested_at timestamptz;
create function public.design_forget_provider_history(p_project uuid,p_user uuid) returns integer
language plpgsql security definer set search_path='' as $$
declare total integer;
begin
  perform 1 from public.staging_projects where id=p_project and user_id=p_user for update;
  if not found then raise exception 'Project not found'; end if;
  if exists(select 1 from public.design_jobs where project_id=p_project and status in ('queued','running','saving','needs_recovery')) then
    raise exception 'Finish or end active generations before deleting model conversations' using errcode='40001';
  end if;
  update public.design_provider_states set resume_allowed=false,delete_requested_at=coalesce(delete_requested_at,now()) where project_id=p_project and user_id=p_user;
  get diagnostics total=row_count;
  update public.design_branches set context=jsonb_set(context,'{epoch}',to_jsonb(gen_random_uuid()::text)),context_revision=context_revision+1 where project_id=p_project and user_id=p_user;
  return total;
end; $$;
revoke all on function public.design_forget_provider_history(uuid,uuid) from public,anon,authenticated;
grant execute on function public.design_forget_provider_history(uuid,uuid) to service_role;
