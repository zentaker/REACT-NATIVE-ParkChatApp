-- ============================================================
-- Aldea / ParkChat — Database Schema
-- REFLECTS the ACTUAL Supabase DB (synced via OpenAPI 2026-05-23).
-- The tables already exist in the Supabase project.
-- Run this only for fresh project setup.
-- Run policies.sql separately to apply RLS.
-- ============================================================

-- Trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── profiles ───────────────────────────────────────────────
-- NOTE: actual DB has: id, username, display_name, avatar_url,
--       bio, role, safety_mode, created_at, updated_at
-- 'role' replaced legacy 'is_moderator' boolean.
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique,
  display_name text,
  avatar_url   text,
  bio          text,
  role         text not null default 'user',  -- 'user'|'moderator'|'admin'
  safety_mode  text not null default 'standard',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Migrate old is_moderator → role (safe no-op if already migrated)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='profiles' and column_name='is_moderator'
  ) then
    update public.profiles set role='moderator' where is_moderator=true;
    alter table public.profiles drop column if exists is_moderator;
  end if;
end $$;

-- Add new columns if upgrading old schema
alter table public.profiles add column if not exists username text unique;
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists safety_mode text not null default 'standard';
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Aldeano'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── places ─────────────────────────────────────────────────
-- NOTE: actual DB has: type (not category), country (not district),
--       radius_meters, created_by, updated_at
create table if not exists public.places (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  type          text not null default 'other',  -- 'park'|'plaza'|'cafe'|'coworking'|'other'
  latitude      float8,
  longitude     float8,
  radius_meters int not null default 150,
  city          text not null,
  country       text,
  visibility    text not null default 'public',
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Migrate old schema (category→type, district→country)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='places' and column_name='category'
  ) then
    alter table public.places add column if not exists type text;
    update public.places set type=category where type is null;
    alter table public.places alter column type set not null;
    alter table public.places alter column type set default 'other';
    alter table public.places drop column if exists category;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='places' and column_name='district'
  ) then
    alter table public.places add column if not exists country text;
    update public.places set country=district where country is null;
    alter table public.places drop column if exists district;
  end if;
end $$;

alter table public.places add column if not exists radius_meters int not null default 150;
alter table public.places add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.places add column if not exists updated_at timestamptz not null default now();

drop trigger if exists places_set_updated_at on public.places;
create trigger places_set_updated_at
  before update on public.places
  for each row execute function public.set_updated_at();

create index if not exists places_city_visibility_idx on public.places(city, visibility);
create index if not exists places_lat_lng_idx on public.places(latitude, longitude);

-- ─── place_messages ─────────────────────────────────────────
-- NOTE: actual DB has client_id, moderation_status extras
create table if not exists public.place_messages (
  id                uuid primary key default gen_random_uuid(),
  place_id          uuid not null references public.places(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  body              text not null,
  client_id         text,
  moderation_status text not null default 'ok',
  created_at        timestamptz not null default now()
);

alter table public.place_messages add column if not exists client_id text;
alter table public.place_messages add column if not exists moderation_status text not null default 'ok';

create index if not exists place_messages_place_created_idx on public.place_messages(place_id, created_at);

-- ─── groups ─────────────────────────────────────────────────
-- NOTE: actual DB has access_level (not visibility), member_count, updated_at
create table if not exists public.groups (
  id           uuid primary key default gen_random_uuid(),
  place_id     uuid references public.places(id) on delete set null,
  created_by   uuid references auth.users(id) on delete set null,
  name         text not null,
  description  text,
  access_level text not null default 'public',
  member_count int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Migrate old visibility → access_level
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='groups' and column_name='visibility'
  ) then
    alter table public.groups add column if not exists access_level text;
    update public.groups set access_level=visibility where access_level is null;
    alter table public.groups alter column access_level set not null;
    alter table public.groups alter column access_level set default 'public';
    alter table public.groups drop column if exists visibility;
  end if;
end $$;

alter table public.groups add column if not exists member_count int not null default 0;
alter table public.groups add column if not exists updated_at timestamptz not null default now();

drop trigger if exists groups_set_updated_at on public.groups;
create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

create index if not exists groups_place_idx on public.groups(place_id);
create index if not exists groups_created_by_idx on public.groups(created_by);

-- ─── group_members ──────────────────────────────────────────
-- NOTE: actual DB has id PK, joined_at, approved_at, approved_by
create table if not exists public.group_members (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'member',
  status      text not null default 'active',
  joined_at   timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  unique (group_id, user_id)
);

alter table public.group_members add column if not exists status text not null default 'active';
alter table public.group_members add column if not exists approved_at timestamptz;
alter table public.group_members add column if not exists approved_by uuid references auth.users(id) on delete set null;

create index if not exists group_members_group_status_idx on public.group_members(group_id, status);

-- ─── events ─────────────────────────────────────────────────
create table if not exists public.events (
  id                uuid primary key default gen_random_uuid(),
  place_id          uuid references public.places(id) on delete set null,
  group_id          uuid references public.groups(id) on delete set null,
  created_by        uuid references auth.users(id) on delete set null,
  title             text not null,
  description       text,
  starts_at         timestamptz not null,
  ends_at           timestamptz,
  capacity          int,
  access_level      text not null default 'public',
  source_type       text not null default 'place',
  source_message_id uuid references public.place_messages(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.events add column if not exists capacity int;
alter table public.events add column if not exists access_level text not null default 'public';
alter table public.events add column if not exists source_type text not null default 'place';
alter table public.events add column if not exists source_message_id uuid references public.place_messages(id) on delete set null;
alter table public.events add column if not exists updated_at timestamptz not null default now();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create index if not exists events_place_starts_idx on public.events(place_id, starts_at);
create index if not exists events_created_by_idx on public.events(created_by);

-- ─── event_rsvps ────────────────────────────────────────────
create table if not exists public.event_rsvps (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  status     text not null default 'going',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

alter table public.event_rsvps add column if not exists updated_at timestamptz not null default now();

-- ─── reports ────────────────────────────────────────────────
-- NOTE: actual DB uses per-type FK columns (not target_type/target_id)
create table if not exists public.reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete set null,
  place_id         uuid references public.places(id) on delete set null,
  message_id       uuid references public.place_messages(id) on delete set null,
  group_id         uuid references public.groups(id) on delete set null,
  event_id         uuid references public.events(id) on delete set null,
  reason           text not null,
  details          text,
  status           text not null default 'pending',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.reports add column if not exists reported_user_id uuid references auth.users(id) on delete set null;
alter table public.reports add column if not exists place_id uuid references public.places(id) on delete set null;
alter table public.reports add column if not exists message_id uuid references public.place_messages(id) on delete set null;
alter table public.reports add column if not exists group_id uuid references public.groups(id) on delete set null;
alter table public.reports add column if not exists event_id uuid references public.events(id) on delete set null;
alter table public.reports add column if not exists updated_at timestamptz not null default now();

create index if not exists reports_reporter_idx on public.reports(reporter_id);
create index if not exists reports_status_created_idx on public.reports(status, created_at desc);

-- ─── blocks ─────────────────────────────────────────────────
create table if not exists public.blocks (
  id         uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists blocks_blocker_idx on public.blocks(blocker_id);

-- ─── Realtime ────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'place_messages'
    ) then
      execute 'alter publication supabase_realtime add table public.place_messages';
    end if;
  end if;
end $$;
