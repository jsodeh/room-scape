-- Initial Roomscape schema for project fkptdunoizrlkqwdmcyi.
-- Deliberately fail on conflicting existing tables; inspect a non-empty project first.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.furniture_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  image_url text not null default '',
  resource_type text not null default 'image' check (resource_type in ('image', 'pdf', 'url')),
  external_url text,
  pdf_url text,
  price numeric(12,2) check (price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staging_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled room',
  instructions text not null default '',
  furniture_ids uuid[] not null default '{}',
  original_images text[] not null default '{}',
  reference_image text,
  staged_images text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  has_feedback boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index staging_projects_user_created_idx on public.staging_projects(user_id, created_at desc);

create table public.project_feedback (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.staging_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comments text,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);
create index project_feedback_user_idx on public.project_feedback(user_id);

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger furniture_updated before update on public.furniture_items for each row execute function public.set_updated_at();
create trigger projects_updated before update on public.staging_projects for each row execute function public.set_updated_at();

create function public.create_user_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.create_user_profile() from public;
create trigger roomscape_user_created after insert on auth.users for each row execute function public.create_user_profile();
insert into public.profiles(id) select id from auth.users on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.furniture_items enable row level security;
alter table public.staging_projects enable row level security;
alter table public.project_feedback enable row level security;

revoke all on public.profiles, public.furniture_items, public.staging_projects, public.project_feedback from anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.furniture_items to authenticated;
grant select, insert, delete on public.staging_projects to authenticated;
grant update (title, instructions, reference_image, has_feedback) on public.staging_projects to authenticated;
grant select, insert, update, delete on public.project_feedback to authenticated;
grant all on public.profiles, public.furniture_items, public.staging_projects, public.project_feedback to service_role;

create policy profiles_read_own on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy furniture_read on public.furniture_items for select to authenticated using (true);
create policy furniture_admin_insert on public.furniture_items for insert to authenticated with check ((select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy furniture_admin_update on public.furniture_items for update to authenticated using ((select auth.jwt())->'app_metadata'->>'role' = 'admin') with check ((select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy furniture_admin_delete on public.furniture_items for delete to authenticated using ((select auth.jwt())->'app_metadata'->>'role' = 'admin');

create policy projects_read_own on public.staging_projects for select to authenticated using (user_id = (select auth.uid()));
create policy projects_insert_own on public.staging_projects for insert to authenticated with check (
  user_id = (select auth.uid()) and status = 'pending' and cardinality(staged_images) = 0 and error_message is null
);
create policy projects_update_own on public.staging_projects for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy projects_delete_own on public.staging_projects for delete to authenticated using (user_id = (select auth.uid()));

create policy feedback_read_own on public.project_feedback for select to authenticated using (user_id = (select auth.uid()));
create policy feedback_insert_own on public.project_feedback for insert to authenticated with check (
  user_id = (select auth.uid()) and exists (select 1 from public.staging_projects p where p.id = project_id and p.user_id = (select auth.uid()))
);
create policy feedback_update_own on public.project_feedback for update to authenticated using (user_id = (select auth.uid())) with check (
  user_id = (select auth.uid()) and exists (select 1 from public.staging_projects p where p.id = project_id and p.user_id = (select auth.uid()))
);
create policy feedback_delete_own on public.project_feedback for delete to authenticated using (user_id = (select auth.uid()));

-- Existing UI uses public image URLs. Writes are scoped to the caller's folder.
-- PDF resources are supported only for trusted furniture administrators.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('room-images', 'room-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
create policy room_images_read on storage.objects for select to public using (bucket_id = 'room-images');
create policy room_images_insert_own on storage.objects for insert to authenticated with check (
  bucket_id = 'room-images' and (storage.foldername(name))[1] = (select auth.uid())::text
  and ((lower(storage.extension(name)) <> 'pdf' and coalesce(lower(metadata->>'mimetype'), '') <> 'application/pdf') or (select auth.jwt())->'app_metadata'->>'role' = 'admin')
);
create policy room_images_update_own on storage.objects for update to authenticated using (
  bucket_id = 'room-images' and (storage.foldername(name))[1] = (select auth.uid())::text
) with check (
  bucket_id = 'room-images' and (storage.foldername(name))[1] = (select auth.uid())::text
  and ((lower(storage.extension(name)) <> 'pdf' and coalesce(lower(metadata->>'mimetype'), '') <> 'application/pdf') or (select auth.jwt())->'app_metadata'->>'role' = 'admin')
);
create policy room_images_delete_own on storage.objects for delete to authenticated using (
  bucket_id = 'room-images' and (storage.foldername(name))[1] = (select auth.uid())::text
);
