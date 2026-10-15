-- Adds the Animals section of the admin panel. Run once in the Supabase SQL editor (after admin_setup.sql).
-- Safe to run again.

create table if not exists public.animals (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  sci text not null default '',
  local_name text not null default '',
  kind text not null default 'Snakes' check (kind in ('Snakes', 'Frogs', 'Lizards', 'Turtles')),
  group_text text not null default '',
  status text not null default '' check (status in ('', 'Least Concern', 'Near Threatened', 'Vulnerable', 'Endangered')),
  danger text not null default '' check (danger in ('', 'venomous', 'harmless')),
  endemic boolean not null default true,
  size_label text not null default '',
  image_url text not null default '' check (image_url = '' or image_url ~* '^https://'),
  credit text not null default '',
  description text not null default '',
  facts text not null default '',                 -- "Label: text" per line
  published boolean not null default true,
  sort_order int not null default 100,
  updated_at timestamptz not null default now()
);
alter table public.animals add column if not exists credit text not null default '';
alter table public.animals enable row level security;
drop policy if exists animals_admin on public.animals;
create policy animals_admin on public.animals for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.get_animals()
returns jsonb language sql security definer stable set search_path = public as $$
  select coalesce(jsonb_agg(to_jsonb(a) - 'updated_at' - 'published' order by sort_order, name), '[]'::jsonb)
  from public.animals a where published;
$$;
revoke all on function public.get_animals() from public;
grant execute on function public.get_animals() to anon, authenticated;

-- photo storage: public to read (the website shows the pictures), only admins can upload or delete
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('animal-photos', 'animal-photos', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 3145728, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists animal_photos_admin_insert on storage.objects;
create policy animal_photos_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'animal-photos' and public.is_admin());
drop policy if exists animal_photos_admin_update on storage.objects;
create policy animal_photos_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'animal-photos' and public.is_admin());
drop policy if exists animal_photos_admin_delete on storage.objects;
create policy animal_photos_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'animal-photos' and public.is_admin());
