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
  description text not null default '',
  facts text not null default '',                 -- "Label: text" per line
  published boolean not null default true,
  sort_order int not null default 100,
  updated_at timestamptz not null default now()
);
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
