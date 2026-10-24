-- Additive workflow schema. Browser clients read owned rows; only authenticated
-- Edge handlers and the internal worker may mutate workflow state.
alter table public.staging_projects add column workflow_version integer not null default 1;
alter table public.staging_projects add column original_asset_id uuid;
alter table public.staging_projects add column active_branch_id uuid;
alter table public.staging_projects add column current_version_id uuid;

create table public.design_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.staging_projects(id) on delete cascade,
  kind text not null check (kind in ('original','reference','generated')),
  bucket text not null check (bucket in ('room-images','design-results')),
  storage_path text not null,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  width integer not null check (width > 0 and width <= 16384),
  height integer not null check (height > 0 and height <= 16384),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 52428800),
  content_hash text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(id, project_id), unique(bucket,storage_path)
);
create index design_assets_project_idx on public.design_assets(project_id);

create table public.design_branches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.staging_projects(id) on delete cascade,
  name text not null,
  head_version_id uuid,
  forked_from_version_id uuid,
  context jsonb not null,
  context_revision integer not null default 0,
  created_at timestamptz not null default now(),
  unique(id, project_id)
);
create table public.design_turns (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.staging_projects(id) on delete cascade,
  branch_id uuid not null,
  base_version_id uuid not null,
  user_edit text not null check(length(user_edit) between 1 and 6000),
  scope text not null check(scope in ('branch','turn')),
  operation text not null check(operation in ('generate','refine','restyle','independent')),
  context_snapshot jsonb not null, manifest jsonb not null,
  created_at timestamptz not null default now(),
  unique(id,project_id),
  foreign key(branch_id,project_id) references public.design_branches(id,project_id) on delete cascade
);
create table public.design_versions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.staging_projects(id) on delete cascade,
  branch_id uuid not null, parent_version_id uuid, asset_id uuid not null, turn_id uuid,
  context_snapshot jsonb not null, label text not null,
  state text not null default 'candidate' check(state in ('candidate','accepted','rejected')),
  model text, image_size text, returned_model text,
  created_at timestamptz not null default now(), unique(id,project_id),
  foreign key(branch_id,project_id) references public.design_branches(id,project_id) on delete cascade,
  foreign key(asset_id,project_id) references public.design_assets(id,project_id),
  foreign key(parent_version_id,project_id) references public.design_versions(id,project_id),
  foreign key(turn_id,project_id) references public.design_turns(id,project_id)
);
alter table public.design_branches add constraint design_branch_head_fk foreign key(head_version_id,project_id) references public.design_versions(id,project_id) deferrable initially deferred;
alter table public.design_branches add constraint design_branch_fork_fk foreign key(forked_from_version_id,project_id) references public.design_versions(id,project_id) deferrable initially deferred;
alter table public.design_turns add constraint design_turn_base_fk foreign key(base_version_id,project_id) references public.design_versions(id,project_id);
alter table public.staging_projects add constraint project_original_asset_fk foreign key(original_asset_id,id) references public.design_assets(id,project_id) deferrable initially deferred;
alter table public.staging_projects add constraint project_current_version_fk foreign key(current_version_id,id) references public.design_versions(id,project_id) deferrable initially deferred;
alter table public.staging_projects add constraint project_active_branch_fk foreign key(active_branch_id,id) references public.design_branches(id,project_id) deferrable initially deferred;
create index design_versions_history_idx on public.design_versions(project_id,created_at);
create index design_turns_history_idx on public.design_turns(project_id,created_at);

create table public.design_reference_links (
  project_id uuid not null references public.staging_projects(id) on delete cascade,
  asset_id uuid not null references public.design_assets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_profile_version_id uuid,
  primary key(project_id,asset_id)
);
create table public.design_analyses (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  asset_id uuid not null references public.design_assets(id) on delete cascade,
  role text not null check(role in ('style','palette','materials','furniture','layout')),
  model text not null, schema_version integer not null, content_hash text not null,
  observations jsonb not null, uncertainty jsonb not null,
  created_at timestamptz not null default now(),
  unique(asset_id,role,model,schema_version,content_hash)
);
create table public.style_profiles (
  id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,latest_version_id uuid,created_at timestamptz not null default now()
);
create table public.style_profile_versions (
  id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.style_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version integer not null, context jsonb not null,created_at timestamptz not null default now(),
  unique(profile_id,version),unique(id,profile_id)
);
alter table public.style_profiles add foreign key(latest_version_id,id) references public.style_profile_versions(id,profile_id) deferrable initially deferred;
alter table public.design_reference_links add foreign key(source_profile_version_id) references public.style_profile_versions(id);

create table public.design_jobs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.staging_projects(id) on delete cascade,
  branch_id uuid not null, turn_id uuid not null, base_version_id uuid not null,
  context_revision integer not null, idempotency_key uuid not null, request_hash text not null,
  status text not null default 'queued' check(status in ('queued','running','saving','succeeded','failed','needs_recovery','cancelled')),
  quality text not null check(quality in ('quality','next','fast')),
  model text not null, image_size text not null check(image_size in ('1K','2K','4K')),
  error_code text,error_message text,result_version_ids uuid[] not null default '{}',
  cancel_requested boolean not null default false,
  claim_token uuid,lease_expires_at timestamptz,provider_interaction_id text,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
  unique(user_id,idempotency_key),
  foreign key(branch_id,project_id) references public.design_branches(id,project_id),
  foreign key(turn_id,project_id) references public.design_turns(id,project_id),
  foreign key(base_version_id,project_id) references public.design_versions(id,project_id)
);
create unique index design_one_active_branch_job on public.design_jobs(branch_id) where status in ('queued','running','saving','needs_recovery');
create index design_jobs_queue_idx on public.design_jobs(status,created_at);
create table public.design_provider_states (
  version_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.staging_projects(id) on delete cascade,
  state jsonb not null, resume_allowed boolean not null default false,created_at timestamptz not null default now(),
  foreign key(version_id,project_id) references public.design_versions(id,project_id) on delete cascade
);
create table public.design_capabilities (
  id boolean primary key default true check(id), models jsonb not null,worker_ready boolean not null default false,checked_at timestamptz not null default now()
);

-- Owner checks at the database boundary also protect future server changes.
create function public.design_check_owner() returns trigger language plpgsql set search_path='' as $$
declare expected uuid;
begin
  if tg_table_name = 'design_analyses' then select user_id into expected from public.design_assets where id=new.asset_id;
  elsif tg_table_name = 'style_profile_versions' then select user_id into expected from public.style_profiles where id=new.profile_id;
  else select user_id into expected from public.staging_projects where id=new.project_id;
  end if;
  if expected is null or expected <> new.user_id then raise exception 'Design ownership mismatch' using errcode='23514'; end if;
  if tg_table_name = 'design_reference_links' then
    if not exists(select 1 from public.design_assets a where a.id=new.asset_id and a.user_id=new.user_id) then raise exception 'Reference ownership mismatch' using errcode='23514'; end if;
    if new.source_profile_version_id is not null and not exists(select 1 from public.style_profile_versions v where v.id=new.source_profile_version_id and v.user_id=new.user_id) then raise exception 'Profile ownership mismatch' using errcode='23514'; end if;
  end if;
  return new;
end; $$;
do $$ declare name text; begin
  foreach name in array array['design_assets','design_branches','design_turns','design_versions','design_reference_links','design_analyses','style_profile_versions','design_jobs','design_provider_states'] loop
    execute format('create trigger design_owner_guard before insert or update on public.%I for each row execute function public.design_check_owner()',name);
  end loop;
end $$;
do $$ declare name text; begin
  foreach name in array array['design_assets','design_branches','design_turns','design_versions','design_reference_links','design_analyses','style_profiles','style_profile_versions','design_jobs'] loop
    execute format('alter table public.%I enable row level security',name);
    execute format('revoke all on public.%I from anon,authenticated',name);
    execute format('grant select on public.%I to authenticated',name);
    execute format('grant all on public.%I to service_role',name);
    execute format('create policy design_read_own on public.%I for select to authenticated using (user_id=(select auth.uid()))',name);
  end loop;
end $$;
-- Jobs contain internal leases/provider identifiers: expose a safe subset only.
revoke select on public.design_jobs from authenticated;
grant select(id,user_id,project_id,branch_id,turn_id,base_version_id,status,quality,model,image_size,error_code,error_message,result_version_ids,cancel_requested,created_at,updated_at) on public.design_jobs to authenticated;
alter table public.design_provider_states enable row level security;
alter table public.design_capabilities enable row level security;
revoke all on public.design_provider_states,public.design_capabilities from anon,authenticated;
grant all on public.design_provider_states,public.design_capabilities to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('design-results','design-results',true,52428800,array['image/jpeg','image/png','image/webp']);
create policy design_results_read on storage.objects for select to public using(bucket_id='design-results');
-- Results are worker-written only; user uploads still use room-images policies.

create function public.design_claim_job(p_job_id uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare job public.design_jobs;
begin
  update public.design_jobs set status='needs_recovery',error_code='worker_interrupted',error_message='Generation was interrupted; review before retrying to avoid another charge.',updated_at=now()
    where status in ('running','saving') and lease_expires_at < now();
  select * into job from public.design_jobs where status='queued' and (p_job_id is null or id=p_job_id)
    order by created_at for update skip locked limit 1;
  if job.id is null then return null; end if;
  update public.design_jobs set status='running',claim_token=gen_random_uuid(),lease_expires_at=now()+interval '4 minutes',updated_at=now() where id=job.id returning * into job;
  return to_jsonb(job);
end; $$;
revoke all on function public.design_claim_job(uuid) from public,anon,authenticated;
grant execute on function public.design_claim_job(uuid) to service_role;

create function public.design_submit_turn(p_job jsonb,p_turn jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare existing public.design_jobs;branch public.design_branches;job public.design_jobs;
begin
  select * into existing from public.design_jobs where user_id=(p_job->>'user_id')::uuid and idempotency_key=(p_job->>'idempotency_key')::uuid;
  if existing.id is not null then
    if existing.request_hash<>p_job->>'request_hash' then raise exception 'Idempotency key reused for different inputs' using errcode='23505'; end if;
    return to_jsonb(existing);
  end if;
  select * into branch from public.design_branches where id=(p_job->>'branch_id')::uuid for update;
  select * into existing from public.design_jobs where user_id=(p_job->>'user_id')::uuid and idempotency_key=(p_job->>'idempotency_key')::uuid;
  if existing.id is not null then
    if existing.request_hash<>p_job->>'request_hash' then raise exception 'Idempotency key reused for different inputs' using errcode='23505'; end if;
    return to_jsonb(existing);
  end if;
  if branch.id is null then raise exception 'Branch not found'; end if;
  if branch.user_id<>(p_job->>'user_id')::uuid or branch.project_id<>(p_job->>'project_id')::uuid then raise exception 'Branch ownership mismatch'; end if;
  if branch.head_version_id<>(p_job->>'base_version_id')::uuid or branch.context_revision<>(p_job->>'context_revision')::integer then raise exception 'The editing base or brief changed. Reload or fork the selected version.' using errcode='40001'; end if;
  insert into public.design_turns select * from jsonb_populate_record(null::public.design_turns,p_turn);
  insert into public.design_jobs select * from jsonb_populate_record(null::public.design_jobs,p_job) returning * into job;
  return to_jsonb(job);
end; $$;
revoke all on function public.design_submit_turn(jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.design_submit_turn(jsonb,jsonb) to service_role;

create function public.design_finish_job(p_job_id uuid,p_claim uuid,p_outputs jsonb,p_next_context jsonb,p_provider_state jsonb,p_resume boolean)
returns uuid[] language plpgsql security definer set search_path='' as $$
declare job public.design_jobs;item jsonb;ids uuid[]:='{}';first_id uuid;new_revision integer;
begin
  select * into job from public.design_jobs where id=p_job_id for update;
  if job.status='succeeded' then return job.result_version_ids; end if;
  if job.claim_token is distinct from p_claim or job.status not in ('running','saving','needs_recovery') then raise exception 'Job lease is not valid'; end if;
  for item in select * from jsonb_array_elements(p_outputs) loop
    insert into public.design_assets(id,user_id,project_id,kind,bucket,storage_path,mime_type,width,height,byte_size,content_hash)
      values((item->>'asset_id')::uuid,job.user_id,job.project_id,'generated','design-results',item->>'storage_path',item->>'mime_type',(item->>'width')::integer,(item->>'height')::integer,(item->>'byte_size')::bigint,item->>'content_hash') on conflict(id) do nothing;
    insert into public.design_versions(id,user_id,project_id,branch_id,parent_version_id,asset_id,turn_id,context_snapshot,label,model,image_size,returned_model)
      values((item->>'version_id')::uuid,job.user_id,job.project_id,job.branch_id,job.base_version_id,(item->>'asset_id')::uuid,job.turn_id,p_next_context,'Design '||to_char(now(),'HH24:MI'),job.model,job.image_size,item->>'returned_model') on conflict(id) do nothing;
    if p_provider_state is not null then insert into public.design_provider_states(version_id,user_id,project_id,state,resume_allowed)
      values((item->>'version_id')::uuid,job.user_id,job.project_id,p_provider_state,p_resume) on conflict(version_id) do nothing; end if;
    ids:=array_append(ids,(item->>'version_id')::uuid);
  end loop;
  if cardinality(ids)=0 then raise exception 'A generation must have a final image'; end if;
  first_id:=ids[1];
  if not job.cancel_requested then
    update public.design_branches set head_version_id=first_id,context=p_next_context,context_revision=context_revision+1
      where id=job.branch_id and head_version_id=job.base_version_id and context_revision=job.context_revision returning context_revision into new_revision;
    if new_revision is not null then update public.staging_projects set current_version_id=first_id,active_branch_id=job.branch_id,status='completed',error_message=null,
      staged_images=array(select 'https://fkptdunoizrlkqwdmcyi.supabase.co/storage/v1/object/public/design-results/'||a.storage_path from public.design_versions v join public.design_assets a on a.id=v.asset_id where v.id=any(ids))
      where id=job.project_id; end if;
  end if;
  update public.design_jobs set status=case when cancel_requested then 'cancelled' else 'succeeded' end,result_version_ids=ids,error_code=null,error_message=null,updated_at=now() where id=job.id;
  return ids;
end; $$;
revoke all on function public.design_finish_job(uuid,uuid,jsonb,jsonb,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.design_finish_job(uuid,uuid,jsonb,jsonb,jsonb,boolean) to service_role;

create function public.design_initialize_project(p_project uuid,p_user uuid,p_asset jsonb,p_branch jsonb,p_version jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare project public.staging_projects;
begin
  select * into project from public.staging_projects where id=p_project and user_id=p_user for update;
  if project.id is null then raise exception 'Project not found'; end if;
  if project.workflow_version=2 then return to_jsonb(project); end if;
  insert into public.design_assets select * from jsonb_populate_record(null::public.design_assets,p_asset);
  insert into public.design_branches select * from jsonb_populate_record(null::public.design_branches,p_branch);
  insert into public.design_versions select * from jsonb_populate_record(null::public.design_versions,p_version);
  update public.design_branches set head_version_id=(p_version->>'id')::uuid where id=(p_branch->>'id')::uuid;
  update public.staging_projects set workflow_version=2,original_asset_id=(p_asset->>'id')::uuid,active_branch_id=(p_branch->>'id')::uuid,current_version_id=(p_version->>'id')::uuid where id=p_project returning * into project;
  return to_jsonb(project);
end; $$;
revoke all on function public.design_initialize_project(uuid,uuid,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.design_initialize_project(uuid,uuid,jsonb,jsonb,jsonb) to service_role;

create function public.design_save_profile(p_user uuid,p_id uuid,p_version uuid,p_name text,p_context jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare profile public.style_profiles;number integer;
begin
  select * into profile from public.style_profiles where id=p_id for update;
  if profile.id is null then
    insert into public.style_profiles(id,user_id,name) values(p_id,p_user,p_name) returning * into profile;
  elsif profile.user_id<>p_user then raise exception 'Profile ownership mismatch'; end if;
  select coalesce(max(version),0)+1 into number from public.style_profile_versions where profile_id=p_id;
  insert into public.style_profile_versions(id,profile_id,user_id,version,context) values(p_version,p_id,p_user,number,p_context);
  update public.style_profiles set name=p_name,latest_version_id=p_version where id=p_id;
  return p_version;
end; $$;
revoke all on function public.design_save_profile(uuid,uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.design_save_profile(uuid,uuid,uuid,text,jsonb) to service_role;

create function public.design_set_version_state(p_version uuid,p_user uuid,p_state text) returns void
language plpgsql security definer set search_path='' as $$
declare version public.design_versions;parent public.design_versions;
begin
  if p_state not in ('accepted','rejected') then raise exception 'Invalid version state'; end if;
  select * into version from public.design_versions where id=p_version and user_id=p_user for update;
  if version.id is null or version.parent_version_id is null then raise exception 'Generated version not found'; end if;
  update public.design_versions set state=p_state where id=version.id;
  if p_state='rejected' then
    select * into parent from public.design_versions where id=version.parent_version_id;
    update public.design_branches set head_version_id=parent.id,context=parent.context_snapshot,context_revision=context_revision+1 where project_id=version.project_id and head_version_id=version.id;
    update public.design_provider_states set resume_allowed=false where project_id=version.project_id;
    update public.staging_projects set current_version_id=parent.id,
      status=case when parent.parent_version_id is null then 'pending' else 'completed' end,
      staged_images=case when parent.parent_version_id is null then '{}'::text[] else array[(select 'https://fkptdunoizrlkqwdmcyi.supabase.co/storage/v1/object/public/'||a.bucket||'/'||a.storage_path from public.design_assets a where a.id=parent.asset_id)] end
      where id=version.project_id and current_version_id=version.id;
  end if;
end; $$;
revoke all on function public.design_set_version_state(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.design_set_version_state(uuid,uuid,text) to service_role;

-- Retry-safe import of the last saved pre-workspace render. Only an untouched
-- root can be advanced, so a retry cannot overwrite subsequent editing work.
create function public.design_import_legacy(p_user uuid,p_project uuid,p_asset jsonb,p_version jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare project public.staging_projects;root public.design_versions;
begin
  select * into project from public.staging_projects where id=p_project and user_id=p_user for update;
  if project.id is null then raise exception 'Project not found'; end if;
  select * into root from public.design_versions where id=project.current_version_id;
  if root.parent_version_id is not null then return; end if;
  if exists(select 1 from public.design_jobs where project_id=p_project) then return; end if;
  insert into public.design_assets select * from jsonb_populate_record(null::public.design_assets,p_asset) on conflict(id) do nothing;
  insert into public.design_versions select * from jsonb_populate_record(null::public.design_versions,p_version) on conflict(id) do nothing;
  update public.design_branches set head_version_id=(p_version->>'id')::uuid where id=project.active_branch_id and head_version_id=root.id;
  update public.staging_projects set current_version_id=(p_version->>'id')::uuid where id=p_project;
end; $$;
revoke all on function public.design_import_legacy(uuid,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.design_import_legacy(uuid,uuid,jsonb,jsonb) to service_role;

create function public.design_immutable_record() returns trigger language plpgsql set search_path='' as $$
begin
  if tg_table_name='design_versions' then
    if (to_jsonb(new)-'state') is distinct from (to_jsonb(old)-'state') then raise exception 'Saved version contents are immutable'; end if;
  elsif tg_table_name='design_assets' then
    if (to_jsonb(new)-'deleted_at') is distinct from (to_jsonb(old)-'deleted_at') then raise exception 'Saved asset contents are immutable'; end if;
  else raise exception 'Saved context and profile versions are immutable'; end if;
  return new;
end; $$;
create trigger design_version_immutable before update on public.design_versions for each row execute function public.design_immutable_record();
create trigger design_asset_immutable before update on public.design_assets for each row execute function public.design_immutable_record();
create trigger design_turn_immutable before update on public.design_turns for each row execute function public.design_immutable_record();
create trigger style_version_immutable before update on public.style_profile_versions for each row execute function public.design_immutable_record();
