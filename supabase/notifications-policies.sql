-- notifications-policies.sql
-- Stage 2D: RLS policies for in_app_notifications.
-- Idempotent and non-destructive.

-- ── Drop existing policies (idempotent) ──────────────────────────────────────
drop policy if exists "notifications_select_own"    on in_app_notifications;
drop policy if exists "notifications_update_own"    on in_app_notifications;
drop policy if exists "notifications_insert_actor"  on in_app_notifications;
drop policy if exists "notifications_delete_own"    on in_app_notifications;

-- ── SELECT: user can read their own notifications ─────────────────────────────
create policy "notifications_select_own"
  on in_app_notifications
  for select
  using (user_id = auth.uid());

-- ── UPDATE: user can only mark their own notifications as read ────────────────
-- Only read_at column should be updatable from client; enforce at service layer.
create policy "notifications_update_own"
  on in_app_notifications
  for update
  using (user_id = auth.uid());

-- ── INSERT: any authenticated user can create notifications ───────────────────
-- actor_id must match auth.uid() so the actor is always accountable.
-- user_id is the recipient and can differ (e.g. notifying a group owner).
-- Service layer is responsible for setting user_id correctly.
create policy "notifications_insert_actor"
  on in_app_notifications
  for insert
  with check (actor_id = auth.uid());

-- ── DELETE: user can delete their own notifications ───────────────────────────
create policy "notifications_delete_own"
  on in_app_notifications
  for delete
  using (user_id = auth.uid());
