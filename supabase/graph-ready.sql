-- ============================================================
-- Aldea / ParkChat — Stage 2A: Graph-ready schema
-- Non-destructive: only adds new tables, never drops existing ones.
-- Idempotent: safe to re-run.
-- Run via: npm run supabase:apply:graph
-- ============================================================

-- ─── user_places ────────────────────────────────────────────
-- Tracks the relationship between a user and a physical place.
-- Populated automatically when a user opens a place detail screen.
create table if not exists public.user_places (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  place_id          uuid not null references public.places(id) on delete cascade,
  relationship_type text not null default 'visited',  -- 'visited'|'active'|'regular'|'organizer'
  last_seen_at      timestamptz not null default now(),
  visit_count       integer not null default 1,
  created_at        timestamptz not null default now(),
  unique(user_id, place_id)
);

create index if not exists user_places_user_id_idx   on public.user_places(user_id);
create index if not exists user_places_place_id_idx  on public.user_places(place_id);
create index if not exists user_places_last_seen_idx on public.user_places(last_seen_at desc);

alter table public.user_places enable row level security;

-- ─── topic_tags ─────────────────────────────────────────────
-- Canonical set of topic tags. Created when a hashtag is first used.
create table if not exists public.topic_tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null,
  created_at timestamptz not null default now(),
  unique(name),
  unique(slug)
);

create index if not exists topic_tags_slug_idx on public.topic_tags(slug);

alter table public.topic_tags enable row level security;

-- ─── message_topic_tags ─────────────────────────────────────
-- Junction: a place_message can have multiple topic_tags.
create table if not exists public.message_topic_tags (
  id            uuid primary key default gen_random_uuid(),
  message_id    uuid not null references public.place_messages(id) on delete cascade,
  topic_tag_id  uuid not null references public.topic_tags(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique(message_id, topic_tag_id)
);

create index if not exists message_topic_tags_message_idx on public.message_topic_tags(message_id);
create index if not exists message_topic_tags_topic_idx   on public.message_topic_tags(topic_tag_id);

alter table public.message_topic_tags enable row level security;

-- ─── place_topics ───────────────────────────────────────────
-- Aggregated topic weight per place. Updated when messages with hashtags are sent.
create table if not exists public.place_topics (
  id              uuid primary key default gen_random_uuid(),
  place_id        uuid not null references public.places(id) on delete cascade,
  topic_tag_id    uuid not null references public.topic_tags(id) on delete cascade,
  weight          integer not null default 1,
  last_activity_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique(place_id, topic_tag_id)
);

create index if not exists place_topics_place_id_idx      on public.place_topics(place_id);
create index if not exists place_topics_weight_idx        on public.place_topics(weight desc);
create index if not exists place_topics_last_activity_idx on public.place_topics(last_activity_at desc);

alter table public.place_topics enable row level security;

-- ─── user_topic_interests ───────────────────────────────────
-- Tracks which topics a user is interested in (manual or derived from hashtag usage).
create table if not exists public.user_topic_interests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  topic_tag_id  uuid not null references public.topic_tags(id) on delete cascade,
  source        text not null default 'manual',  -- 'manual'|'hashtag'|'derived'
  weight        integer not null default 1,
  created_at    timestamptz not null default now(),
  unique(user_id, topic_tag_id)
);

create index if not exists user_topic_interests_user_id_idx on public.user_topic_interests(user_id);
create index if not exists user_topic_interests_topic_idx   on public.user_topic_interests(topic_tag_id);

alter table public.user_topic_interests enable row level security;

-- ─── user_connections ───────────────────────────────────────
-- Weak-edge social graph: records that two users co-participated in a place/group/event.
-- Not a friendship model — just context-based proximity signals.
create table if not exists public.user_connections (
  id         uuid primary key default gen_random_uuid(),
  user_a     uuid not null references public.profiles(id) on delete cascade,
  user_b     uuid not null references public.profiles(id) on delete cascade,
  source     text not null,                    -- 'place'|'group'|'event'
  place_id   uuid references public.places(id) on delete set null,
  event_id   uuid references public.events(id) on delete set null,
  group_id   uuid references public.groups(id) on delete set null,
  weight     integer not null default 1,
  created_at timestamptz not null default now(),
  constraint user_connections_no_self_loop check (user_a <> user_b)
);

create unique index if not exists user_connections_unique_idx on public.user_connections(
  user_a, user_b, source,
  coalesce(place_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(event_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

create index if not exists user_connections_user_a_idx   on public.user_connections(user_a);
create index if not exists user_connections_user_b_idx   on public.user_connections(user_b);
create index if not exists user_connections_place_id_idx on public.user_connections(place_id) where place_id is not null;

alter table public.user_connections enable row level security;
