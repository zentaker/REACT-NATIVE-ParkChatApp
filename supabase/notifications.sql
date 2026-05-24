-- notifications.sql
-- Stage 2D: in-app notification table.
-- Idempotent and non-destructive.

-- ── Table ─────────────────────────────────────────────────────────────────────
create table if not exists in_app_notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  actor_id    uuid references profiles(id) on delete set null,
  place_id    uuid references places(id) on delete set null,
  group_id    uuid references groups(id) on delete set null,
  event_id    uuid references events(id) on delete set null,
  report_id   uuid references reports(id) on delete set null,
  type        text not null,
  title       text not null,
  body        text,
  read_at     timestamptz,
  created_at  timestamptz default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists in_app_notifications_user_created_idx
  on in_app_notifications(user_id, created_at desc);

create index if not exists in_app_notifications_user_read_idx
  on in_app_notifications(user_id, read_at);

create index if not exists in_app_notifications_type_idx
  on in_app_notifications(type);

create index if not exists in_app_notifications_group_idx
  on in_app_notifications(group_id);

create index if not exists in_app_notifications_event_idx
  on in_app_notifications(event_id);

create index if not exists in_app_notifications_place_idx
  on in_app_notifications(place_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table in_app_notifications enable row level security;

-- Notification type check constraint (open-ended but validated at service layer)
-- Types: group_join_request, group_member_approved, group_member_rejected,
--        event_rsvp_changed, report_created, report_status_changed,
--        geofence_blocked_post, topic_trending
