-- SLYHS admin panel setup. Run once in the Supabase SQL editor of the "slyhs" project.
-- Safe to run again. It does NOT touch your existing registration / newsletter data.
--
-- Access model: the public website key can only call the small read functions at the bottom.
-- Everything else (all tables) can be read or changed only by a signed-in user who is listed in
-- public.admins.

-- ---------------------------------------------------------------- admins
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists admins_self_or_admin on public.admins;
create policy admins_self_or_admin on public.admins for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists admins_manage on public.admins;
create policy admins_manage on public.admins for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- events
create table if not exists public.events (
  id text primary key,
  title text not null,
  tag text not null default 'Suggestion',
  featured boolean not null default false,        -- the "first meeting" style card
  where_text text not null default '',
  lang_text text not null default '',
  starts_at timestamptz,                          -- empty = date not decided yet
  link text not null default '',                  -- meeting link, https only
  published boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now(),
  constraint events_link_https check (link = '' or link ~* '^https://')
);
alter table public.events enable row level security;
drop policy if exists events_admin on public.events;
create policy events_admin on public.events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

insert into public.events (id, title, tag, featured, where_text, sort_order) values
  ('first-meeting', 'First online meeting: name the society, meet the committee', 'First meeting', true, 'Online', 1),
  ('herp-talk', 'Herp Talk: frogs of the wet zone', 'Suggestion', false, 'Online', 2),
  ('field-walk', 'Reading a habitat safely: an Explorer field walk', 'Suggestion', false, '', 3)
on conflict (id) do nothing;

-- ---------------------------------------------------------------- site settings
create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
drop policy if exists site_settings_admin on public.site_settings;
create policy site_settings_admin on public.site_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

insert into public.site_settings (key, value) values
  ('contact_email', ''),
  ('proposer_name', 'Mithra Yohan'),
  ('proposer_email', 'mithrayohan@gmail.com'),
  ('facebook_url', ''),
  ('instagram_url', ''),
  ('youtube_url', ''),
  ('whatsapp_url', '')
on conflict (key) do nothing;

-- ---------------------------------------------------------------- policy pages
create table if not exists public.policies (
  slug text primary key check (slug in ('privacy', 'ethics', 'safeguarding')),
  title text not null,
  lead text not null default '',
  updated text not null default '',
  sections jsonb not null default '[]'::jsonb,    -- [[heading, [paragraph, ...]], ...]
  updated_at timestamptz not null default now()
);
alter table public.policies enable row level security;
drop policy if exists policies_admin on public.policies;
create policy policies_admin on public.policies for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- blog posts
create table if not exists public.posts (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  excerpt text not null default '',
  body text not null default '',                  -- "## Heading" lines and paragraphs (plain text, no HTML)
  cover_url text not null default '' check (cover_url = '' or cover_url ~* '^https://'),
  author text not null default '',
  published boolean not null default false,       -- drafts stay hidden from the website
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.posts enable row level security;
drop policy if exists posts_admin on public.posts;
create policy posts_admin on public.posts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- members + newsletter (admin only)
drop policy if exists registrations_admin_read on public.registrations;
create policy registrations_admin_read on public.registrations for select to authenticated using (public.is_admin());
drop policy if exists registrations_admin_delete on public.registrations;
create policy registrations_admin_delete on public.registrations for delete to authenticated using (public.is_admin());

drop policy if exists newsletter_admin_read on public.newsletter_subscribers;
create policy newsletter_admin_read on public.newsletter_subscribers for select to authenticated using (public.is_admin());
drop policy if exists newsletter_admin_delete on public.newsletter_subscribers;
create policy newsletter_admin_delete on public.newsletter_subscribers for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------- public read functions (website key)
create or replace function public.get_site_events()
returns jsonb language sql security definer stable set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'title', title, 'tag', tag, 'featured', featured,
    'where', where_text, 'lang', lang_text, 'date', starts_at, 'link', link
  ) order by sort_order, starts_at nulls last, id), '[]'::jsonb)
  from public.events where published;
$$;

create or replace function public.get_site_settings()
returns jsonb language sql security definer stable set search_path = public as $$
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) from public.site_settings;
$$;

create or replace function public.get_policies()
returns jsonb language sql security definer stable set search_path = public as $$
  select coalesce(jsonb_object_agg(slug, jsonb_build_object(
    'title', title, 'lead', lead, 'updated', updated, 'sections', sections)), '{}'::jsonb)
  from public.policies;
$$;

create or replace function public.get_posts()
returns jsonb language sql security definer stable set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'slug', slug, 'title', title, 'excerpt', excerpt, 'body', body, 'cover', cover_url,
    'author', author, 'date', coalesce(published_at, created_at)
  ) order by coalesce(published_at, created_at) desc), '[]'::jsonb)
  from public.posts where published;
$$;

revoke all on function public.get_site_events(), public.get_site_settings(), public.get_policies(), public.get_posts() from public;
grant execute on function public.get_site_events(), public.get_site_settings(), public.get_policies(), public.get_posts() to anon, authenticated;

-- ---------------------------------------------------------------- make yourself an admin
-- 1. Supabase dashboard -> Authentication -> Users -> Add user (your email + a strong password).
-- 2. Run this with your email:
--      insert into public.admins (user_id, email)
--      select id, email from auth.users where email = 'you@example.com';
-- 3. Turn OFF public sign-ups: Authentication -> Sign In / Providers -> "Allow new users to sign up".
