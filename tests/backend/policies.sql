insert into auth.users values ('00000000-0000-4000-8000-000000000001'), ('00000000-0000-4000-8000-000000000002');
do $$ begin assert (select count(*) from public.profiles) = 2, 'signup trigger must create profiles'; end $$;
insert into public.staging_projects(id, user_id) values ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002');
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
set request.jwt.claims = '{"app_metadata":{},"user_metadata":{"role":"admin"}}';
insert into public.staging_projects(id, user_id) values ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001');
do $$ begin
  assert (select count(*) from public.staging_projects) = 1, 'projects must be isolated by owner';
  assert (select count(*) from public.profiles) = 1, 'profiles must be isolated by owner';
  begin
    insert into public.staging_projects(user_id) values ('00000000-0000-4000-8000-000000000002');
    raise exception 'cross-user project creation was permitted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.staging_projects(user_id, status) values ('00000000-0000-4000-8000-000000000001', 'completed');
    raise exception 'client forged completed generation';
  exception when insufficient_privilege then null; end;
  begin
    update public.staging_projects set status = 'completed';
    raise exception 'client updated privileged generation columns';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.project_feedback(project_id, user_id, rating) values ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 5);
    raise exception 'feedback was permitted for another user''s project';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.furniture_items(name, category) values ('Unauthorized', 'chair');
    raise exception 'user metadata escalated furniture administration';
  exception when insufficient_privilege then null; end;
end $$;
insert into public.project_feedback(project_id, user_id, rating) values ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 5);
update public.staging_projects set title = 'My room' where id = '10000000-0000-4000-8000-000000000001';
insert into storage.objects(bucket_id, name) values ('room-images', '00000000-0000-4000-8000-000000000001/room-images/photo.jpg');
do $$ begin
  begin
    insert into storage.objects(bucket_id, name) values ('room-images', '00000000-0000-4000-8000-000000000002/room-images/photo.jpg');
    raise exception 'cross-user storage upload was permitted';
  exception when insufficient_privilege then null; end;
  begin
    insert into storage.objects(bucket_id, name) values ('room-images', '00000000-0000-4000-8000-000000000001/furniture/document.pdf');
    raise exception 'non-admin PDF upload was permitted';
  exception when insufficient_privilege then null; end;
end $$;
set request.jwt.claims = '{"app_metadata":{"role":"admin"}}';
insert into public.furniture_items(name, category) values ('Trusted catalog item', 'chair');
insert into storage.objects(bucket_id, name) values ('room-images', '00000000-0000-4000-8000-000000000001/furniture/document.pdf');
set role anon;
do $$ begin
  begin
    perform * from public.staging_projects;
    raise exception 'anonymous user read projects';
  exception when insufficient_privilege then null; end;
  assert (select count(*) from storage.objects) = 2, 'existing public-image flow must remain readable';
end $$;
set role service_role;
update public.staging_projects set status = 'completed', staged_images = array['https://example.test/result.png'];
reset role;
do $$ begin assert (select count(*) from public.staging_projects where status = 'completed') = 2, 'service role must update generation results'; end $$;
select 'Database migration and ownership/admin/storage policy checks passed' as result;
