-- ─── Stage 2F: Analytics + Pilot Feedback ────────────────────────────────────
-- Idempotent. Safe to re-run. Never drops tables or deletes data.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── product_events ──────────────────────────────────────────────────────────
create table if not exists public.product_events (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.profiles(id) on delete set null,
  event_name     text not null,
  place_id       uuid references public.places(id) on delete set null,
  group_id       uuid references public.groups(id) on delete set null,
  app_event_id   uuid references public.events(id) on delete set null,
  topic_tag_id   uuid references public.topic_tags(id) on delete set null,
  metadata       jsonb not null default '{}',
  session_id     text,
  platform       text,
  created_at     timestamptz not null default now()
);

-- indexes
create index if not exists product_events_user_created_idx
  on public.product_events(user_id, created_at desc);

create index if not exists product_events_name_created_idx
  on public.product_events(event_name, created_at desc);

create index if not exists product_events_place_created_idx
  on public.product_events(place_id, created_at desc);

create index if not exists product_events_group_created_idx
  on public.product_events(group_id, created_at desc);

create index if not exists product_events_app_event_created_idx
  on public.product_events(app_event_id, created_at desc);

create index if not exists product_events_created_idx
  on public.product_events(created_at desc);

-- enable RLS
alter table public.product_events enable row level security;

-- ─── pilot_feedback ───────────────────────────────────────────────────────────
create table if not exists public.pilot_feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete set null,
  place_id    uuid references public.places(id) on delete set null,
  rating      integer check (rating between 1 and 5),
  category    text,
  message     text,
  created_at  timestamptz not null default now()
);

-- indexes
create index if not exists pilot_feedback_user_created_idx
  on public.pilot_feedback(user_id, created_at desc);

create index if not exists pilot_feedback_place_idx
  on public.pilot_feedback(place_id, created_at desc);

create index if not exists pilot_feedback_category_idx
  on public.pilot_feedback(category, created_at desc);

-- enable RLS
alter table public.pilot_feedback enable row level security;
