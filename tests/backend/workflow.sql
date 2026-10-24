insert into auth.users values ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
insert into public.staging_projects(id,user_id) values('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001'),('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002');
do $$
declare
  u uuid:='00000000-0000-4000-8000-000000000001';p uuid:='10000000-0000-4000-8000-000000000001';
  a uuid:=gen_random_uuid();b uuid:=gen_random_uuid();v uuid:=gen_random_uuid();
  turn public.design_turns;job public.design_jobs;claimed jsonb;output jsonb;results uuid[];ctx jsonb:='{"brief":{"room":"Living room"},"references":[]}';
begin
  perform public.design_initialize_project(p,u,
    jsonb_build_object('id',a,'user_id',u,'project_id',p,'kind','original','bucket','room-images','storage_path',u||'/original.jpg','mime_type','image/jpeg','width',100,'height',100,'byte_size',100,'content_hash','test','created_at',now()),
    jsonb_build_object('id',b,'user_id',u,'project_id',p,'name','Main','context',ctx,'context_revision',0,'created_at',now()),
    jsonb_build_object('id',v,'user_id',u,'project_id',p,'branch_id',b,'asset_id',a,'context_snapshot',ctx,'label','Original','state','accepted','created_at',now()));
  assert (select workflow_version=2 and current_version_id=v from public.staging_projects where id=p);
  perform public.design_initialize_project(p,u,'{}','{}','{}');
  assert (select count(*) from public.design_versions where project_id=p)=1;
  turn.id:=gen_random_uuid();turn.user_id:=u;turn.project_id:=p;turn.branch_id:=b;turn.base_version_id:=v;turn.user_edit:='Add a cream sofa';turn.scope:='branch';turn.operation:='generate';turn.context_snapshot:=ctx;turn.manifest:='{}';turn.created_at:=now();
  job.id:=gen_random_uuid();job.user_id:=u;job.project_id:=p;job.branch_id:=b;job.turn_id:=turn.id;job.base_version_id:=v;job.context_revision:=0;job.idempotency_key:=gen_random_uuid();job.request_hash:='hash1';job.status:='queued';job.quality:='quality';job.model:='gemini-3-pro-image';job.image_size:='2K';job.result_version_ids:='{}';job.cancel_requested:=false;job.created_at:=now();job.updated_at:=now();
  perform public.design_submit_turn(to_jsonb(job),to_jsonb(turn));
  perform public.design_submit_turn(to_jsonb(job),to_jsonb(turn));
  assert (select count(*) from public.design_jobs)=1,'Retry must not create a second job';
  begin perform public.design_submit_turn(to_jsonb(job)||'{"request_hash":"different"}',to_jsonb(turn)); raise exception 'Idempotency conflict accepted'; exception when unique_violation then null; end;
  claimed:=public.design_claim_job();
  assert claimed->>'status'='running'; assert public.design_claim_job() is null,'Lease must not be claimed twice';
  output:=jsonb_build_array(jsonb_build_object('asset_id',gen_random_uuid(),'version_id',gen_random_uuid(),'storage_path',u||'/result.jpg','mime_type','image/jpeg','width',2048,'height',1536,'byte_size',1000,'content_hash','result-hash'));
  results:=public.design_finish_job(job.id,(claimed->>'claim_token')::uuid,output,ctx,'{"interactionId":"private-provider-id"}',true);
  assert (select head_version_id=results[1] from public.design_branches where id=b);
  assert (select status='succeeded' from public.design_jobs where id=job.id);
  assert public.design_finish_job(job.id,(claimed->>'claim_token')::uuid,output,ctx,null,false)=results;
  assert (select count(*) from public.design_versions)=2;
  begin update public.design_versions set label='mutated' where id=results[1]; raise exception 'Immutable version updated'; exception when raise_exception then if sqlerrm='Immutable version updated' then raise; end if; end;
  perform public.design_set_version_state(results[1],u,'rejected');
  assert (select head_version_id=v from public.design_branches where id=b);
  assert (select cardinality(staged_images)=0 from public.staging_projects where id=p);
  assert not (select resume_allowed from public.design_provider_states where version_id=results[1]);
  job.id:=gen_random_uuid();job.idempotency_key:=gen_random_uuid();job.turn_id:=gen_random_uuid();turn.id:=job.turn_id;
  begin perform public.design_submit_turn(to_jsonb(job),to_jsonb(turn)); raise exception 'Stale revision accepted'; exception when serialization_failure then null; end;
  job.context_revision:=(select context_revision from public.design_branches where id=b);
  perform public.design_submit_turn(to_jsonb(job),to_jsonb(turn));
  claimed:=public.design_claim_job();
  update public.design_jobs set lease_expires_at=now()-interval '1 minute' where id=job.id;
  assert public.design_claim_job() is null;
  assert (select status='needs_recovery' from public.design_jobs where id=job.id),'Interrupted job must not re-render';
  begin perform public.design_forget_provider_history(p,u); raise exception 'Active recovery result deleted'; exception when serialization_failure then null; end;
  perform public.design_cancel_job(job.id,u);
  assert (select status='cancelled' and cancel_requested from public.design_jobs where id=job.id);
  assert public.design_forget_provider_history(p,u)=1;
  assert (select delete_requested_at is not null and not resume_allowed from public.design_provider_states where version_id=results[1]);
  -- A late result is preserved but cannot overwrite a brief changed meanwhile.
  job.id:=gen_random_uuid();job.idempotency_key:=gen_random_uuid();job.turn_id:=gen_random_uuid();turn.id:=job.turn_id;
  job.context_revision:=(select context_revision from public.design_branches where id=b);
  perform public.design_submit_turn(to_jsonb(job),to_jsonb(turn));claimed:=public.design_claim_job();
  update public.design_branches set context_revision=context_revision+1 where id=b;
  output:=jsonb_build_array(jsonb_build_object('asset_id',gen_random_uuid(),'version_id',gen_random_uuid(),'storage_path',u||'/late.jpg','mime_type','image/jpeg','width',2048,'height',1536,'byte_size',1000,'content_hash','late-hash'));
  results:=public.design_finish_job(job.id,(claimed->>'claim_token')::uuid,output,ctx,null,false);
  assert (select head_version_id=v from public.design_branches where id=b),'Late render must not replace a changed branch';
  assert (select count(*) from public.design_versions where id=results[1])=1,'Late render must remain reviewable';
  begin insert into public.design_reference_links(project_id,asset_id,user_id) values('10000000-0000-4000-8000-000000000002',a,'00000000-0000-4000-8000-000000000002'); raise exception 'Foreign reference accepted'; exception when check_violation then null; end;
end $$;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
do $$ begin
  assert (select count(*) from public.design_versions)=0,'RLS must hide foreign history';
  begin perform provider_interaction_id from public.design_jobs; raise exception 'Provider IDs leaked'; exception when insufficient_privilege then null; end;
  begin perform * from public.design_provider_states; raise exception 'Provider state leaked'; exception when insufficient_privilege then null; end;
  begin perform public.design_claim_job(); raise exception 'Client claimed worker job'; exception when insufficient_privilege then null; end;
  begin insert into public.design_branches(project_id,user_id,name) values('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002','Forged'); raise exception 'Direct client write accepted'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'Workflow transactions, recovery, immutability, ownership and RLS checks passed' as result;
